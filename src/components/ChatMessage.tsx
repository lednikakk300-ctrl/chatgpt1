import React, { useState } from 'react';
import {
  Copy,
  Check,
  Volume2,
  VolumeX,
  RotateCcw,
  ThumbsUp,
  ThumbsDown,
  Edit3,
  Loader2,
  Brain,
} from 'lucide-react';
import { ChatGPTLogo } from './Icons';
import { MarkdownRenderer } from './MarkdownRenderer';
import { Message } from '../types';

interface ChatMessageProps {
  message: Message;
  onRegenerate?: () => void;
  onEdit?: (newText: string) => void;
  onSpeak: (text: string, messageId: string) => void;
  onStopSpeaking: () => void;
  isSpeaking: boolean;
  speakingMessageId: string | null;
  isLoadingAudio: boolean;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({
  message,
  onRegenerate,
  onEdit,
  onSpeak,
  onStopSpeaking,
  isSpeaking,
  speakingMessageId,
  isLoadingAudio,
}) => {
  const isAssistant = message.role === 'assistant';
  const [copied, setCopied] = useState(false);
  const [feedback, setFeedback] = useState<'like' | 'dislike' | null>(message.feedback || null);
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(message.text);

  const handleCopy = () => {
    navigator.clipboard.writeText(message.text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isCurrentAudio = speakingMessageId === message.id;

  const handleToggleSpeak = () => {
    if (isCurrentAudio && isSpeaking) {
      onStopSpeaking();
    } else {
      onSpeak(message.text, message.id);
    }
  };

  return (
    <div
      className={`py-4 px-4 sm:px-6 w-full transition-colors ${
        isAssistant
          ? 'bg-transparent text-neutral-800 dark:text-neutral-100'
          : 'bg-transparent text-neutral-900 dark:text-white'
      }`}
    >
      <div className="max-w-3xl mx-auto flex gap-4 items-start">
        {/* Avatar */}
        {isAssistant ? (
          <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-sm mt-0.5">
            <ChatGPTLogo className="w-5 h-5" />
          </div>
        ) : (
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-emerald-600 to-teal-500 text-white font-semibold text-xs flex items-center justify-center shrink-0 shadow-sm mt-0.5">
            Siz
          </div>
        )}

        {/* Content Body */}
        <div className="flex-1 min-w-0">
          {/* Header info */}
          <div className="flex items-center gap-2 mb-1">
            <span className="font-semibold text-xs text-neutral-900 dark:text-neutral-200">
              {isAssistant ? 'ChatGPT' : 'Siz'}
            </span>
            <span className="text-[10px] text-neutral-400">
              {new Date(message.timestamp).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>
            {isAssistant && message.reasoningTime && (
              <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.2 rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-400 font-mono">
                <Brain className="w-3 h-3" />
                <span>{message.reasoningTime}s fikrladi</span>
              </span>
            )}
          </div>

          {/* Attached Files / Images */}
          {message.files && message.files.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-3">
              {message.files.map((file) => (
                <div
                  key={file.id}
                  className="rounded-xl overflow-hidden border border-neutral-200 dark:border-neutral-700 max-w-xs shadow-xs"
                >
                  {file.mimeType.startsWith('image/') ? (
                    <img
                      src={file.url || `data:${file.mimeType};base64,${file.data}`}
                      alt={file.name}
                      className="max-h-60 w-auto object-cover rounded-lg"
                    />
                  ) : (
                    <div className="p-3 bg-neutral-100 dark:bg-neutral-800 text-xs text-neutral-700 dark:text-neutral-300">
                      📄 {file.name}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Text content or edit mode */}
          {isEditing ? (
            <div className="space-y-2 mt-1">
              <textarea
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                className="w-full p-3 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 text-sm text-neutral-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500"
                rows={3}
              />
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    if (onEdit && editText.trim()) {
                      onEdit(editText.trim());
                    }
                    setIsEditing(false);
                  }}
                  className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium cursor-pointer"
                >
                  Saqlash va yuborish
                </button>
                <button
                  onClick={() => setIsEditing(false)}
                  className="px-3 py-1.5 rounded-lg bg-neutral-200 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300 text-xs cursor-pointer"
                >
                  Bekor qilish
                </button>
              </div>
            </div>
          ) : isAssistant ? (
            <div className="text-sm leading-relaxed text-neutral-800 dark:text-neutral-200">
              <MarkdownRenderer content={message.text} />
              {message.isStreaming && (
                <span className="inline-block w-2 h-4 bg-emerald-500 ml-1 animate-pulse align-middle" />
              )}
            </div>
          ) : (
            <div className="text-sm leading-relaxed whitespace-pre-wrap text-neutral-900 dark:text-neutral-100 font-normal">
              {message.text}
            </div>
          )}

          {/* Action buttons bar */}
          {!message.isStreaming && (
            <div className="flex items-center gap-1 mt-2.5 text-neutral-400 dark:text-neutral-500">
              {/* Copy */}
              <button
                onClick={handleCopy}
                className="p-1.5 rounded-md hover:bg-neutral-100 dark:hover:bg-neutral-800 hover:text-neutral-700 dark:hover:text-neutral-300 transition-colors cursor-pointer"
                title="Nusxa olish"
              >
                {copied ? (
                  <Check className="w-3.5 h-3.5 text-emerald-500" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
              </button>

              {/* Text to Speech (Tinglash) */}
              <button
                onClick={handleToggleSpeak}
                disabled={isLoadingAudio && isCurrentAudio}
                className={`p-1.5 rounded-md hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer ${
                  isCurrentAudio && isSpeaking
                    ? 'text-emerald-500 bg-emerald-500/10'
                    : 'hover:text-neutral-700 dark:hover:text-neutral-300'
                }`}
                title={
                  isCurrentAudio && isSpeaking
                    ? "To'xtatish"
                    : "Ovozli o'qish (TTS tinglash)"
                }
              >
                {isLoadingAudio && isCurrentAudio ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-500" />
                ) : isCurrentAudio && isSpeaking ? (
                  <VolumeX className="w-3.5 h-3.5 text-emerald-500 animate-pulse" />
                ) : (
                  <Volume2 className="w-3.5 h-3.5" />
                )}
              </button>

              {/* Regenerate if Assistant */}
              {isAssistant && onRegenerate && (
                <button
                  onClick={onRegenerate}
                  className="p-1.5 rounded-md hover:bg-neutral-100 dark:hover:bg-neutral-800 hover:text-neutral-700 dark:hover:text-neutral-300 transition-colors cursor-pointer"
                  title="Qayta generatsiya qilish"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              )}

              {/* Feedback Likes */}
              {isAssistant && (
                <>
                  <button
                    onClick={() => setFeedback(feedback === 'like' ? null : 'like')}
                    className={`p-1.5 rounded-md hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer ${
                      feedback === 'like'
                        ? 'text-emerald-500 bg-emerald-500/10'
                        : 'hover:text-neutral-700 dark:hover:text-neutral-300'
                    }`}
                    title="Javob yoqdi"
                  >
                    <ThumbsUp className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setFeedback(feedback === 'dislike' ? null : 'dislike')}
                    className={`p-1.5 rounded-md hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer ${
                      feedback === 'dislike'
                        ? 'text-rose-500 bg-rose-500/10'
                        : 'hover:text-neutral-700 dark:hover:text-neutral-300'
                    }`}
                    title="Javob yoqmadi"
                  >
                    <ThumbsDown className="w-3.5 h-3.5" />
                  </button>
                </>
              )}

              {/* Edit if User message */}
              {!isAssistant && onEdit && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="p-1.5 rounded-md hover:bg-neutral-100 dark:hover:bg-neutral-800 hover:text-neutral-700 dark:hover:text-neutral-300 transition-colors cursor-pointer"
                  title="Xabarni tahrirlash"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
