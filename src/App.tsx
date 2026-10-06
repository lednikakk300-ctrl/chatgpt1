import React, { useState, useEffect, useRef } from 'react';
import { Sidebar } from './components/Sidebar';
import { ChatHeader } from './components/ChatHeader';
import { WelcomeScreen } from './components/WelcomeScreen';
import { ChatMessage } from './components/ChatMessage';
import { ChatInput } from './components/ChatInput';
import { VoiceModeModal } from './components/VoiceModeModal';
import { SettingsModal } from './components/SettingsModal';
import { ChatSession, Message, AttachedFile, UserSettings } from './types';
import {
  loadSessionsFromStorage,
  saveSessionsToStorage,
  loadActiveSessionId,
  saveActiveSessionId,
  loadSettings,
  saveSettings,
} from './utils/storage';
import { DEFAULT_USER_SETTINGS, AVAILABLE_MODELS } from './utils/constants';
import { playAudioBase64, stopAudioPlayback, speakWithBrowser } from './utils/speech';

export default function App() {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [settings, setSettings] = useState<UserSettings>(DEFAULT_USER_SETTINGS);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isVoiceModeOpen, setIsVoiceModeOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Active chat state
  const [isGenerating, setIsGenerating] = useState(false);
  const [speakingMessageId, setSpeakingMessageId] = useState<string | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isLoadingAudio, setIsLoadingAudio] = useState(false);

  const abortControllerRef = useRef<AbortController | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initialize from LocalStorage
  useEffect(() => {
    const savedSessions = loadSessionsFromStorage();
    const savedActiveId = loadActiveSessionId();
    const savedSettings = loadSettings();

    setSessions(savedSessions);
    setSettings(savedSettings);

    if (savedActiveId && savedSessions.some((s) => s.id === savedActiveId)) {
      setActiveSessionId(savedActiveId);
    } else if (savedSessions.length > 0) {
      setActiveSessionId(savedSessions[0].id);
    }

    // Apply dark/light theme to document root
    if (savedSettings.theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  // Sync theme changes
  useEffect(() => {
    if (settings.theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    saveSettings(settings);
  }, [settings]);

  // Sync sessions to storage
  useEffect(() => {
    if (sessions.length > 0) {
      saveSessionsToStorage(sessions);
    }
  }, [sessions]);

  // Sync activeSessionId to storage
  useEffect(() => {
    saveActiveSessionId(activeSessionId);
  }, [activeSessionId]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [sessions, activeSessionId, isGenerating]);

  // Keyboard shortcut Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        handleCreateNewChat();
      }
      if (e.key === 'Escape') {
        setIsVoiceModeOpen(false);
        setIsSettingsOpen(false);
        setIsSidebarOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const activeSession = sessions.find((s) => s.id === activeSessionId) || null;
  const currentMessages = activeSession ? activeSession.messages : [];
  const currentModelId = activeSession ? activeSession.modelId : 'gpt-4o';

  // Create New Chat
  const handleCreateNewChat = () => {
    stopAudioPlayback();
    setSpeakingMessageId(null);
    setIsSpeaking(false);

    const newSession: ChatSession = {
      id: `session-${Date.now()}`,
      title: 'Yangi suhbat',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      messages: [],
      modelId: activeSession?.modelId || 'gpt-4o',
    };

    setSessions((prev) => [newSession, ...prev]);
    setActiveSessionId(newSession.id);
  };

  // Change model for current session
  const handleSelectModel = (modelId: string) => {
    if (!activeSessionId) {
      const newSession: ChatSession = {
        id: `session-${Date.now()}`,
        title: 'Yangi suhbat',
        createdAt: Date.now(),
        updatedAt: Date.now(),
        messages: [],
        modelId,
      };
      setSessions([newSession, ...sessions]);
      setActiveSessionId(newSession.id);
    } else {
      setSessions((prev) =>
        prev.map((s) => (s.id === activeSessionId ? { ...s, modelId } : s))
      );
    }
  };

  // Delete a session
  const handleDeleteSession = (id: string) => {
    const updated = sessions.filter((s) => s.id !== id);
    setSessions(updated);
    saveSessionsToStorage(updated);

    if (activeSessionId === id) {
      if (updated.length > 0) {
        setActiveSessionId(updated[0].id);
      } else {
        setActiveSessionId(null);
      }
    }
  };

  // Rename a session
  const handleRenameSession = (id: string, newTitle: string) => {
    setSessions((prev) =>
      prev.map((s) => (s.id === id ? { ...s, title: newTitle } : s))
    );
  };

  // Clear all sessions
  const handleClearAllSessions = () => {
    stopAudioPlayback();
    setSessions([]);
    setActiveSessionId(null);
    saveSessionsToStorage([]);
    saveActiveSessionId(null);
  };

  // Clear current active chat messages
  const handleClearCurrentChat = () => {
    if (!activeSessionId) return;
    stopAudioPlayback();
    setSessions((prev) =>
      prev.map((s) =>
        s.id === activeSessionId
          ? { ...s, messages: [], updatedAt: Date.now(), title: 'Yangi suhbat' }
          : s
      )
    );
  };

  // Stop Generation
  const handleStopGeneration = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsGenerating(false);
  };

  // Send Message Logic
  const handleSendMessage = async (
    text: string,
    files: AttachedFile[],
    options: { searchEnabled: boolean; reasoningMode: boolean }
  ) => {
    if (isGenerating) return;

    // Create session if none exists
    let targetSessionId = activeSessionId;
    let currentSessionList = sessions;

    if (!targetSessionId || !sessions.some((s) => s.id === targetSessionId)) {
      const newSession: ChatSession = {
        id: `session-${Date.now()}`,
        title: text.slice(0, 32) || 'Yangi suhbat',
        createdAt: Date.now(),
        updatedAt: Date.now(),
        messages: [],
        modelId: currentModelId,
      };
      targetSessionId = newSession.id;
      currentSessionList = [newSession, ...sessions];
      setSessions(currentSessionList);
      setActiveSessionId(newSession.id);
    }

    const userMessage: Message = {
      id: `msg-user-${Date.now()}`,
      role: 'user',
      text,
      files,
      timestamp: Date.now(),
    };

    const assistantMessageId = `msg-asst-${Date.now()}`;
    const assistantPlaceholder: Message = {
      id: assistantMessageId,
      role: 'assistant',
      text: '',
      timestamp: Date.now(),
      isStreaming: true,
    };

    // Update session title if it's the first message
    const sessionToUpdate = currentSessionList.find((s) => s.id === targetSessionId);
    const isFirstMessage = !sessionToUpdate || sessionToUpdate.messages.length === 0;
    const newTitle = isFirstMessage && text ? text.slice(0, 36) : sessionToUpdate?.title || 'Suhbat';

    const updatedMessages = [...(sessionToUpdate?.messages || []), userMessage, assistantPlaceholder];

    setSessions((prev) =>
      prev.map((s) =>
        s.id === targetSessionId
          ? {
              ...s,
              title: newTitle,
              messages: updatedMessages,
              updatedAt: Date.now(),
            }
          : s
      )
    );

    setIsGenerating(true);
    abortControllerRef.current = new AbortController();

    const startTime = Date.now();

    try {
      // Build conversation payload
      const conversationHistory = updatedMessages
        .slice(0, -1) // Exclude current empty assistant placeholder
        .map((m) => ({
          role: m.role,
          text: m.text,
          files: m.files?.map((f) => ({
            mimeType: f.mimeType,
            data: f.data,
          })),
        }));

      // Call streaming backend
      const response = await fetch('/api/chat?stream=true', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'text/event-stream',
        },
        body: JSON.stringify({
          messages: conversationHistory,
          systemInstruction: settings.systemInstruction || undefined,
          searchEnabled: options.searchEnabled,
          reasoningMode: options.reasoningMode || currentModelId === 'o1',
          model: 'gemini-3.8-flash',
        }),
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        throw new Error(`Server xatosi: ${response.statusText}`);
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let accumulatedText = '';

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split('\n');

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const data = JSON.parse(line.slice(6));
                if (data.text) {
                  accumulatedText += data.text;

                  // Update UI with stream chunk
                  setSessions((prev) =>
                    prev.map((s) =>
                      s.id === targetSessionId
                        ? {
                            ...s,
                            messages: s.messages.map((m) =>
                              m.id === assistantMessageId
                                ? { ...m, text: accumulatedText }
                                : m
                            ),
                          }
                        : s
                    )
                  );
                }
              } catch (e) {
                // Ignore parse errors on incomplete chunks
              }
            }
          }
        }
      }

      const reasoningTime = Math.round((Date.now() - startTime) / 1000);

      // Finalize streaming
      setSessions((prev) =>
        prev.map((s) =>
          s.id === targetSessionId
            ? {
                ...s,
                messages: s.messages.map((m) =>
                  m.id === assistantMessageId
                    ? {
                        ...m,
                        text: accumulatedText || "Javob berilmadi.",
                        isStreaming: false,
                        reasoningTime: options.reasoningMode ? reasoningTime : undefined,
                      }
                    : m
                ),
              }
            : s
        )
      );

      // If autoSpeak is on, automatically speak
      if (settings.autoSpeak && accumulatedText) {
        handleSpeak(accumulatedText, assistantMessageId);
      }
    } catch (err: any) {
      if (err.name === 'AbortError') {
        console.log('Stream aborted by user');
      } else {
        console.error('Chat API Error:', err);
        setSessions((prev) =>
          prev.map((s) =>
            s.id === targetSessionId
              ? {
                  ...s,
                  messages: s.messages.map((m) =>
                    m.id === assistantMessageId
                      ? {
                          ...m,
                          text: `⚠️ Kechirasiz, xatolik yuz berdi: ${
                            err.message || "Internet yoki server bilan aloqa uzildi."
                          }`,
                          isStreaming: false,
                        }
                      : m
                  ),
                }
              : s
          )
        );
      }
    } finally {
      setIsGenerating(false);
      abortControllerRef.current = null;
    }
  };

  // Text-To-Speech (Tinglash) Handler
  const handleSpeak = async (text: string, messageId: string) => {
    stopAudioPlayback();
    setSpeakingMessageId(messageId);
    setIsSpeaking(true);
    setIsLoadingAudio(true);

    try {
      const response = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text,
          voice: settings.voice || 'Kore',
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.audioBase64) {
          setIsLoadingAudio(false);
          playAudioBase64(data.audioBase64, data.mimeType || 'audio/wav', () => {
            setIsSpeaking(false);
            setSpeakingMessageId(null);
          });
          return;
        }
      }
    } catch (e) {
      console.warn("Server TTS failed, falling back to browser speech synthesis", e);
    }

    // Fallback: browser speech synthesis
    setIsLoadingAudio(false);
    speakWithBrowser(
      text,
      settings.speechLanguage || 'uz-UZ',
      settings.speechRate || 1.0,
      () => {
        setIsSpeaking(false);
        setSpeakingMessageId(null);
      }
    );
  };

  const handleStopSpeaking = () => {
    stopAudioPlayback();
    setIsSpeaking(false);
    setSpeakingMessageId(null);
    setIsLoadingAudio(false);
  };

  // Regenerate Response
  const handleRegenerate = (index: number) => {
    if (!activeSession) return;
    // Find preceding user message
    const userMsg = currentMessages[index - 1];
    if (userMsg && userMsg.role === 'user') {
      // Remove current assistant message and resend
      setSessions((prev) =>
        prev.map((s) =>
          s.id === activeSessionId
            ? { ...s, messages: s.messages.slice(0, index) }
            : s
        )
      );
      handleSendMessage(userMsg.text, userMsg.files || [], {
        searchEnabled: false,
        reasoningMode: currentModelId === 'o1',
      });
    }
  };

  // Edit User Message and Resend
  const handleEditUserMessage = (index: number, newText: string) => {
    if (!activeSession) return;
    const oldFiles = currentMessages[index]?.files || [];
    // Truncate to before this message
    setSessions((prev) =>
      prev.map((s) =>
        s.id === activeSessionId
          ? { ...s, messages: s.messages.slice(0, index) }
          : s
      )
    );
    handleSendMessage(newText, oldFiles, {
      searchEnabled: false,
      reasoningMode: currentModelId === 'o1',
    });
  };

  // Append voice mode messages into active session
  const handleVoiceMessagePair = (userText: string, aiText: string) => {
    let targetSessionId = activeSessionId;
    let sessionList = sessions;

    if (!targetSessionId) {
      const newSession: ChatSession = {
        id: `session-${Date.now()}`,
        title: userText.slice(0, 32) || "Ovozli muloqot",
        createdAt: Date.now(),
        updatedAt: Date.now(),
        messages: [],
        modelId: currentModelId,
      };
      targetSessionId = newSession.id;
      sessionList = [newSession, ...sessions];
      setSessions(sessionList);
      setActiveSessionId(newSession.id);
    }

    const uMsg: Message = {
      id: `msg-v-user-${Date.now()}`,
      role: 'user',
      text: userText,
      timestamp: Date.now(),
    };

    const aMsg: Message = {
      id: `msg-v-asst-${Date.now()}`,
      role: 'assistant',
      text: aiText,
      timestamp: Date.now(),
    };

    setSessions((prev) =>
      prev.map((s) =>
        s.id === targetSessionId
          ? {
              ...s,
              messages: [...s.messages, uMsg, aMsg],
              updatedAt: Date.now(),
            }
          : s
      )
    );
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-white dark:bg-[#212121] text-neutral-900 dark:text-neutral-100 font-sans">
      {/* Sidebar */}
      <Sidebar
        sessions={sessions}
        activeSessionId={activeSessionId}
        onSelectSession={(id) => {
          stopAudioPlayback();
          setActiveSessionId(id);
        }}
        onNewChat={handleCreateNewChat}
        onDeleteSession={handleDeleteSession}
        onRenameSession={handleRenameSession}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        settings={settings}
        onToggleTheme={() =>
          setSettings((prev) => ({
            ...prev,
            theme: prev.theme === 'dark' ? 'light' : 'dark',
          }))
        }
      />

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col h-full min-w-0 relative overflow-hidden bg-white dark:bg-[#212121]">
        {/* Header */}
        <ChatHeader
          onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
          selectedModelId={currentModelId}
          onSelectModel={handleSelectModel}
          onOpenVoiceMode={() => setIsVoiceModeOpen(true)}
          onClearChat={handleClearCurrentChat}
          hasMessages={currentMessages.length > 0}
          currentTitle={activeSession?.title}
        />

        {/* Message Container / Welcome Screen */}
        <div className="flex-1 overflow-y-auto flex flex-col relative">
          {currentMessages.length === 0 ? (
            <WelcomeScreen
              onSelectPrompt={(prompt) =>
                handleSendMessage(prompt, [], {
                  searchEnabled: false,
                  reasoningMode: currentModelId === 'o1',
                })
              }
              onOpenVoiceMode={() => setIsVoiceModeOpen(true)}
            />
          ) : (
            <div className="flex-1 py-4 divide-y divide-neutral-100 dark:divide-neutral-800/40">
              {currentMessages.map((msg, index) => (
                <ChatMessage
                  key={msg.id}
                  message={msg}
                  onRegenerate={
                    msg.role === 'assistant' ? () => handleRegenerate(index) : undefined
                  }
                  onEdit={
                    msg.role === 'user'
                      ? (newText) => handleEditUserMessage(index, newText)
                      : undefined
                  }
                  onSpeak={handleSpeak}
                  onStopSpeaking={handleStopSpeaking}
                  isSpeaking={isSpeaking}
                  speakingMessageId={speakingMessageId}
                  isLoadingAudio={isLoadingAudio}
                />
              ))}
              <div ref={messagesEndRef} className="h-6" />
            </div>
          )}
        </div>

        {/* Floating Input Pill */}
        <ChatInput
          onSendMessage={handleSendMessage}
          isGenerating={isGenerating}
          onStopGeneration={handleStopGeneration}
          speechLanguage={settings.speechLanguage}
        />
      </div>

      {/* Advanced Voice Mode Modal */}
      <VoiceModeModal
        isOpen={isVoiceModeOpen}
        onClose={() => setIsVoiceModeOpen(false)}
        onNewMessage={handleVoiceMessagePair}
        settings={settings}
      />

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onUpdateSettings={setSettings}
        onClearAllSessions={handleClearAllSessions}
        sessions={sessions}
      />
    </div>
  );
}
