// Définition du type pour un rêve
import { Hashtag } from "./Hashtag";

export interface DreamData {
  dreamText: string;
  isLucidDream: boolean;
  hastag1: Hashtag;
  hastag2: Hashtag;
  hastag3: Hashtag;
  characters: string[];
  location: string;
  personalMeaning: string;
  emotionalIntensity: number;
  sleepQuality: number;
}
