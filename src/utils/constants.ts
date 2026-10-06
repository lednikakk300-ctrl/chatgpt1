import { ModelOption, UserSettings } from '../types';

export const AVAILABLE_MODELS: ModelOption[] = [
  {
    id: 'gpt-4o',
    name: 'ChatGPT 4o',
    shortName: 'GPT-4o',
    description: "Eng ilg'or va keng qamrovli model. O'zbek tilida yuqori aniqlik, rasm tahlili va kodlash.",
    badge: 'Tavsiya',
  },
  {
    id: 'o1',
    name: 'o1 Reasoning',
    shortName: 'o1 Fikrlovchi',
    description: 'Murakkab mantiqiy savollar, fan, matematika va algoritmik tahlil uchun chuqur fikrlash rejimi.',
    badge: 'Chuqur tahlil',
    isReasoning: true,
  },
  {
    id: 'gpt-4o-mini',
    name: 'GPT-4o mini',
    shortName: '4o mini',
    description: 'Kundalik yozishmalar, tezkor savol-javob va tarjima uchun yengil va chaqqon model.',
    badge: 'Tezkor',
  },
];

export const DEFAULT_USER_SETTINGS: UserSettings = {
  theme: 'dark',
  voice: 'Kore',
  speechRate: 1.0,
  autoSpeak: false,
  speechLanguage: 'uz-UZ',
  systemInstruction: '',
};

export const SAMPLE_PROMPTS = [
  {
    icon: '📝',
    title: 'Insho va tahlil',
    desc: "Sun'iy intellektning ta'limdagi kelajagi",
    prompt: "Sun'iy intellektning zamonaviy ta'lim va fan sohasidagi ahamiyati haqida 5 banddan iborat reja va batafsil insho yozib ber.",
    category: 'Yozish',
  },
  {
    icon: '💻',
    title: 'Dasturlash',
    desc: 'TypeScript va React komponenti',
    prompt: "React va TypeScript-da qidiruv, saralash va filtrlash funksiyasiga ega bo'lgan toza va professional komponent kodi namunasini ko'rsat.",
    category: 'Kod',
  },
  {
    icon: '🚀',
    title: 'Biznes g\'oya',
    desc: "Startap yoki xizmat ko'rsatish rejasi",
    prompt: "O'zbekistonda yangi biznes boshlamoqchiman. Qaysi sohalar istiqbolli va qanday qadam-baqadam biznes reja tuzishim kerak?",
    category: 'Biznes',
  },
  {
    icon: '🇺🇿',
    title: 'Adabiyot va madaniyat',
    desc: "Alisher Navoiy ijodi haqida",
    prompt: "Alisher Navoiyning 'Xamsa' dostoni haqida ma'lumot ber: doston tarkibidagi asarlar, ularning asosiy g'oyalari va falsafiy ma'nosi nima?",
    category: 'Madaniyat',
  },
];
