export interface AttachedFile {
  id: string;
  name: string;
  mimeType: string;
  data: string; // Base64
  url?: string;
  size?: number;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  files?: AttachedFile[];
  timestamp: number;
  isStreaming?: boolean;
  feedback?: 'like' | 'dislike';
  reasoningTime?: number;
}

export interface ChatSession {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  messages: Message[];
  modelId: string;
}

export interface ModelOption {
  id: string;
  name: string;
  shortName: string;
  description: string;
  badge?: string;
  isReasoning?: boolean;
}

export interface UserSettings {
  theme: 'dark' | 'light';
  voice: 'Kore' | 'Puck' | 'Zephyr' | 'Fenrir' | 'Charon';
  speechRate: number;
  autoSpeak: boolean;
  speechLanguage: 'uz-UZ' | 'ru-RU' | 'en-US';
  systemInstruction: string;
}
