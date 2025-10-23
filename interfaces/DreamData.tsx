import { DreamHashtags } from './Hashtag';
// Définition du type pour un rêve
export interface DreamData {
  dreamText: string;
  isLucidDream: boolean;
  isNightmare: boolean;
  isNormalDream: boolean;
  tone?: 'positive' | 'negative' | 'neutral' | null;
  clarity?: number;
  emotionBefore?: number;
  emotionAfter?: number;
  hashtags?: DreamHashtags;
  todayDate: Date;
  characters: string[];
  location: string;
  personalMeaning: string;
  emotionalIntensity: number;
  sleepQuality: number;
  sleepDate: string;
  };
