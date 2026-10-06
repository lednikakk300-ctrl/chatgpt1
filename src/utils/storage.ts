import { ChatSession, UserSettings } from '../types';
import { DEFAULT_USER_SETTINGS } from './constants';

const STORAGE_KEYS = {
  SESSIONS: 'chatgpt_uz_sessions',
  ACTIVE_SESSION: 'chatgpt_uz_active_session_id',
  SETTINGS: 'chatgpt_uz_settings',
};

export const loadSessionsFromStorage = (): ChatSession[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SESSIONS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Failed to load sessions from storage:', e);
  }
  return [];
};

export const saveSessionsToStorage = (sessions: ChatSession[]): void => {
  try {
    localStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(sessions));
  } catch (e) {
    console.error('Failed to save sessions to storage:', e);
  }
};

export const loadActiveSessionId = (): string | null => {
  try {
    return localStorage.getItem(STORAGE_KEYS.ACTIVE_SESSION);
  } catch {
    return null;
  }
};

export const saveActiveSessionId = (id: string | null): void => {
  try {
    if (id) {
      localStorage.setItem(STORAGE_KEYS.ACTIVE_SESSION, id);
    } else {
      localStorage.removeItem(STORAGE_KEYS.ACTIVE_SESSION);
    }
  } catch (e) {
    console.error(e);
  }
};

export const loadSettings = (): UserSettings => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    if (raw) {
      return { ...DEFAULT_USER_SETTINGS, ...JSON.parse(raw) };
    }
  } catch (e) {
    console.error('Failed to load settings:', e);
  }
  return DEFAULT_USER_SETTINGS;
};

export const saveSettings = (settings: UserSettings): void => {
  try {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
  } catch (e) {
    console.error(e);
  }
};
