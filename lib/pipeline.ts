import { getSupabaseServer } from './supabase';
import { getPdfText } from './pdf';
import { extractQuestionsFromText, Question } from './gemini';
import { generatePPTX } from './ppt';

export enum PipelineStep {
  UPLOADED = 'uploaded',
  READING_PDF = 'reading_pdf',
  EXTRACTING_QUESTIONS = 'extracting_questions',
  FORMATTING_SLIDES = 'formatting_slides',
  GENERATING_PPT = 'generating_ppt',
  FINALIZING = 'finalizing',
  COMPLETED = 'completed',
  FAILED = 'failed'
}

export class ProcessingPipeline {
  private id: string;
  private supabase = getSupabaseServer();

  constructor(id: string) {
    this.id = id;
  }

  private async updateStatus(status: PipelineStep, progress?: number, error?: string) {
    const updatePayload: any = { status };
    if (error) {
      updatePayload.stats = { lastError: error };
    }
    
    const { error: updateError } = await this.supabase
      .from('presentations')
      .update(updatePayload)
      .eq('id', this.id);
    
    if (updateError) console.error('Failed to update pipeline status:', updateError);
  }

  private async cleanup(pdfUrl?: string) {
    console.log('Cleaning up artifacts for failed pipeline:', this.id);
    try {
      const supabase = getSupabaseServer();
      
      // 1. Delete PDF from storage if it exists
      if (pdfUrl) {
        const filePath = pdfUrl.split('/pdfs/').pop();
        if (filePath) {
          await supabase.storage.from('pdfs').remove([decodeURIComponent(filePath)]);
        }
      }

      // 2. Delete PPT if any was uploaded
      await supabase.storage.from('pptxs').remove([`pptx/${this.id}.pptx`]);

      // 3. Ensure no partial upload record
      await supabase.from('uploads').delete().eq('id', this.id);

      // 4. Delete the presentation record itself LAST so polling can finish
      await supabase.from('presentations').delete().eq('id', this.id);
      
    } catch (e) {
      console.error('Cleanup failed:', e);
    }
  }

  async run() {
    const startTime = Date.now();
    let currentPdfUrl: string | undefined;

    try {
      // 1. Fetch presentation
      const { data: presentation, error: fetchError } = await this.supabase
        .from('presentations')
        .select('*')
        .eq('id', this.id)
        .single();

      if (fetchError || !presentation) throw new Error('Presentation not found');
      currentPdfUrl = presentation.pdf_url;

      // 2. Reading PDF
      await this.updateStatus(PipelineStep.READING_PDF);
      const pdfResponse = await fetch(presentation.pdf_url);
      if (!pdfResponse.ok) throw new Error('Failed to download PDF for processing.');
      
      const pdfBuffer = Buffer.from(await pdfResponse.arrayBuffer());
      const text = await getPdfText(pdfBuffer);

      if (!text || text.trim().length < 20) {
        throw new Error('PDF content is unreadable or contains too little text for extraction.');
      }

      // 3. Extracting Questions
      await this.updateStatus(PipelineStep.EXTRACTING_QUESTIONS);
      const questions = await extractQuestionsFromText(text);

      // STRICT VALIDATION
      if (!questions || !Array.isArray(questions) || questions.length === 0) {
        throw new Error('AI could not extract any questions from this PDF. Please ensure it contains clear MCQ text.');
      }

      // Validate each question has content
      const validQuestions = questions.filter(q => q.text && q.text.trim().length > 5);
      if (validQuestions.length === 0) {
        throw new Error('Extracted questions were empty or malformed.');
      }

      // 4. Generating PPT
      await this.updateStatus(PipelineStep.GENERATING_PPT);
      const pptBuffer = await generatePPTX(validQuestions, {
        title: presentation.title,
        themeColor: presentation.theme.themeColor,
        accentColor: presentation.theme.accentColor,
        layout: presentation.theme.layout
      });

      // 5. Upload PPT to Storage
      await this.updateStatus(PipelineStep.FINALIZING);
      const fileName = `pptx/${this.id}.pptx`;
      const { error: uploadError } = await this.supabase.storage
        .from('pptxs')
        .upload(fileName, pptBuffer, {
          contentType: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
          upsert: true
        });

      if (uploadError) throw new Error(`Failed to save generated PPT: ${uploadError.message}`);

      const { data: { publicUrl: pptPublicUrl } } = this.supabase.storage
        .from('pptxs')
        .getPublicUrl(fileName);

      // 6. Complete
      const processingTime = (Date.now() - startTime) / 1000;
      
      // FINAL TRANSACTION-LIKE SAVE
      // Save to uploads for history - using upsert to avoid duplicate errors if triggered multiple times
      const { error: historyError } = await this.supabase
        .from('uploads')
        .upsert([{
          id: this.id,
          pdf_name: decodeURIComponent(presentation.pdf_url.split('/').pop() || presentation.title || 'document'),
          pdf_url: presentation.pdf_url,
          ppt_url: pptPublicUrl,
          exam_name: presentation.title,
          extracted_json: validQuestions,
          total_questions: validQuestions.length
        }]);

      if (historyError) console.error('Failed to save to history:', historyError);

      await this.supabase
        .from('presentations')
        .update({
          questions: validQuestions,
          pptx_url: pptPublicUrl,
          status: PipelineStep.COMPLETED,
          stats: {
            totalQuestions: validQuestions.length,
            processingTime: `${processingTime.toFixed(2)}s`
          }
        })
        .eq('id', this.id);

      return { success: true, questions: validQuestions };
    } catch (error: any) {
      console.error('Pipeline Execution Failed:', error);
      
      // Clean up artifacts on failure
      await this.cleanup(currentPdfUrl);
      
      throw error;
    }
  }
}
