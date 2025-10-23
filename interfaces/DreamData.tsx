// Définition du type pour un rêve
import { Hashtag } from './Hashtag';
export interface DreamData {
  dreamText: string;
  isLucidDream: boolean;
  isNightmare: boolean;
  isNormalDream: boolean;
  todayDate: Date;
  hashtag1: Hashtag;
  hashtag2: Hashtag;
  hashtag3: Hashtag;
}

