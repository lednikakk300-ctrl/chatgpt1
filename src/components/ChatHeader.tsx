import React, { useState, useRef, useEffect } from 'react';
import {
  Menu,
  ChevronDown,
  Sparkles,
  Zap,
  BrainCircuit,
  Headphones,
  Share2,
  Trash2,
  Check,
} from 'lucide-react';
import { ModelOption } from '../types';
import { AVAILABLE_MODELS } from '../utils/constants';

interface ChatHeaderProps {
  onToggleSidebar: () => void;
  selectedModelId: string;
  onSelectModel: (id: string) => void;
  onOpenVoiceMode: () => void;
  onClearChat: () => void;
  hasMessages: boolean;
  currentTitle?: string;
}

export const ChatHeader: React.FC<ChatHeaderProps> = ({
  onToggleSidebar,
  selectedModelId,
  onSelectModel,
  onOpenVoiceMode,
  onClearChat,
  hasMessages,
  currentTitle,
}) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [copiedShare, setCopiedShare] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const currentModel =
    AVAILABLE_MODELS.find((m) => m.id === selectedModelId) || AVAILABLE_MODELS[0];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopiedShare(true);
    setTimeout(() => setCopiedShare(false), 2000);
  };

  const getModelIcon = (id: string) => {
    switch (id) {
      case 'o1':
        return <BrainCircuit className="w-4 h-4 text-purple-400" />;
      case 'gpt-4o-mini':
        return <Zap className="w-4 h-4 text-amber-400" />;
      default:
        return <Sparkles className="w-4 h-4 text-emerald-400" />;
    }
  };

  return (
    <header className="sticky top-0 z-20 flex items-center justify-between px-3.5 py-2.5 bg-white/80 dark:bg-[#212121]/80 backdrop-blur-md border-b border-neutral-200/80 dark:border-neutral-800/80">
      <div className="flex items-center gap-2">
        <button
          onClick={onToggleSidebar}
          className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors"
          title="Menyu"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Model Selector Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800/90 text-neutral-800 dark:text-neutral-200 font-semibold text-base transition-colors group cursor-pointer"
          >
            <span>{currentModel.name}</span>
            <ChevronDown
              className={`w-4 h-4 text-neutral-400 transition-transform duration-200 ${
                dropdownOpen ? 'rotate-180 text-emerald-500' : ''
              }`}
            />
          </button>

          {dropdownOpen && (
            <div className="absolute left-0 mt-1.5 w-72 p-1.5 bg-white dark:bg-[#282828] border border-neutral-200 dark:border-neutral-700/80 rounded-2xl shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-100">
              <div className="px-2 py-1 text-[11px] font-semibold text-neutral-400 uppercase tracking-wider">
                Modelni tanlang
              </div>
              <div className="space-y-1">
                {AVAILABLE_MODELS.map((model) => {
                  const isSelected = model.id === selectedModelId;
                  return (
                    <button
                      key={model.id}
                      onClick={() => {
                        onSelectModel(model.id);
                        setDropdownOpen(false);
                      }}
                      className={`flex items-start gap-2.5 w-full p-2.5 rounded-xl text-left transition-colors cursor-pointer ${
                        isSelected
                          ? 'bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-white'
                          : 'hover:bg-neutral-50 dark:hover:bg-neutral-800/50 text-neutral-700 dark:text-neutral-300'
                      }`}
                    >
                      <div className="mt-0.5 shrink-0">{getModelIcon(model.id)}</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-xs text-neutral-900 dark:text-white">
                            {model.name}
                          </span>
                          {model.badge && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-medium">
                              {model.badge}
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5 leading-snug">
                          {model.description}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex items-center gap-1.5">
        {/* Fullscreen Voice Mode Trigger */}
        <button
          onClick={onOpenVoiceMode}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium shadow-xs hover:shadow transition-all active:scale-95 cursor-pointer"
          title="Ovozli suhbat rejimini boshlash"
        >
          <Headphones className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Ovozli suhbat</span>
        </button>

        {/* Share Button */}
        <button
          onClick={handleShare}
          className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors"
          title="Ulashish"
        >
          {copiedShare ? (
            <Check className="w-4 h-4 text-emerald-500" />
          ) : (
            <Share2 className="w-4 h-4" />
          )}
        </button>

        {/* Clear chat if has messages */}
        {hasMessages && (
          <button
            onClick={onClearChat}
            className="p-1.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/30 text-neutral-400 hover:text-rose-500 transition-colors"
            title="Suhbatni tozalash"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>
    </header>
  );
};
