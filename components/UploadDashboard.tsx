'use client'

import { useState } from "react";
import { useDropzone } from "react-dropzone";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { FileText, Upload, X, Loader2, Sparkles, CheckCircle2, ChevronRight, Presentation } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";

export function UploadDashboard() {
  const { user } = useAuth();
  const [file, setFile] = useState<File | null>(null);
  const [selectedLayout, setSelectedLayout] = useState<'standard' | 'solving'>('standard');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [status, setStatus] = useState<string>('idle');
  const router = useRouter();

  const onDrop = (acceptedFiles: File[]) => {
    const selectedFile = acceptedFiles[0];
    if (selectedFile && selectedFile.type === "application/pdf") {
      setFile(selectedFile);
    } else {
      toast.error("Please upload a valid PDF file.");
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "application/pdf": [".pdf"] },
    multiple: false,
  });

  const handleUpload = async () => {
    if (!file) return;

    setIsUploading(true);
    setStatus('uploading');
    setUploadProgress(10);

    try {
      if (!user) throw new Error("Authentication required");

      // 1. Upload to Supabase Storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('pdfs')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) throw uploadError;

      setUploadProgress(30);
      const { data: { publicUrl } } = supabase.storage.from('pdfs').getPublicUrl(filePath);

      // 2. Create Presentation entry
      const createResponse = await fetch('/api/presentations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          pdf_url: publicUrl, 
          title: file.name.replace('.pdf', ''),
          theme: { themeColor: '#8b5cf6', layout: selectedLayout }
        }),
      });

      const presentation = await createResponse.json();
      if (presentation.error) throw new Error(presentation.error);
      
      setUploadProgress(40);
      setStatus('processing');

      // 3. Start Pipeline Processing and await it
      // We both await it AND poll for progress.
      // IfAwait fails, we know it failed even if record was deleted.
      const processPromise = fetch(`/api/presentations/${presentation.id}/process`, { 
        method: 'POST' 
      }).then(r => r.json());

      // 4. Polling Loop
      let isDone = false;
      let lastStatus = '';
      
      const poll = async () => {
        while (!isDone) {
          await new Promise(r => setTimeout(r, 2000)); // Poll every 2s
          if (isDone) break;
          
          const { data, error } = await supabase
            .from('presentations')
            .select('status, questions, stats')
            .eq('id', presentation.id)
            .single();
          
          if (error) {
             // If record is gone, it means cleanup happened due to failure
             console.log("Polling detected record disappearance (likely cleanup)");
             return; 
          }
          
          if (data.status === 'failed') {
            throw new Error(data.stats?.lastError || "Processing failed");
          }
          
          if (data.status === 'completed') {
            isDone = true;
            setUploadProgress(100);
            setStatus('completed');
            toast.success("Ready for presentation!");
            setTimeout(() => {
              router.push(`/preview/${presentation.id}`);
            }, 1000);
            return;
          }

          // Update progress based on status
          if (data.status !== lastStatus) {
            lastStatus = data.status;
            if (data.status === 'reading_pdf') setUploadProgress(50);
            if (data.status === 'extracting_questions') setUploadProgress(70);
            if (data.status === 'generating_ppt') setUploadProgress(90);
          }
        }
      };

      // Run poll and process in parallel, but wait for process result for final truth
      const [processResult] = await Promise.all([
        processPromise,
        poll()
      ]);

      if (processResult.error) {
        throw new Error(processResult.error);
      }

    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "An error occurred.");
      setStatus('idle');
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  return (
    <div className="w-full py-0">
      <AnimatePresence mode="wait">
        {status === 'idle' ? (
          <motion.div
            key="idle"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98 }}
            className="space-y-8"
          >
            {/* Layout Selector */}
            <div className="flex flex-col items-center space-y-4">
              <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500">Pick Slide Layout</h4>
              <div className="grid grid-cols-2 gap-4 w-full max-w-xl">
                <button 
                  onClick={() => setSelectedLayout('standard')}
                  className={cn(
                    "relative group p-4 rounded-2xl border-2 transition-all duration-300 text-left overflow-hidden",
                    selectedLayout === 'standard' 
                      ? "bg-indigo-600/10 border-indigo-600 shadow-[0_0_20px_rgba(79,70,229,0.2)]" 
                      : "bg-zinc-900/40 border-white/5 hover:border-white/10"
                  )}
                >
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center gap-2">
                       <Presentation size={16} className={selectedLayout === 'standard' ? "text-indigo-400" : "text-zinc-500"} />
                       <span className={cn("text-xs font-bold uppercase tracking-widest", selectedLayout === 'standard' ? "text-white" : "text-zinc-500")}>Standard</span>
                    </div>
                    <div className="aspect-video bg-zinc-950 rounded-lg border border-white/10 p-2 relative">
                        <div className="w-full h-2 bg-indigo-500/20 rounded-full mb-1" />
                        <div className="w-2/3 h-2 bg-indigo-500/20 rounded-full mb-3" />
                        <div className="grid grid-cols-2 gap-1 mt-auto">
                            <div className="h-2 bg-white/5 rounded" />
                            <div className="h-2 bg-white/5 rounded" />
                            <div className="h-2 bg-white/5 rounded" />
                            <div className="h-2 bg-white/5 rounded" />
                        </div>
                    </div>
                  </div>
                  {selectedLayout === 'standard' && <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,1)]" />}
                </button>

                <button 
                  onClick={() => setSelectedLayout('solving')}
                  className={cn(
                    "relative group p-4 rounded-2xl border-2 transition-all duration-300 text-left overflow-hidden",
                    selectedLayout === 'solving' 
                      ? "bg-indigo-600/10 border-indigo-600 shadow-[0_0_20px_rgba(79,70,229,0.2)]" 
                      : "bg-zinc-900/40 border-white/5 hover:border-white/10"
                  )}
                >
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center gap-2">
                       <Sparkles size={16} className={selectedLayout === 'solving' ? "text-indigo-400" : "text-zinc-500"} />
                       <span className={cn("text-xs font-bold uppercase tracking-widest", selectedLayout === 'solving' ? "text-white" : "text-zinc-500")}>Solving Mode</span>
                    </div>
                    <div className="aspect-video bg-zinc-950 rounded-lg border border-white/10 p-2 relative flex">
                        <div className="w-1/2 h-full border-r border-white/5 border-dashed" />
                        <div className="flex-1 p-1">
                            <div className="w-full h-2 bg-indigo-500/20 rounded-full mb-1" />
                            <div className="w-2/3 h-2 bg-indigo-500/20 rounded-full mb-3" />
                            <div className="grid grid-cols-2 gap-1 mt-auto">
                                <div className="h-2 bg-white/5 rounded" />
                                <div className="h-2 bg-white/5 rounded" />
                                <div className="h-2 bg-white/5 rounded" />
                                <div className="h-2 bg-white/5 rounded" />
                            </div>
                        </div>
                    </div>
                  </div>
                  {selectedLayout === 'solving' && <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,1)]" />}
                </button>
              </div>
            </div>

            <Card className="glass border-dashed bg-zinc-900/10 hover:bg-zinc-900/20 transition-all duration-300 border-white/10 group cursor-pointer overflow-hidden">
              <CardContent className="p-0">
                <div {...getRootProps()} className="w-full flex-1 flex flex-col items-center justify-center py-12 md:py-16 px-6 min-h-[300px]">
                  <input {...getInputProps()} />
                  <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 mb-6 border border-white/5 shadow-inner group-hover:scale-110 transition-transform">
                    <Upload size={28} />
                  </div>
                  <h3 className="text-xl md:text-2xl lg:text-3xl font-bold mb-2 text-white">
                    {isDragActive ? "Drop PDF here" : "Upload Question Paper"}
                  </h3>
                  <p className="text-zinc-500 text-[10px] uppercase tracking-[0.25em] font-bold mb-8">
                    PDF format only • Max 10MB
                  </p>
                  
                  {!file && (
                    <div className="flex items-center gap-2 text-zinc-500 text-xs font-medium bg-white/[0.02] px-3 py-1.5 rounded-full border border-white/5">
                      <Sparkles size={14} className="text-indigo-500" />
                      <span>Gemini 1.5 Flash</span>
                    </div>
                  )}
                </div>

                {file && (
                  <div className="px-6 pb-10 flex flex-col items-center w-full">
                    <div className="flex items-center gap-4 bg-white/[0.03] border border-white/10 px-5 py-3 rounded-2xl mb-8 w-full max-w-xl">
                      <div className="w-9 h-9 rounded-xl bg-red-500/10 flex items-center justify-center text-red-500">
                        <FileText size={20} />
                      </div>
                      <div className="flex-1 text-left overflow-hidden">
                        <p className="text-xs font-bold truncate text-white">{file.name}</p>
                        <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                      </div>
                      <button onClick={(e) => { e.stopPropagation(); setFile(null); }} className="text-zinc-500 hover:text-white transition-colors p-2">
                        <X size={18} />
                      </button>
                    </div>

                    <Button 
                      size="lg" 
                      className="w-full max-w-xl h-12 text-xs font-bold uppercase tracking-widest bg-indigo-600 text-white hover:bg-indigo-500 shadow-[0_0_20px_rgba(79,70,229,0.3)] rounded-xl disabled:opacity-50"
                      disabled={!file}
                      onClick={(e) => { e.stopPropagation(); handleUpload(); }}
                    >
                      Process Presentation <ChevronRight className="ml-2" size={18} />
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        ) : (
          <motion.div
            key="loading"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center text-center py-6 bg-zinc-900/10 border border-white/5 rounded-3xl"
          >
            <div className="relative mb-8">
              <div className="absolute inset-x-0 -bottom-4 h-8 bg-indigo-500/20 blur-2xl rounded-full" />
              <div className="relative w-20 h-20 rounded-2xl bg-zinc-950 border border-white/10 flex items-center justify-center shadow-2xl">
                {status === 'completed' ? (
                  <CheckCircle2 size={36} className="text-emerald-500" />
                ) : (
                  <Loader2 size={36} className="animate-spin text-indigo-500" />
                )}
              </div>
            </div>

            <h3 className="text-2xl md:text-3xl font-bold mb-2 tracking-tight text-white">
              {status === 'uploading' && "Securing PDF"}
              {['processing', 'reading_pdf', 'extracting_questions', 'formatting_slides'].includes(status) && "AI Extraction"}
              {status === 'generating_ppt' && "Building PPTX"}
              {status === 'completed' && "Done!"}
            </h3>
            
            <p className="text-zinc-500 text-[10px] font-bold mb-8 max-w-[280px] uppercase tracking-[0.15em] leading-relaxed mx-auto">
              {status === 'uploading' && "Saving to secure project bucket."}
              {['processing', 'reading_pdf', 'extracting_questions', 'formatting_slides'].includes(status) && "Extracting bilingual questions with OCR."}
              {status === 'generating_ppt' && "Generating slides with unicode support."}
              {status === 'completed' && "Redirecting to your presentation..."}
            </p>

            <div className="w-full max-w-sm px-6 mb-8">
              <div className="h-1.5 w-full bg-zinc-900 rounded-full overflow-hidden border border-white/5">
                <motion.div 
                  className="h-full bg-indigo-500"
                  initial={{ width: 0 }}
                  animate={{ width: `${uploadProgress}%` }}
                  transition={{ duration: 0.5 }}
                />
              </div>
              <div className="mt-3 text-[10px] font-black text-indigo-400 tracking-widest uppercase">
                  {uploadProgress}% COMPLETE
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 w-full px-6">
              {[
                { label: "Extraction", s: ['reading_pdf', 'extracting_questions', 'generating_ppt', 'completed'], cur: 'reading_pdf' },
                { label: "Bilingual", s: ['extracting_questions', 'generating_ppt', 'completed'], cur: 'extracting_questions' },
                { label: "PPT Engine", s: ['generating_ppt', 'completed'], cur: 'generating_ppt' },
                { label: "Ready", s: ['completed'], cur: 'completed' }
              ].map((step, i) => (
                <div 
                  key={i} 
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl border transition-all duration-500 ${
                    step.s.includes(status) ? 'bg-white/5 border-indigo-500/30 text-white' : 'bg-transparent border-white/5 text-zinc-700'
                  }`}
                >
                  <div className={`w-1.5 h-1.5 rounded-full ${step.s.includes(status) ? 'bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.5)]' : 'bg-zinc-800'}`} />
                  <span className="text-[11px] font-bold truncate">{step.label}</span>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
