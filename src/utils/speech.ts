// Speech Recognition and TTS utilities for Uzbek ChatGPT

export interface SpeechRecognitionResultState {
  transcript: string;
  isFinal: boolean;
}

// Check if browser supports Web Speech API
export const isSpeechRecognitionSupported = (): boolean => {
  return typeof window !== 'undefined' && ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window);
};

// Create a SpeechRecognition instance
export const createSpeechRecognition = (
  onTranscript: (text: string, isFinal: boolean) => void,
  onError: (err: any) => void,
  onEnd: () => void,
  lang: string = 'uz-UZ'
) => {
  if (!isSpeechRecognitionSupported()) {
    onError(new Error("Brauzeringiz ovozli kiritishni (SpeechRecognition) to'liq qo'llab-quvvatlamaydi."));
    return null;
  }

  const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
  const recognition = new SpeechRecognition();

  recognition.continuous = true;
  recognition.interimResults = true;
  recognition.lang = lang; // 'uz-UZ', 'ru-RU', 'en-US'

  recognition.onresult = (event: any) => {
    let interimTranscript = '';
    let finalTranscript = '';

    for (let i = event.resultIndex; i < event.results.length; ++i) {
      if (event.results[i].isFinal) {
        finalTranscript += event.results[i][0].transcript;
      } else {
        interimTranscript += event.results[i][0].transcript;
      }
    }

    const currentText = finalTranscript || interimTranscript;
    if (currentText) {
      onTranscript(currentText, !!finalTranscript);
    }
  };

  recognition.onerror = (event: any) => {
    console.warn("Speech recognition error:", event.error);
    onError(event);
  };

  recognition.onend = () => {
    onEnd();
  };

  return recognition;
};

// Play audio from base64 string
let currentPlayingAudio: HTMLAudioElement | null = null;

export const playAudioBase64 = (
  base64Audio: string,
  mimeType: string = 'audio/wav',
  onEnd?: () => void
): HTMLAudioElement => {
  stopAudioPlayback();

  const audio = new Audio(`data:${mimeType};base64,${base64Audio}`);
  currentPlayingAudio = audio;

  audio.onended = () => {
    currentPlayingAudio = null;
    if (onEnd) onEnd();
  };

  audio.onerror = (e) => {
    console.error("Audio playback error:", e);
    currentPlayingAudio = null;
    if (onEnd) onEnd();
  };

  audio.play().catch((err) => {
    console.warn("Autoplay was blocked or failed:", err);
  });

  return audio;
};

export const stopAudioPlayback = () => {
  if (currentPlayingAudio) {
    try {
      currentPlayingAudio.pause();
      currentPlayingAudio.currentTime = 0;
    } catch (e) {
      // ignore
    }
    currentPlayingAudio = null;
  }

  // Also cancel any browser speech synthesis
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    try {
      window.speechSynthesis.cancel();
    } catch (e) {}
  }
};

export const isAudioPlaying = (): boolean => {
  return !!currentPlayingAudio && !currentPlayingAudio.paused;
};

// Browser speech synthesis fallback
export const speakWithBrowser = (
  text: string,
  lang: string = 'uz-UZ',
  rate: number = 1.0,
  onEnd?: () => void
) => {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
  stopAudioPlayback();

  // Strip markdown symbols
  const clean = text.replace(/[`*#_\[\]()]/g, ' ').slice(0, 1000);
  const utterance = new SpeechSynthesisUtterance(clean);
  utterance.lang = lang;
  utterance.rate = rate;

  utterance.onend = () => {
    if (onEnd) onEnd();
  };
  utterance.onerror = () => {
    if (onEnd) onEnd();
  };

  window.speechSynthesis.speak(utterance);
};
