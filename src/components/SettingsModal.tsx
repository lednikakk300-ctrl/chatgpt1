import React, { useState } from 'react';
import {
  X,
  Volume2,
  Moon,
  Sun,
  Globe,
  Sliders,
  Trash2,
  Download,
  Check,
  AlertTriangle,
} from 'lucide-react';
import { UserSettings, ChatSession } from '../types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: UserSettings;
  onUpdateSettings: (newSettings: UserSettings) => void;
  onClearAllSessions: () => void;
  sessions: ChatSession[];
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
  onClearAllSessions,
  sessions,
}) => {
  const [activeTab, setActiveTab] = useState<'general' | 'speech' | 'data'>('general');
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [copiedExport, setCopiedExport] = useState(false);

  if (!isOpen) return null;

  const voices: { id: UserSettings['voice']; label: string; desc: string }[] = [
    { id: 'Kore', label: 'Kore', desc: "Tabiiy va ohangdor ovoz (Tavsiya)" },
    { id: 'Puck', label: 'Puck', desc: "Jonli va faol yosh ovoz" },
    { id: 'Zephyr', label: 'Zephyr', desc: "Yumshoq va xotirjam ovoz" },
    { id: 'Fenrir', label: 'Fenrir', desc: "Chuqur va jiddiy erkak ovozi" },
    { id: 'Charon', label: 'Charon', desc: "Bosiq va rasmiy ohang" },
  ];

  const handleExportData = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(sessions, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `chatgpt_uzbek_export_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    setCopiedExport(true);
    setTimeout(() => setCopiedExport(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-[#282828] border border-neutral-200 dark:border-neutral-700/80 rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl flex flex-col text-neutral-900 dark:text-neutral-100">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-200 dark:border-neutral-700/80">
          <h2 className="font-semibold text-base">Sozlamalar</h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-700 text-neutral-400 hover:text-neutral-700 dark:hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab navigation */}
        <div className="flex border-b border-neutral-200 dark:border-neutral-700/80 px-5 gap-4 text-xs font-medium">
          <button
            onClick={() => setActiveTab('general')}
            className={`py-3 border-b-2 cursor-pointer transition-colors ${
              activeTab === 'general'
                ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400 font-semibold'
                : 'border-transparent text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-300'
            }`}
          >
            Umumiy
          </button>
          <button
            onClick={() => setActiveTab('speech')}
            className={`py-3 border-b-2 cursor-pointer transition-colors ${
              activeTab === 'speech'
                ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400 font-semibold'
                : 'border-transparent text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-300'
            }`}
          >
            Ovoz va Mikrofon
          </button>
          <button
            onClick={() => setActiveTab('data')}
            className={`py-3 border-b-2 cursor-pointer transition-colors ${
              activeTab === 'data'
                ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400 font-semibold'
                : 'border-transparent text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-300'
            }`}
          >
            Xotira va Ma'lumotlar
          </button>
        </div>

        {/* Tab content */}
        <div className="p-5 space-y-4 max-h-[65vh] overflow-y-auto text-sm">
          {activeTab === 'general' && (
            <div className="space-y-4">
              {/* Theme */}
              <div className="flex items-center justify-between py-2 border-b border-neutral-200 dark:border-neutral-700/60">
                <div>
                  <div className="font-medium">Mavzu (Interfeys ko'rinishi)</div>
                  <div className="text-xs text-neutral-500 dark:text-neutral-400">
                    Qorong'i yoki yorug' rejimni tanlang
                  </div>
                </div>
                <div className="flex items-center gap-1 bg-neutral-100 dark:bg-neutral-800 p-1 rounded-xl">
                  <button
                    onClick={() => onUpdateSettings({ ...settings, theme: 'light' })}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                      settings.theme === 'light'
                        ? 'bg-white text-neutral-900 shadow-xs'
                        : 'text-neutral-500 hover:text-neutral-800 dark:hover:text-white'
                    }`}
                  >
                    <Sun className="w-3.5 h-3.5" />
                    <span>Yorug'</span>
                  </button>
                  <button
                    onClick={() => onUpdateSettings({ ...settings, theme: 'dark' })}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                      settings.theme === 'dark'
                        ? 'bg-[#343434] text-white shadow-xs'
                        : 'text-neutral-500 hover:text-neutral-800 dark:hover:text-white'
                    }`}
                  >
                    <Moon className="w-3.5 h-3.5" />
                    <span>Qorong'i</span>
                  </button>
                </div>
              </div>

              {/* Custom System Instruction */}
              <div>
                <label className="block font-medium mb-1">
                  Maxsus ko'rsatma (Custom instructions)
                </label>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-2">
                  ChatGPT sizga qanday javob berishini xohlaysiz? Masalan: "Har doim qisqa va aniq javob ber"
                </p>
                <textarea
                  value={settings.systemInstruction}
                  onChange={(e) =>
                    onUpdateSettings({ ...settings, systemInstruction: e.target.value })
                  }
                  placeholder="ChatGPT uchun maxsus ko'rsatma yozing (ixtiyoriy)..."
                  rows={3}
                  className="w-full p-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 text-xs text-neutral-900 dark:text-white outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>
            </div>
          )}

          {activeTab === 'speech' && (
            <div className="space-y-4">
              {/* Voice model */}
              <div>
                <label className="block font-medium mb-1">AI Ovoz modeli (TTS)</label>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-2">
                  Javoblarni ovozli o'qishda ishlatiladigan Gemini 3.8 nutq modeli
                </p>
                <div className="grid grid-cols-1 gap-2">
                  {voices.map((v) => (
                    <button
                      key={v.id}
                      onClick={() => onUpdateSettings({ ...settings, voice: v.id })}
                      className={`flex items-center justify-between p-2.5 rounded-xl border text-left transition-colors cursor-pointer ${
                        settings.voice === v.id
                          ? 'border-emerald-500 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                          : 'border-neutral-200 dark:border-neutral-700/80 hover:bg-neutral-50 dark:hover:bg-neutral-800 text-neutral-800 dark:text-neutral-200'
                      }`}
                    >
                      <div>
                        <div className="font-semibold text-xs">{v.label}</div>
                        <div className="text-[11px] text-neutral-500 dark:text-neutral-400">
                          {v.desc}
                        </div>
                      </div>
                      {settings.voice === v.id && (
                        <Check className="w-4 h-4 text-emerald-500" />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Speech recognition language */}
              <div className="pt-2 border-t border-neutral-200 dark:border-neutral-700/60">
                <label className="block font-medium mb-1">Mikrofon tili</label>
                <select
                  value={settings.speechLanguage}
                  onChange={(e) =>
                    onUpdateSettings({
                      ...settings,
                      speechLanguage: e.target.value as any,
                    })
                  }
                  className="w-full p-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 text-xs text-neutral-900 dark:text-white outline-none cursor-pointer"
                >
                  <option value="uz-UZ">O'zbek tili (uz-UZ)</option>
                  <option value="ru-RU">Русский язык (ru-RU)</option>
                  <option value="en-US">English (en-US)</option>
                </select>
              </div>

              {/* Speech rate slider */}
              <div className="pt-2 border-t border-neutral-200 dark:border-neutral-700/60">
                <div className="flex items-center justify-between mb-1">
                  <label className="font-medium text-xs">Ovoz tezligi</label>
                  <span className="text-xs font-mono text-neutral-500">
                    {settings.speechRate}x
                  </span>
                </div>
                <input
                  type="range"
                  min="0.7"
                  max="1.5"
                  step="0.1"
                  value={settings.speechRate}
                  onChange={(e) =>
                    onUpdateSettings({
                      ...settings,
                      speechRate: parseFloat(e.target.value),
                    })
                  }
                  className="w-full accent-emerald-500 cursor-pointer"
                />
              </div>
            </div>
          )}

          {activeTab === 'data' && (
            <div className="space-y-4">
              {/* Export chats */}
              <div className="flex items-center justify-between py-2 border-b border-neutral-200 dark:border-neutral-700/60">
                <div>
                  <div className="font-medium">Suhbatlarni yuklab olish</div>
                  <div className="text-xs text-neutral-500 dark:text-neutral-400">
                    Barcha suhbatlar tarixini JSON formatida saqlang
                  </div>
                </div>
                <button
                  onClick={handleExportData}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-xs font-medium transition-colors cursor-pointer"
                >
                  {copiedExport ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-500" />
                      <span>Yuklandi!</span>
                    </>
                  ) : (
                    <>
                      <Download className="w-3.5 h-3.5" />
                      <span>Eksport</span>
                    </>
                  )}
                </button>
              </div>

              {/* Clear chats */}
              <div className="py-2">
                <div className="font-medium text-rose-500">Tarixni tozalash</div>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-3">
                  Barcha saqlangan suhbatlar va xabarlarni butunlay o'chirib tashlash.
                </p>

                {showClearConfirm ? (
                  <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 space-y-2">
                    <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400 text-xs font-semibold">
                      <AlertTriangle className="w-4 h-4" />
                      <span>Rostdan ham barcha suhbatlarni o'chirmoqchimisiz?</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          onClearAllSessions();
                          setShowClearConfirm(false);
                          onClose();
                        }}
                        className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-medium cursor-pointer"
                      >
                        Ha, butunlay tozalash
                      </button>
                      <button
                        onClick={() => setShowClearConfirm(false)}
                        className="px-3 py-1.5 rounded-lg bg-neutral-200 dark:bg-neutral-700 text-xs cursor-pointer"
                      >
                        Bekor qilish
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => setShowClearConfirm(true)}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-medium border border-rose-500/30 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Barcha suhbatlarni o'chirish</span>
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-neutral-200 dark:border-neutral-700/80 bg-neutral-50 dark:bg-neutral-800/40 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 text-xs font-medium hover:opacity-90 transition-opacity cursor-pointer"
          >
            Yopish
          </button>
        </div>
      </div>
    </div>
  );
};
