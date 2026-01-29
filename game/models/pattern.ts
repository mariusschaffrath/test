// src/app/game/models/pattern.ts

export type Difficulty = 'EASY' | 'MEDIUM' | 'HARD';
export type RouteType = 'LOW' | 'MID' | 'TOP';

// 1. Hier definieren wir die Typen, die der Compiler vermisst hat:
export type SocketType = 'HAZARD' | 'ITEM';
export type HazardType = 'cord' | 'faultySensor';

import { ItemType } from './item';

export interface PlatformDef {
  xOffset: number; 
  yOffset: number; 
  width: number;
  route?: RouteType; 
  probability?: number;  // für zufällige Filler-Platformen
}

// VERALTET (Kannst du drin lassen für Rückwärtskompatibilität, 
// aber wir nutzen jetzt Sockets)
export interface HazardDef {
  xOffset: number;
  yOffset: number;
  type?: HazardType; 
}

// 2. Das fehlende Interface für den Socket
export interface SocketDef {
  xOffset: number;
  yOffset: number;
  type: SocketType;
  
  // Wir erlauben hier beides, damit der Compiler beim "Casten" nicht meckert
  subtype?: HazardType | ItemType; 
  
  probability?: number; // 0.0 bis 1.0
  reqDifficulty?: Difficulty; 
}

export interface LevelPattern {
  id: string;          
  name?: string;        
  difficulty: Difficulty;
  totalWidth: number;  
  platforms: PlatformDef[];
  
  // 3. WICHTIG: Das Feld 'sockets' hat im Interface gefehlt!
  sockets?: SocketDef[]; 

  hazards?: HazardDef[]; // Legacy Support
  tags?: string[]; 
}