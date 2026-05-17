import { GoogleGenAI, Type } from "@google/genai";

let aiClient: GoogleGenAI | null = null;

function getAiClient() {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY is required");
    }
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return aiClient;
}

export interface Question {
  number: string;
  text: string;
}

export async function extractQuestionsFromText(text: string): Promise<Question[]> {
  const ai = getAiClient();
  const maxRetries = 3;
  let lastError: any = null;

  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `You are an expert bilingual OCR cleanup and exam-question extraction AI.

The PDF text may contain:
- English questions
- Hindi questions
- Mixed bilingual content
- Broken OCR Hindi text (garbled Unicode)
- Mathematical formulas
- Multiple-choice options

Your task is to CLEAN, RECONSTRUCT, and EXTRACT questions correctly for PPT generation.

IMPORTANT:
If Hindi text appears corrupted due to bad OCR encoding (example: "eksfgr vkSj jksfgr"), intelligently reconstruct it into proper readable Hindi Unicode whenever possible.

For every question:
1. Preserve the English version.
2. Preserve the Hindi version.
3. Keep both together inside the same question text.
4. Preserve options exactly.
5. Keep mathematical symbols intact.
6. Merge multiline questions properly.
7. Return clean readable output suitable for PowerPoint slides.

OUTPUT FORMAT:
Return ONLY valid JSON.

[
  {
    "number": "1",
    "text": "Mohit and Rohit undertook a work for ₹4400. Mohit alone can do that work in 10 days and Rohit alone can do the same work in 15 days. If they work together, then what will be the difference in the amount they receive?\\n\\nमोहित और रोहित ने ₹4400 में एक काम हाथ में लिया। मोहित अकेले उस काम को 10 दिनों में कर सकता है और रोहित अकेले उसी काम को 15 दिनों में कर सकता है। यदि वे एक साथ कार्य करते हैं, तो उन्हें प्राप्त होने वाली राशि में कितना अंतर होगा?\\n\\n(A) ₹800\\n(B) ₹1050\\n(C) ₹900\\n(D) ₹880"
  }
]

STRICT RULES:
1. Return ONLY raw JSON.
2. Do NOT use markdown.
3. Do NOT explain anything.
4. Preserve bilingual formatting.
5. Reconstruct corrupted Hindi OCR text intelligently.
6. Keep English + Hindi together in same question.
7. Preserve line breaks using \\n.
8. Ignore:
   - Page numbers
   - Headers
   - Footers
   - Exam instructions
   - Watermarks
   - Time/Marks text
9. Preserve question numbering exactly.
10. Preserve all options inside the same question.
11. Merge questions split across pages.
12. Remove OCR garbage/noise lines.
13. Keep equations and symbols intact.
14. Ensure JSON is always valid and parsable.
15. Output should be presentation-ready for PPT slides.

TEXT:
${text}`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                number: { type: Type.STRING },
                text: { type: Type.STRING },
              },
              required: ["number", "text"],
            },
          },
        },
      });

      const jsonStr = response.text || "[]";
      return JSON.parse(jsonStr);
    } catch (e: any) {
      lastError = e;
      const isUnavailable = e.message?.includes('503') || e.message?.includes('UNAVAILABLE') || e.message?.includes('high demand');
      
      if (isUnavailable && i < maxRetries - 1) {
        console.warn(`Gemini API busy (attempt ${i + 1}/${maxRetries}), retrying in 2s...`);
        await new Promise(resolve => setTimeout(resolve, 2000));
        continue;
      }
      
      if (isUnavailable) {
        const friendlyError = new Error("The AI service is currently busy due to exceptionally high demand. Please wait a minute and try again.");
        console.error("Failed to extract questions from Gemini after retries:", e);
        throw friendlyError;
      }

      console.error("Failed to extract questions from Gemini:", e);
      throw e;
    }
  }
  
  throw lastError || new Error("Failed to extract questions after retries");
}
