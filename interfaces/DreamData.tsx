import { DreamHashtags } from './Hashtag';
// Définition du type pour un rêve
export interface DreamData {
  dreamText: string;
  isLucidDream: boolean;
  isNightmare: boolean;
  isNormalDream: boolean;
  hashtags?: DreamHashtags;
  todayDate: Date;
  };