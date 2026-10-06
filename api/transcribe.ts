import { getGeminiClient } from "../src/lib/gemini.ts";

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

    const { audioBase64, mimeType = "audio/webm" } = body || {};
    if (!audioBase64) {
      return res.status(400).json({ error: "Ovoz fayli talab qilinadi" });
    }

    const ai = getGeminiClient();
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
    return res.status(200).json({ transcript });
  } catch (error: any) {
    console.error("Transcribe API error in /api/transcribe:", error);
    return res.status(500).json({
      error: error.message || "Ovozni tushunishda xatolik yuz berdi",
    });
  }
}
