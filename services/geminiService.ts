import { GoogleGenAI } from "@google/genai";
import { SYSTEM_INSTRUCTION } from '../constants';
import { ConversionResult, Reference } from '../types';

const apiKey = process.env.API_KEY;

// Initialize the Gemini client
const ai = new GoogleGenAI({ apiKey });

export const convertMqlToPromql = async (mqlQuery: string): Promise<ConversionResult> => {
  if (!mqlQuery.trim()) {
    throw new Error("MQL Query cannot be empty");
  }

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: `Convert the following MQL query to PromQL:\n\n${mqlQuery}`,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        tools: [{ googleSearch: {} }],
        // responseSchema is not used when using tools to ensure compatibility and correct grounding extraction
      }
    });

    let text = response.text;
    if (!text) {
        throw new Error("Empty response from Gemini");
    }

    // Robustly extract JSON object from the response
    // The model might output conversational text before or after the JSON block
    // 1. Try to find a JSON code block first
    const jsonBlockMatch = text.match(/```json\s*(\{[\s\S]*?\})\s*```/);
    if (jsonBlockMatch) {
        text = jsonBlockMatch[1];
    } else {
        // 2. Fallback: Find the first '{' and the last '}' to handle mixed text/JSON responses
        const firstOpen = text.indexOf('{');
        const lastClose = text.lastIndexOf('}');
        if (firstOpen !== -1 && lastClose !== -1 && lastClose > firstOpen) {
            text = text.substring(firstOpen, lastClose + 1);
        }
    }

    let result: ConversionResult;
    try {
        result = JSON.parse(text) as ConversionResult;
    } catch (e) {
        console.error("Failed to parse JSON:", text);
        throw new Error("Failed to parse conversion result. The model returned an invalid format.");
    }

    // Extract grounding metadata (Google Search sources)
    const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
    if (chunks) {
        const refs: Reference[] = chunks
            .map((c: any) => c.web)
            .filter((web: any) => web && web.uri && web.title)
            .map((web: any) => ({ title: web.title, uri: web.uri }));
        
        // Remove duplicates based on URI
        const uniqueRefs = Array.from(new Map(refs.map(r => [r.uri, r])).values());
        
        if (uniqueRefs.length > 0) {
            result.references = uniqueRefs;
        }
    }

    return result;

  } catch (error) {
    console.error("Error converting MQL to PromQL:", error);
    throw error;
  }
};