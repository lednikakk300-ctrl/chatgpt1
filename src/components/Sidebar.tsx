import React, { useState } from 'react';
import {
  Plus,
  MessageSquare,
  Search,
  MoreHorizontal,
  Trash2,
  Edit2,
  Check,
  X,
  Settings,
  Sun,
  Moon,
  PanelLeftClose,
  Sparkles,
  ExternalLink,
} from 'lucide-react';
import { ChatGPTLogo } from './Icons';
import { ChatSession, UserSettings } from '../types';

interface SidebarProps {
  sessions: ChatSession[];
  activeSessionId: string | null;
  onSelectSession: (id: string) => void;
  onNewChat: () => void;
  onDeleteSession: (id: string) => void;
  onRenameSession: (id: string, newTitle: string) => void;
  isOpen: boolean;
  onClose: () => void;
  onOpenSettings: () => void;
  settings: UserSettings;
  onToggleTheme: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  sessions,
  activeSessionId,
  onSelectSession,
  onNewChat,
  onDeleteSession,
  onRenameSession,
  isOpen,
  onClose,
  onOpenSettings,
  settings,
  onToggleTheme,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);

  const startEditing = (session: ChatSession, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(session.id);
    setEditingTitle(session.title);
    setMenuOpenId(null);
  };

  const saveEditing = (id: string, e: React.MouseEvent | React.FormEvent) => {
    e.stopPropagation();
    if (editingTitle.trim()) {
      onRenameSession(id, editingTitle.trim());
    }
    setEditingId(null);
  };

  const cancelEditing = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(null);
  };

  // Group sessions by date
  const filteredSessions = sessions.filter((s) =>
    s.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const now = Date.now();
  const oneDay = 24 * 60 * 60 * 1000;
  const sevenDays = 7 * oneDay;

  const todaySessions = filteredSessions.filter((s) => now - s.updatedAt < oneDay);
  const yesterdaySessions = filteredSessions.filter(
    (s) => now - s.updatedAt >= oneDay && now - s.updatedAt < 2 * oneDay
  );
  const last7DaysSessions = filteredSessions.filter(
    (s) => now - s.updatedAt >= 2 * oneDay && now - s.updatedAt < sevenDays
  );
  const olderSessions = filteredSessions.filter((s) => now - s.updatedAt >= sevenDays);

  const renderSessionGroup = (title: string, groupSessions: ChatSession[]) => {
    if (groupSessions.length === 0) return null;

    return (
      <div key={title} className="mb-4">
        <div className="px-3 py-1.5 text-xs font-semibold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider">
          {title}
        </div>
        <div className="space-y-0.5">
          {groupSessions.map((session) => {
            const isActive = session.id === activeSessionId;
            const isEditing = editingId === session.id;

            return (
              <div
                key={session.id}
                onClick={() => {
                  onSelectSession(session.id);
                  if (window.innerWidth < 1024) onClose();
                }}
                className={`group relative flex items-center justify-between px-3 py-2 text-sm rounded-lg cursor-pointer transition-colors ${
                  isActive
                    ? 'bg-neutral-200 dark:bg-[#212121] text-neutral-900 dark:text-white font-medium'
                    : 'text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-[#212121]/60'
                }`}
              >
                {isEditing ? (
                  <div
                    className="flex items-center gap-1.5 w-full"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <input
                      type="text"
                      value={editingTitle}
                      onChange={(e) => setEditingTitle(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') saveEditing(session.id, e);
                        if (e.key === 'Escape') setEditingId(null);
                      }}
                      autoFocus
                      className="flex-1 bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-600 rounded px-2 py-0.5 text-xs text-neutral-900 dark:text-white outline-none focus:ring-1 focus:ring-emerald-500"
                    />
                    <button
                      onClick={(e) => saveEditing(session.id, e)}
                      className="p-1 hover:text-emerald-500 text-neutral-400"
                    >
                      <Check className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={cancelEditing}
                      className="p-1 hover:text-rose-500 text-neutral-400"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-2.5 truncate flex-1 min-w-0 pr-1">
                      <MessageSquare className="w-4 h-4 shrink-0 text-neutral-400 dark:text-neutral-500" />
                      <span className="truncate text-[13px]">{session.title}</span>
                    </div>

                    <div className="relative shrink-0 flex items-center">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setMenuOpenId(menuOpenId === session.id ? null : session.id);
                        }}
                        className={`p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity hover:bg-neutral-300 dark:hover:bg-neutral-700 text-neutral-400 ${
                          menuOpenId === session.id ? 'opacity-100' : ''
                        }`}
                      >
                        <MoreHorizontal className="w-4 h-4" />
                      </button>

                      {menuOpenId === session.id && (
                        <div
                          className="absolute right-0 top-7 z-50 w-36 py-1 bg-white dark:bg-[#2f2f2f] border border-neutral-200 dark:border-neutral-700 rounded-lg shadow-xl text-xs"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            onClick={(e) => startEditing(session, e)}
                            className="flex items-center gap-2 w-full px-3 py-1.5 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700/60"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                            <span>Nomini o'zgartirish</span>
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onDeleteSession(session.id);
                              setMenuOpenId(null);
                            }}
                            className="flex items-center gap-2 w-full px-3 py-1.5 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>O'chirish</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-xs lg:hidden transition-opacity"
          onClick={onClose}
        />
      )}

      {/* Sidebar container */}
      <aside
        className={`fixed lg:static top-0 left-0 z-50 h-full w-[260px] bg-[#f9f9f9] dark:bg-[#171717] border-r border-neutral-200 dark:border-neutral-800/80 flex flex-col transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Top Header & New Chat */}
        <div className="p-3 space-y-2 border-b border-neutral-200 dark:border-neutral-800/60">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 px-1 text-neutral-800 dark:text-white font-semibold text-sm">
              <ChatGPTLogo className="w-5 h-5 text-emerald-600 dark:text-emerald-500" />
              <span>ChatGPT O'zbekcha</span>
            </div>
            <button
              onClick={onClose}
              className="lg:hidden p-1.5 text-neutral-400 hover:text-neutral-200 hover:bg-neutral-200 dark:hover:bg-neutral-800 rounded-md"
              title="Yopish"
            >
              <PanelLeftClose className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={() => {
              onNewChat();
              if (window.innerWidth < 1024) onClose();
            }}
            className="flex items-center justify-between w-full px-3 py-2.5 rounded-xl bg-white dark:bg-[#212121] border border-neutral-200 dark:border-neutral-700/60 hover:bg-neutral-100 dark:hover:bg-[#2a2a2a] text-neutral-900 dark:text-white text-sm font-medium shadow-xs transition-colors cursor-pointer group"
          >
            <div className="flex items-center gap-2.5">
              <Plus className="w-4 h-4 text-emerald-500 group-hover:rotate-90 transition-transform duration-200" />
              <span>Yangi suhbat</span>
            </div>
            <span className="text-[10px] uppercase font-mono text-neutral-400 bg-neutral-100 dark:bg-neutral-800 px-1.5 py-0.5 rounded border border-neutral-200 dark:border-neutral-700">
              Ctrl+K
            </span>
          </button>

          {/* Search bar */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
            <input
              type="text"
              placeholder="Suhbatlarni qidirish..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-neutral-200/60 dark:bg-neutral-800/70 border border-transparent focus:border-neutral-300 dark:focus:border-neutral-700 text-xs text-neutral-900 dark:text-neutral-200 placeholder-neutral-500 outline-none transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-200"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>

        {/* Chat History List */}
        <div className="flex-1 overflow-y-auto px-2 py-3">
          {filteredSessions.length === 0 ? (
            <div className="px-3 py-8 text-center text-xs text-neutral-400 dark:text-neutral-500">
              {searchQuery ? "Bunday suhbat topilmadi" : "Hozircha suhbatlar yo'q.\nYangi suhbat boshlang!"}
            </div>
          ) : (
            <>
              {renderSessionGroup('Bugun', todaySessions)}
              {renderSessionGroup('Kecha', yesterdaySessions)}
              {renderSessionGroup('Oxirgi 7 kun', last7DaysSessions)}
              {renderSessionGroup('Oldingi suhbatlar', olderSessions)}
            </>
          )}
        </div>

        {/* Plus Plan / Uzbek Pro Banner */}
        <div className="p-3 border-t border-neutral-200 dark:border-neutral-800/80">
          <div className="p-2.5 rounded-xl bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-indigo-500/10 border border-emerald-500/20 dark:border-emerald-500/30 text-xs mb-2">
            <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-semibold mb-0.5">
              <Sparkles className="w-3.5 h-3.5 shrink-0" />
              <span>O'zbekcha Aqlli Model</span>
            </div>
            <p className="text-[11px] text-neutral-600 dark:text-neutral-400 leading-snug">
              Gemini 3.8 Flash dvigateli va ovozli aloqa bilan ta'minlangan.
            </p>
          </div>

          {/* User profile & actions */}
          <div className="flex items-center justify-between pt-1">
            <button
              onClick={onOpenSettings}
              className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg hover:bg-neutral-200/80 dark:hover:bg-neutral-800/80 text-left text-xs transition-colors flex-1 min-w-0"
            >
              <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white font-bold text-xs shrink-0 shadow-xs">
                O'Z
              </div>
              <div className="truncate min-w-0">
                <div className="font-medium text-neutral-900 dark:text-neutral-100 truncate">
                  Foydalanuvchi
                </div>
                <div className="text-[10px] text-neutral-500 dark:text-neutral-400">
                  Sozlamalar
                </div>
              </div>
            </button>

            <div className="flex items-center gap-0.5 shrink-0">
              <button
                onClick={onToggleTheme}
                className="p-1.5 rounded-md hover:bg-neutral-200 dark:hover:bg-neutral-800 text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors"
                title={settings.theme === 'dark' ? "Yorug' rejim" : "Qorong'i rejim"}
              >
                {settings.theme === 'dark' ? (
                  <Sun className="w-4 h-4 text-amber-400" />
                ) : (
                  <Moon className="w-4 h-4 text-neutral-600" />
                )}
              </button>

              <button
                onClick={onOpenSettings}
                className="p-1.5 rounded-md hover:bg-neutral-200 dark:hover:bg-neutral-800 text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors"
                title="Sozlamalar"
              >
                <Settings className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};
