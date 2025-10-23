// Définition du type pour un rêve
import { Hashtag } from "./Hashtag";

export interface DreamData {
  dreamText: string;
  isLucidDream: boolean;
  hashtag1: Hashtag;
  hashtag2: Hashtag;
  hashtag3: Hashtag;
  characters: string[];
  location: string;
  personalMeaning: string;
  emotionalIntensity: number;
  sleepQuality: number;
  sleepDate: string;
}
