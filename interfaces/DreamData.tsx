// interfaces/DreamData.tsx
import { DreamHashtags } from './Hashtag';

// [CHANGED] structure : ajout d'un id ; dates en string ISO
export interface DreamData {
  id: string; // [ADDED] identifiant stable pour édition/suppression
  dreamText: string;
  isLucidDream: boolean;
  isNightmare: boolean;
  isNormalDream: boolean;
  tone?: 'positive' | 'negative' | 'neutral' | null;
  clarity?: number;
  emotionBefore?: number;
  emotionAfter?: number;
  hashtags?: DreamHashtags;
  todayDate: string;     // [CHANGED] string ISO
  characters: string[];
  location: string;
  personalMeaning: string;
  emotionalIntensity: number;
  sleepQuality: number;
  sleepDate: string;     // [CHANGED] string ISO
}
