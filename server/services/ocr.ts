import Anthropic from "@anthropic-ai/sdk";
import OpenAI from "openai";
import sharp from "sharp";
import fs from "fs";
import path from "path";
import { extractionResultSchema, type ExtractionResult } from "@shared/schema";

const MEDICAL_EXTRACTION_PROMPT = `Eres un asistente médico especializado en extracción de datos de documentos clínicos.
Analiza la imagen del documento médico y extrae TODOS los datos que puedas identificar.

Responde SOLO con JSON válido (sin markdown, sin backticks) con esta estructura exacta:
{
  "documentType": "receta|laboratorio|radiografia|consulta|hospitalizacion|otro",
  "documentDate": "YYYY-MM-DD o null si no se puede determinar",
  "provider": "nombre del médico o institución o null",
  "diagnoses": [{"code": "código CIE-10 si aplica o vacío", "description": "diagnóstico"}],
  "medications": [{"name": "nombre", "dose": "dosis", "frequency": "frecuencia", "duration": "duración", "route": "vía"}],
  "labResults": [{"test": "prueba", "value": "valor", "unit": "unidad", "referenceRange": "rango referencia", "flag": "normal|alto|bajo"}],
  "vitalSigns": [{"type": "tipo", "value": "valor", "unit": "unidad"}],
  "procedures": [{"name": "procedimiento", "date": "fecha", "notes": "notas"}],
  "notes": "notas adicionales del documento",
  "summary": "resumen en 2-3 oraciones del contenido del documento",
  "confidence": 0.0-1.0
}

Si un campo no tiene datos, usa un array vacío [] o null. Extrae todo lo que puedas leer.`;

async function preprocessImage(filePath: string): Promise<Buffer> {
  const image = sharp(filePath);
  const metadata = await image.metadata();

  let processed = image;

  // Resize if too large (max 4MB for API, keep under 2000px width)
  if (metadata.width && metadata.width > 2000) {
    processed = processed.resize(2000);
  }

  // Enhance for better OCR: grayscale + normalize contrast
  processed = processed.grayscale().normalize();

  return processed.jpeg({ quality: 90 }).toBuffer();
}

function getMediaType(mimeType: string): "image/jpeg" | "image/png" | "image/gif" | "image/webp" {
  const map: Record<string, "image/jpeg" | "image/png" | "image/gif" | "image/webp"> = {
    "image/jpeg": "image/jpeg",
    "image/jpg": "image/jpeg",
    "image/png": "image/png",
    "image/gif": "image/gif",
    "image/webp": "image/webp",
  };
  return map[mimeType] || "image/jpeg";
}

async function extractWithClaude(imageBuffer: Buffer, mimeType: string): Promise<ExtractionResult> {
  const anthropic = new Anthropic();
  const base64 = imageBuffer.toString("base64");

  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 4096,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "image",
            source: {
              type: "base64",
              media_type: getMediaType(mimeType),
              data: base64,
            },
          },
          {
            type: "text",
            text: MEDICAL_EXTRACTION_PROMPT,
          },
        ],
      },
    ],
  });

  const textContent = response.content.find((c) => c.type === "text");
  if (!textContent || textContent.type !== "text") {
    throw new Error("No text response from Claude");
  }

  const parsed = JSON.parse(textContent.text);
  return extractionResultSchema.parse(parsed);
}

async function extractWithGPT4(imageBuffer: Buffer, mimeType: string): Promise<ExtractionResult> {
  const openai = new OpenAI();
  const base64 = imageBuffer.toString("base64");
  const dataUrl = `data:${mimeType};base64,${base64}`;

  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    max_tokens: 4096,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "image_url",
            image_url: { url: dataUrl, detail: "high" },
          },
          {
            type: "text",
            text: MEDICAL_EXTRACTION_PROMPT,
          },
        ],
      },
    ],
  });

  const text = response.choices[0]?.message?.content;
  if (!text) {
    throw new Error("No response from GPT-4o");
  }

  const parsed = JSON.parse(text);
  return extractionResultSchema.parse(parsed);
}

export interface OcrResult {
  extraction: ExtractionResult;
  model: string;
  rawResponse: unknown;
}

export async function processDocument(filePath: string, mimeType: string): Promise<OcrResult> {
  // Preprocess the image
  let imageBuffer: Buffer;

  if (mimeType === "application/pdf") {
    // For PDFs, read the raw file - Claude/GPT-4o can handle PDFs directly via base64
    imageBuffer = fs.readFileSync(filePath);
  } else {
    imageBuffer = await preprocessImage(filePath);
    mimeType = "image/jpeg"; // preprocessed to jpeg
  }

  // Try Claude first, fallback to GPT-4o
  try {
    console.log("[OCR] Attempting extraction with Claude Vision...");
    const extraction = await extractWithClaude(imageBuffer, mimeType);
    console.log("[OCR] Claude extraction successful");
    return { extraction, model: "claude-sonnet-4-20250514", rawResponse: extraction };
  } catch (claudeError) {
    console.error("[OCR] Claude failed:", claudeError instanceof Error ? claudeError.message : claudeError);

    try {
      console.log("[OCR] Falling back to GPT-4o Vision...");
      const extraction = await extractWithGPT4(imageBuffer, mimeType);
      console.log("[OCR] GPT-4o extraction successful");
      return { extraction, model: "gpt-4o", rawResponse: extraction };
    } catch (gptError) {
      console.error("[OCR] GPT-4o also failed:", gptError instanceof Error ? gptError.message : gptError);
      throw new Error(
        `Both AI models failed. Claude: ${claudeError instanceof Error ? claudeError.message : "unknown"}. GPT-4o: ${gptError instanceof Error ? gptError.message : "unknown"}`
      );
    }
  }
}
