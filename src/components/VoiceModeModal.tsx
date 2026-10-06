import React, { useState, useEffect, useRef } from 'react';
import {
  Mic,
  MicOff,
  X,
  Volume2,
  VolumeX,
  Loader2,
  Sparkles,
  MessageSquare,
} from 'lucide-react';
import {
  createSpeechRecognition,
  isSpeechRecognitionSupported,
  playAudioBase64,
  stopAudioPlayback,
  speakWithBrowser,
} from '../utils/speech';
import { UserSettings } from '../types';

interface VoiceModeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNewMessage: (userText: string, aiText: string) => void;
  settings: UserSettings;
}

export const VoiceModeModal: React.FC<VoiceModeModalProps> = ({
  isOpen,
  onClose,
  onNewMessage,
  settings,
}) => {
  const [status, setStatus] = useState<'idle' | 'listening' | 'thinking' | 'speaking'>('idle');
  const [userTranscript, setUserTranscript] = useState('');
  const [aiResponse, setAiResponse] = useState('');
  const [isMuted, setIsMuted] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const recognitionRef = useRef<any>(null);
  const silenceTimerRef = useRef<any>(null);
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    if (isOpen) {
      startVoiceSession();
    } else {
      cleanupVoiceSession();
    }
    return () => {
      isMountedRef.current = false;
      cleanupVoiceSession();
    };
  }, [isOpen]);

  const cleanupVoiceSession = () => {
    stopAudioPlayback();
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {}
      recognitionRef.current = null;
    }
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
    }
    setStatus('idle');
  };

  const startVoiceSession = () => {
    setErrorMessage(null);
    setUserTranscript('');
    setAiResponse('');

    if (!isSpeechRecognitionSupported()) {
      setErrorMessage("Brauzeringiz ovozli kiritishni (Speech Recognition) qo'llab-quvvatlamaydi.");
      return;
    }

    startListening();
  };

  const startListening = () => {
    if (isMuted) return;
    setStatus('listening');

    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {}
    }

    const recognition = createSpeechRecognition(
      (text, isFinal) => {
        setUserTranscript(text);

        // Reset silence timer
        if (silenceTimerRef.current) {
          clearTimeout(silenceTimerRef.current);
        }

        // Auto trigger AI response 1.5 seconds after user stops speaking
        silenceTimerRef.current = setTimeout(() => {
          if (text.trim().length > 1) {
            handleVoiceQuery(text.trim());
          }
        }, 1600);
      },
      (error) => {
        console.warn("Voice session recognition error:", error);
        if (error.error === 'not-allowed') {
          setErrorMessage("Mikrofon ruxsati rad etildi. Brauzer sozlamalaridan ruxsat bering.");
        }
      },
      () => {
        // Recognition ended
        if (status === 'listening' && !isMuted && isMountedRef.current) {
          // Restart listening if still supposed to listen
          try {
            recognition.start();
          } catch (e) {}
        }
      },
      settings.speechLanguage || 'uz-UZ'
    );

    if (recognition) {
      recognitionRef.current = recognition;
      try {
        recognition.start();
      } catch (e) {
        console.warn("Could not start recognition:", e);
      }
    }
  };

  const handleVoiceQuery = async (queryText: string) => {
    if (!queryText.trim()) return;

    // Stop listening while thinking and speaking
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {}
    }

    setStatus('thinking');

    try {
      // 1. Get conversational reply from ChatGPT endpoint
      const chatRes = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{ role: 'user', text: queryText }],
          systemInstruction:
            "Siz ChatGPT O'zbekcha ovozli yordamchisiz. Foydalanuvchi bilan xuddi jonli telefonda gaplashayotgandek suhbat qurasiz. Javoblaringizni juda lo'nda, qisqa (maksimal 2-3 ta gap), tabiiy, iliq va qiziqarli o'zbek tilida bering. Murakkab belgilardan yoki ro'yxatlardan foydalanmang, chunki bu ovozda o'qiladi.",
        }),
      });

      if (!chatRes.ok) throw new Error("Serverdan javob olinmadi");
      const chatData = await chatRes.json();
      const answer = chatData.text || "Kechirasiz, javobni tushunib bo'lmadi.";

      if (!isMountedRef.current) return;
      setAiResponse(answer);
      onNewMessage(queryText, answer);

      // 2. Play speech
      setStatus('speaking');

      try {
        const ttsRes = await fetch('/api/tts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: answer,
            voice: settings.voice || 'Kore',
          }),
        });

        if (ttsRes.ok) {
          const ttsData = await ttsRes.json();
          if (ttsData.audioBase64) {
            currentAudioRef.current = playAudioBase64(
              ttsData.audioBase64,
              ttsData.mimeType || 'audio/wav',
              () => {
                if (isMountedRef.current) {
                  setUserTranscript('');
                  startListening();
                }
              }
            );
            return;
          }
        }
      } catch (ttsErr) {
        console.warn("Server TTS failed, falling back to browser speech synthesis:", ttsErr);
      }

      // Fallback: browser speech synthesis
      speakWithBrowser(
        answer,
        settings.speechLanguage || 'uz-UZ',
        settings.speechRate || 1.0,
        () => {
          if (isMountedRef.current) {
            setUserTranscript('');
            startListening();
          }
        }
      );
    } catch (err: any) {
      console.error("Voice query failed:", err);
      setErrorMessage("Aloqada xatolik yuz berdi. Qayta urinib ko'ring.");
      setStatus('idle');
    }
  };

  const toggleMute = () => {
    if (isMuted) {
      setIsMuted(false);
      startListening();
    } else {
      setIsMuted(true);
      cleanupVoiceSession();
      setStatus('idle');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-[#121212]/95 backdrop-blur-xl flex flex-col justify-between p-6 text-white animate-in fade-in duration-200">
      {/* Top Header */}
      <div className="flex items-center justify-between max-w-xl mx-auto w-full">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-emerald-400" />
          <span className="font-semibold text-sm tracking-wide">
            ChatGPT Ovozli Muloqot Rejimi
          </span>
        </div>
        <button
          onClick={onClose}
          className="p-2 rounded-full hover:bg-neutral-800 text-neutral-400 hover:text-white transition-colors cursor-pointer"
          title="Yopish"
        >
          <X className="w-6 h-6" />
        </button>
      </div>

      {/* Center Animated Voice Orb */}
      <div className="flex-1 flex flex-col items-center justify-center max-w-md mx-auto w-full text-center">
        {/* Error message */}
        {errorMessage && (
          <div className="mb-6 p-3 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs">
            {errorMessage}
          </div>
        )}

        {/* Ethereal Orb */}
        <div className="relative flex items-center justify-center my-8">
          {/* Outer glow rings */}
          <div
            className={`w-48 h-48 sm:w-56 sm:h-56 rounded-full transition-all duration-700 flex items-center justify-center ${
              status === 'speaking'
                ? 'bg-gradient-to-tr from-emerald-500 via-teal-400 to-cyan-500 animate-voice-orb shadow-[0_0_80px_rgba(16,185,129,0.5)]'
                : status === 'thinking'
                ? 'bg-gradient-to-tr from-purple-600 via-indigo-500 to-pink-500 animate-pulse shadow-[0_0_60px_rgba(168,85,247,0.4)]'
                : status === 'listening'
                ? 'bg-gradient-to-tr from-emerald-600/80 via-teal-500/80 to-blue-600/80 scale-105 shadow-[0_0_50px_rgba(20,184,166,0.3)]'
                : 'bg-neutral-800 scale-95 opacity-50'
            }`}
          >
            {/* Inner fluid core */}
            <div className="w-32 h-32 sm:w-40 sm:h-40 rounded-full bg-[#171717] flex items-center justify-center shadow-inner">
              {status === 'thinking' ? (
                <Loader2 className="w-10 h-10 animate-spin text-purple-400" />
              ) : status === 'speaking' ? (
                <div className="flex items-center gap-1.5 h-10">
                  <span className="w-1.5 bg-emerald-400 rounded-full animate-voice-wave" />
                  <span className="w-1.5 bg-emerald-400 rounded-full animate-voice-wave [animation-delay:0.2s]" />
                  <span className="w-1.5 bg-emerald-400 rounded-full animate-voice-wave [animation-delay:0.4s]" />
                  <span className="w-1.5 bg-emerald-400 rounded-full animate-voice-wave [animation-delay:0.1s]" />
                </div>
              ) : status === 'listening' ? (
                <div className="flex items-center gap-1.5 h-6">
                  <span className="w-1 bg-teal-400 rounded-full animate-pulse h-4" />
                  <span className="w-1 bg-teal-400 rounded-full animate-pulse h-6" />
                  <span className="w-1 bg-teal-400 rounded-full animate-pulse h-3" />
                </div>
              ) : (
                <MicOff className="w-8 h-8 text-neutral-500" />
              )}
            </div>
          </div>
        </div>

        {/* State description */}
        <div className="text-center mt-2 space-y-1">
          <p className="text-base font-medium tracking-wide">
            {status === 'listening' && "Sizni tinglamoqdaman..."}
            {status === 'thinking' && "Fikrlanmoqda..."}
            {status === 'speaking' && "ChatGPT gapirmoqda..."}
            {status === 'idle' && (isMuted ? "Mikrofon o'chirilgan" : "Tayyor")}
          </p>
          <p className="text-xs text-neutral-400">
            {status === 'listening' && "O'zbek tilida savolingizni bering"}
            {status === 'speaking' && "Istalgan vaqt to'xtatishingiz mumkin"}
          </p>
        </div>

        {/* Live transcripts */}
        <div className="w-full mt-6 min-h-[70px] px-4 py-3 rounded-2xl bg-neutral-900/80 border border-neutral-800 text-xs text-neutral-300">
          {userTranscript ? (
            <div className="text-left">
              <span className="text-neutral-500 font-semibold block mb-0.5">Siz:</span>
              <p className="text-neutral-200">{userTranscript}</p>
            </div>
          ) : aiResponse ? (
            <div className="text-left">
              <span className="text-emerald-400 font-semibold block mb-0.5">ChatGPT:</span>
              <p className="text-neutral-200 line-clamp-3">{aiResponse}</p>
            </div>
          ) : (
            <span className="text-neutral-500 italic">
              "Salom ChatGPT, bugungi ob-havo qanday?" yoki istalgan mavzuda gapiring...
            </span>
          )}
        </div>
      </div>

      {/* Bottom Control Bar */}
      <div className="flex items-center justify-center gap-4 max-w-sm mx-auto w-full pt-4">
        {/* Mute/Unmute */}
        <button
          onClick={toggleMute}
          className={`w-14 h-14 rounded-full flex items-center justify-center transition-all cursor-pointer shadow-lg ${
            isMuted
              ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
              : 'bg-neutral-800 hover:bg-neutral-700 text-white'
          }`}
          title={isMuted ? "Mikrofonni yoqish" : "Mikrofonni o'chirish"}
        >
          {isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
        </button>

        {/* End voice call */}
        <button
          onClick={onClose}
          className="w-14 h-14 rounded-full bg-rose-600 hover:bg-rose-500 text-white flex items-center justify-center shadow-lg transition-transform active:scale-95 cursor-pointer"
          title="Suhbatni yakunlash"
        >
          <X className="w-6 h-6" />
        </button>
      </div>
    </div>
  );
};
