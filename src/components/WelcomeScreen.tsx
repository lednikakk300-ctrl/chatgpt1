import React from 'react';
import { ChatGPTLogo } from './Icons';
import { SAMPLE_PROMPTS } from '../utils/constants';
import { Sparkles, Mic, FileText, Code2, TrendingUp, BookOpen } from 'lucide-react';

interface WelcomeScreenProps {
  onSelectPrompt: (promptText: string) => void;
  onOpenVoiceMode: () => void;
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({
  onSelectPrompt,
  onOpenVoiceMode,
}) => {
  return (
    <div className="flex-1 flex flex-col items-center justify-center px-4 py-8 max-w-3xl mx-auto w-full text-center select-none animate-in fade-in duration-300">
      {/* Central Logo */}
      <div className="w-16 h-16 rounded-full bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 flex items-center justify-center shadow-lg mb-6 ring-4 ring-neutral-200 dark:ring-neutral-800">
        <ChatGPTLogo className="w-10 h-10" />
      </div>

      <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-neutral-900 dark:text-neutral-100 mb-2">
        Bugun sizga qanday yordam bera olaman?
      </h1>
      <p className="text-sm text-neutral-500 dark:text-neutral-400 max-w-md mb-8">
        ChatGPT O'zbekcha yordamchisi bilan savol-javob qiling, kod yozing yoki ovozli muloqot qiling.
      </p>

      {/* Voice Mode Promo Pill */}
      <button
        onClick={onOpenVoiceMode}
        className="mb-8 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-medium border border-emerald-500/30 transition-all hover:scale-105 active:scale-95 cursor-pointer shadow-xs"
      >
        <span className="flex h-2 w-2 relative">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
        </span>
        <Mic className="w-3.5 h-3.5" />
        <span>Ovozli suhbat rejimi - mikrofonda jonli gaplashing</span>
      </button>

      {/* Suggestion prompt cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full text-left">
        {SAMPLE_PROMPTS.map((item, index) => (
          <button
            key={index}
            onClick={() => onSelectPrompt(item.prompt)}
            className="group flex flex-col justify-between p-3.5 rounded-2xl border border-neutral-200/90 dark:border-neutral-800/90 bg-white dark:bg-[#282828]/60 hover:bg-neutral-50 dark:hover:bg-[#2e2e2e] hover:border-neutral-300 dark:hover:border-neutral-700 transition-all text-left shadow-xs hover:shadow-sm cursor-pointer"
          >
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-base">{item.icon}</span>
              <span className="font-semibold text-xs text-neutral-900 dark:text-neutral-100">
                {item.title}
              </span>
            </div>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 line-clamp-2 leading-relaxed group-hover:text-neutral-700 dark:group-hover:text-neutral-300 transition-colors">
              {item.desc}
            </p>
          </button>
        ))}
      </div>
    </div>
  );
};
