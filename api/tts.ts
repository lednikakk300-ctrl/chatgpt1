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

    const { text, voice = "Kore" } = body || {};
    if (!text || typeof text !== "string") {
      return res.status(400).json({ error: "Matn talab qilinadi" });
    }

    const cleanText = text.replace(/[`*#_\[\]()]/g, " ").trim().slice(0, 1500);
    const ai = getGeminiClient();

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
            prebuiltVoiceConfig: { voiceName: voice },
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;

    if (!base64Audio) {
      return res.status(500).json({ error: "Ovoz generatsiya qilinmadi" });
    }

    return res.status(200).json({
      audioBase64: base64Audio,
      mimeType: "audio/wav",
    });
  } catch (error: any) {
    console.error("TTS API error in /api/tts:", error);
    return res.status(500).json({
      error: error.message || "Ovoz generatsiyasida xatolik",
    });
  }
}
