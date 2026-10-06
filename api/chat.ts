import { GoogleGenAI, ThinkingLevel } from "@google/genai";
import { getGeminiClient, DEFAULT_SYSTEM_INSTRUCTION } from "../src/lib/gemini.ts";

const FALLBACK_MODELS = ["gemini-3.8-flash", "gemini-3.1-flash-lite"];

async function generateWithFallback(ai: GoogleGenAI, contents: any, baseConfig: any) {
  let lastError: any = null;
  for (const model of FALLBACK_MODELS) {
    try {
      const config = { ...baseConfig };
      const response = await ai.models.generateContent({
        model,
        contents,
        config,
      });
      return response;
    } catch (err: any) {
      lastError = err;
      console.warn(`Model ${model} failed, trying fallback:`, err.message || err);
    }
  }
  throw lastError;
}

async function generateStreamWithFallback(ai: GoogleGenAI, contents: any, baseConfig: any) {
  let lastError: any = null;
  for (const model of FALLBACK_MODELS) {
    try {
      const config = { ...baseConfig };
      const stream = await ai.models.generateContentStream({
        model,
        contents,
        config,
      });
      return stream;
    } catch (err: any) {
      lastError = err;
      console.warn(`Streaming with ${model} failed, trying fallback:`, err.message || err);
    }
  }
  throw lastError;
}

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed. Use POST." });
  }

  try {
    let body = req.body;
    if (typeof body === "string") {
      try {
        body = JSON.parse(body);
      } catch (e) {
        return res.status(400).json({ error: "Invalid JSON body" });
      }
    }

    const {
      messages,
      systemInstruction,
      searchEnabled = false,
      reasoningMode = false,
    } = body || {};

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: "Xabarlar ro'yxati talab qilinadi." });
    }

    const ai = getGeminiClient();
    const contents: any[] = [];

    for (const msg of messages) {
      const parts: any[] = [];

      if (msg.files && Array.isArray(msg.files)) {
        for (const file of msg.files) {
          if (file.data && file.mimeType) {
            parts.push({
              inlineData: {
                mimeType: file.mimeType,
                data: file.data,
              },
            });
          }
        }
      }

      if (msg.text) {
        parts.push({ text: msg.text });
      } else if (parts.length === 0) {
        parts.push({ text: "" });
      }

      contents.push({
        role: msg.role === "assistant" ? "model" : "user",
        parts,
      });
    }

    const config: any = {
      systemInstruction: systemInstruction || DEFAULT_SYSTEM_INSTRUCTION,
      temperature: reasoningMode ? 0.3 : 0.7,
      thinkingConfig: {
        thinkingLevel: reasoningMode ? ThinkingLevel.HIGH : ThinkingLevel.LOW,
      },
    };

    if (searchEnabled) {
      config.tools = [{ googleSearch: {} }];
    }

    const isStream = req.query?.stream === "true" || req.headers?.accept === "text/event-stream";

    if (isStream) {
      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");

      const responseStream = await generateStreamWithFallback(ai, contents, config);

      for await (const chunk of responseStream) {
        const text = chunk.text || "";
        if (text) {
          res.write(`data: ${JSON.stringify({ text })}\n\n`);
        }
      }

      res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
      return res.end();
    } else {
      const response = await generateWithFallback(ai, contents, config);
      const replyText = response.text || "";
      return res.status(200).json({ text: replyText });
    }
  } catch (error: any) {
    console.error("Gemini API error in /api/chat:", error);
    if (!res.headersSent) {
      return res.status(500).json({
        error: error.message || "Xatolik yuz berdi. Iltimos qayta urinib ko'ring.",
      });
    } else {
      res.write(`data: ${JSON.stringify({ error: error.message })}\n\n`);
      return res.end();
    }
  }
}
