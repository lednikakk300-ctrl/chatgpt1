import React, { useState, useRef, useEffect } from 'react';
import {
  ArrowUp,
  Square,
  Paperclip,
  Mic,
  MicOff,
  Globe,
  Brain,
  X,
  FileText,
  Image as ImageIcon,
  Loader2,
} from 'lucide-react';
import { AttachedFile } from '../types';
import { createSpeechRecognition, isSpeechRecognitionSupported } from '../utils/speech';

interface ChatInputProps {
  onSendMessage: (
    text: string,
    files: AttachedFile[],
    options: { searchEnabled: boolean; reasoningMode: boolean }
  ) => void;
  isGenerating: boolean;
  onStopGeneration: () => void;
  speechLanguage: string;
}

export const ChatInput: React.FC<ChatInputProps> = ({
  onSendMessage,
  isGenerating,
  onStopGeneration,
  speechLanguage,
}) => {
  const [inputText, setInputText] = useState('');
  const [attachedFiles, setAttachedFiles] = useState<AttachedFile[]>([]);
  const [searchEnabled, setSearchEnabled] = useState(false);
  const [reasoningMode, setReasoningMode] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [micError, setMicError] = useState<string | null>(null);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);

  // Auto-resize textarea height
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(
        textareaRef.current.scrollHeight,
        200
      )}px`;
    }
  }, [inputText]);

  // Handle Speech Recognition
  const toggleRecording = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  const startRecording = () => {
    setMicError(null);
    if (!isSpeechRecognitionSupported()) {
      setMicError("Brauzeringizda ovozli kiritish qo'llab-quvvatlanmaydi.");
      setTimeout(() => setMicError(null), 3000);
      return;
    }

    try {
      const recognition = createSpeechRecognition(
        (text, isFinal) => {
          setInputText((prev) => {
            // Append or replace transcript naturally
            const trimmed = prev.trim();
            if (!trimmed) return text;
            return trimmed + ' ' + text;
          });
        },
        (error) => {
          console.warn("Speech error:", error);
          if (error.error === 'not-allowed') {
            setMicError("Mikrofon ruxsati berilmadi.");
          } else {
            setMicError("Ovoz aniqlanmadi, qayta urinib ko'ring.");
          }
          setIsRecording(false);
          setTimeout(() => setMicError(null), 3500);
        },
        () => {
          setIsRecording(false);
        },
        speechLanguage || 'uz-UZ'
      );

      if (recognition) {
        recognitionRef.current = recognition;
        recognition.start();
        setIsRecording(true);
      }
    } catch (err: any) {
      console.error("Mic start error:", err);
      setMicError("Mikrofonni ishga tushirib bo'lmadi.");
      setIsRecording(false);
    }
  };

  const stopRecording = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {}
      recognitionRef.current = null;
    }
    setIsRecording(false);
  };

  // Handle File Attachments
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        const base64Data = result.split(',')[1] || '';

        const newFile: AttachedFile = {
          id: `${Date.now()}-${Math.random()}`,
          name: file.name,
          mimeType: file.type || 'application/octet-stream',
          data: base64Data,
          url: file.type.startsWith('image/') ? result : undefined,
          size: file.size,
        };

        setAttachedFiles((prev) => [...prev, newFile]);
      };
      reader.readAsDataURL(file);
    });

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeFile = (id: string) => {
    setAttachedFiles((prev) => prev.filter((f) => f.id !== id));
  };

  // Submit message
  const handleSend = () => {
    if (isGenerating) {
      onStopGeneration();
      return;
    }

    if (!inputText.trim() && attachedFiles.length === 0) return;

    if (isRecording) {
      stopRecording();
    }

    onSendMessage(inputText.trim(), attachedFiles, {
      searchEnabled,
      reasoningMode,
    });

    setInputText('');
    setAttachedFiles([]);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto px-4 pb-3 sm:pb-5 pt-2">
      {/* Listening Banner */}
      {isRecording && (
        <div className="mb-2 px-3.5 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between text-xs text-emerald-600 dark:text-emerald-400 animate-pulse">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
            <span className="font-medium">
              Sizni tinglamoqdaman... O'zbek tilida bemalol gapiring.
            </span>
          </div>
          <button
            onClick={stopRecording}
            className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 underline cursor-pointer"
          >
            Yakunlash
          </button>
        </div>
      )}

      {/* Mic Error Notice */}
      {micError && (
        <div className="mb-2 px-3.5 py-1.5 rounded-lg bg-rose-500/10 border border-rose-500/30 text-xs text-rose-500 animate-in fade-in">
          {micError}
        </div>
      )}

      {/* Attached Files Preview */}
      {attachedFiles.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-2 p-2 bg-neutral-100 dark:bg-[#282828] rounded-xl border border-neutral-200 dark:border-neutral-700/60">
          {attachedFiles.map((file) => (
            <div
              key={file.id}
              className="relative group flex items-center gap-2 px-2.5 py-1.5 bg-white dark:bg-[#343434] rounded-lg border border-neutral-200 dark:border-neutral-700 text-xs shadow-xs"
            >
              {file.url ? (
                <img
                  src={file.url}
                  alt={file.name}
                  className="w-7 h-7 object-cover rounded"
                />
              ) : (
                <FileText className="w-4 h-4 text-emerald-500" />
              )}
              <span className="max-w-[120px] truncate font-medium text-neutral-800 dark:text-neutral-200">
                {file.name}
              </span>
              <button
                onClick={() => removeFile(file.id)}
                className="p-0.5 rounded-full hover:bg-neutral-200 dark:hover:bg-neutral-600 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Modern 1:1 ChatGPT Pill Container */}
      <div className="relative rounded-3xl bg-neutral-100 dark:bg-[#2f2f2f] border border-neutral-200/90 dark:border-neutral-700/60 shadow-md focus-within:border-neutral-400 dark:focus-within:border-neutral-500 transition-all p-2 sm:p-2.5">
        {/* Hidden File Input */}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileUpload}
          multiple
          accept="image/*,.txt,.md,.pdf,.csv,.json,.js,.py,.html"
          className="hidden"
        />

        {/* Text Area */}
        <textarea
          ref={textareaRef}
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="ChatGPT ga savol bering yoki topshiriq yuklang..."
          rows={1}
          className="w-full px-3 py-1.5 bg-transparent text-sm sm:text-[15px] text-neutral-900 dark:text-white placeholder-neutral-500 outline-none resize-none max-h-48 leading-relaxed font-sans"
        />

        {/* Action Controls Toolbar inside the pill */}
        <div className="flex items-center justify-between pt-1 px-1">
          {/* Left Tools: Attachment, Web Search, Reasoning */}
          <div className="flex items-center gap-1">
            {/* Attachment Button */}
            <button
              onClick={() => fileInputRef.current?.click()}
              className="p-2 rounded-full hover:bg-neutral-200 dark:hover:bg-[#3d3d3d] text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white transition-colors cursor-pointer"
              title="Fayl yoki rasm biriktirish"
            >
              <Paperclip className="w-4 h-4" />
            </button>

            {/* Web Search Toggle */}
            <button
              onClick={() => setSearchEnabled(!searchEnabled)}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium transition-colors cursor-pointer ${
                searchEnabled
                  ? 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/30'
                  : 'hover:bg-neutral-200 dark:hover:bg-[#3d3d3d] text-neutral-600 dark:text-neutral-400'
              }`}
              title="Internetdan jonli qidiruv"
            >
              <Globe className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Qidiruv</span>
            </button>

            {/* Deep Reasoning Mode Toggle */}
            <button
              onClick={() => setReasoningMode(!reasoningMode)}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium transition-colors cursor-pointer ${
                reasoningMode
                  ? 'bg-purple-500/15 text-purple-600 dark:text-purple-400 border border-purple-500/30'
                  : 'hover:bg-neutral-200 dark:hover:bg-[#3d3d3d] text-neutral-600 dark:text-neutral-400'
              }`}
              title="Chuqur mantiqiy fikrlash rejimi"
            >
              <Brain className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Fikrlash</span>
            </button>
          </div>

          {/* Right Controls: Microphone & Send/Stop Button */}
          <div className="flex items-center gap-1.5">
            {/* Microphone Button (Ovozli kiritish) */}
            <button
              onClick={toggleRecording}
              className={`p-2 rounded-full transition-all cursor-pointer ${
                isRecording
                  ? 'bg-rose-500 text-white animate-pulse shadow-md ring-2 ring-rose-400'
                  : 'hover:bg-neutral-200 dark:hover:bg-[#3d3d3d] text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white'
              }`}
              title={
                isRecording
                  ? "Ovoz yozishni to'xtatish"
                  : "Mikrofon orqali gapirish (Ovozli kiritish)"
              }
            >
              {isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </button>

            {/* Send / Stop Button */}
            {isGenerating ? (
              <button
                onClick={onStopGeneration}
                className="w-8 h-8 rounded-full bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 flex items-center justify-center hover:opacity-85 transition-opacity cursor-pointer shadow-xs"
                title="To'xtatish"
              >
                <Square className="w-3.5 h-3.5 fill-current" />
              </button>
            ) : (
              <button
                onClick={handleSend}
                disabled={!inputText.trim() && attachedFiles.length === 0}
                className={`w-8 h-8 rounded-full flex items-center justify-center transition-all cursor-pointer ${
                  inputText.trim() || attachedFiles.length > 0
                    ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 shadow-xs hover:opacity-90 active:scale-95'
                    : 'bg-neutral-300 dark:bg-neutral-700 text-neutral-500 dark:text-neutral-400 cursor-not-allowed opacity-50'
                }`}
                title="Yuborish"
              >
                <ArrowUp className="w-4 h-4 stroke-[2.5]" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Disclaimer */}
      <div className="text-center mt-2">
        <p className="text-[11px] text-neutral-400 dark:text-neutral-500">
          ChatGPT xato qilishi mumkin. Muhim ma'lumotlarni tekshiring.
        </p>
      </div>
    </div>
  );
};
