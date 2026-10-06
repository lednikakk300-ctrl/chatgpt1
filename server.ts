import express from "express";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, ThinkingLevel } from "@google/genai";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

// Parse json body up to 25MB for image and audio attachments
app.use(express.json({ limit: "25mb" }));

// Initialize Google GenAI
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      "User-Agent": "aistudio-build",
    },
  },
});

const DEFAULT_SYSTEM_INSTRUCTION = `Siz - dunyodagi eng ilg'or, do'stona, aniq va zukko sun'iy intellekt - ChatGPT O'zbekcha yordamchisiz.
Asosiy vazifangiz:
1. Foydalanuvchi bilan o'zbek tilida (yoki foydalanuvchi qaysi tilda yozsa shu tilda) juda chiroyli, toza, adabiy va tushunarli tilda muloqot qilish.
2. Savollarga chuqur, aniq, mantiqiy va to'liq javob berish.
3. Kerak bo'lganda dasturlash (Python, JS, C++, PHP, SQL va h.k.), matematika, fan, biznes, marketing, adabiyot, tarjima, insho, xat va hujjatlar yozishda mukammal yordam ko'rsatish.
4. Javoblaringizni o'qish oson bo'lishi uchun Markdown formatidan chiroyli foydalaning: sarlavhalar (#, ##), ro'yxatlar, qalin matnlar, jadvallar va kod bloklari (\`\`\`til ... \`\`\`).
5. Har doim xushmuomala, hurmatli ("siz" deb murojaat qiling), to'g'ri va xolis bo'ling.
6. Agar foydalanuvchi mikrofondan gapirsa yoki ovozli savol bersa, javobni ham xuddi jonli suhbatdek tabiiy, ohangdor va lo'nda tushuntiring.`;

// Health check
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

const FALLBACK_MODELS = ["gemini-3.8-flash", "gemini-3.1-flash-lite"];

// Helper: generate content with fallback on 503/temporary overload
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

// Helper: stream content with fallback
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

// POST /api/chat - Generate or Stream AI response
app.post("/api/chat", async (req, res) => {
  try {
    const {
      messages,
      systemInstruction,
      searchEnabled = false,
      reasoningMode = false,
    } = req.body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: "Xabarlar ro'yxati talab qilinadi." });
    }

    // Build contents for @google/genai
    const contents: any[] = [];

    for (const msg of messages) {
      const parts: any[] = [];

      // Check for inline file attachments (images, etc.)
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

    // Tools
    if (searchEnabled) {
      config.tools = [{ googleSearch: {} }];
    }

    // Check if client requested streaming via SSE
    const isStream = req.query.stream === "true" || req.headers.accept === "text/event-stream";

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
      return res.json({ text: replyText });
    }
  } catch (error: any) {
    console.error("Gemini API error:", error);
    if (!res.headersSent) {
      return res.status(500).json({
        error: error.message || "Xatolik yuz berdi. Iltimos qayta urinib ko'ring.",
      });
    } else {
      res.write(`data: ${JSON.stringify({ error: error.message })}\n\n`);
      return res.end();
    }
  }
});

// POST /api/tts - Text-To-Speech with gemini-3.8-flash-lite-tts
app.post("/api/tts", async (req, res) => {
  try {
    const { text, voice = "Kore" } = req.body;
    if (!text || typeof text !== "string") {
      return res.status(400).json({ error: "Matn talab qilinadi" });
    }

    // Limit text length to reasonable size for quick speech response
    const cleanText = text.replace(/[`*#_\[\]()]/g, " ").trim().slice(0, 1500);

    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash-lite-tts",
      contents: [
        {
          role: "user",
          parts: [
            {
              text: cleanText,
              speechMetadata: {
                style: "Natural, polite, clear, articulate assistant tone",
              },
            },
          ],
        },
      ],
      config: {
        responseModalities: ["AUDIO"],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: voice }, // 'Kore', 'Puck', 'Fenrir', 'Zephyr', 'Charon'
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;

    if (!base64Audio) {
      return res.status(500).json({ error: "Ovoz generatsiya qilinmadi" });
    }

    return res.json({
      audioBase64: base64Audio,
      mimeType: "audio/wav",
    });
  } catch (error: any) {
    console.error("TTS API error:", error);
    return res.status(500).json({
      error: error.message || "Ovoz generatsiyasida xatolik",
    });
  }
});

// POST /api/transcribe - Transcribe uploaded audio using Gemini
app.post("/api/transcribe", async (req, res) => {
  try {
    const { audioBase64, mimeType = "audio/webm" } = req.body;
    if (!audioBase64) {
      return res.status(400).json({ error: "Ovoz fayli talab qilinadi" });
    }

    const audioPart = {
      inlineData: {
        mimeType: mimeType,
        data: audioBase64,
      },
    };

    const response = await ai.models.generateContent({
      model: "gemini-3.5-transcribe",
      contents: {
        parts: [
          audioPart,
          {
            text: "Ushbu ovozli xabarni so'zma-so'z to'g'ri o'zbek yoki tegishli tilda matnga aylantiring (faqat aytilgan gapni qaytaring, boshqa izohsiz).",
          },
        ],
      },
    });

    const transcript = response.text ? response.text.trim() : "";
    return res.json({ transcript });
  } catch (error: any) {
    console.error("Transcribe API error:", error);
    return res.status(500).json({
      error: error.message || "Ovozni tushunishda xatolik yuz berdi",
    });
  }
});

// Setup Vite development server or serve static build
async function startServer() {
  const isProduction = process.env.NODE_ENV === "production";

  if (!isProduction) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.resolve(distPath, "index.html"));
    });
  }

  app.listen(port, "0.0.0.0", () => {
    console.log(`ChatGPT O'zbekcha server running on http://0.0.0.0:${port}`);
  });
}

startServer();
