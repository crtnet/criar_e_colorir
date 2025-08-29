// Tipos principais do sistema de colorir

export interface ColoringImage {
  id: string;
  name: string;
  category: ImageCategory;
  difficulty: DifficultyLevel;
  imageUrl: string;
  thumbnailUrl: string;
  isAIGenerated: boolean;
  isApproved: boolean;
  createdAt: Date;
  tags: string[];
}

export interface UserCreation {
  id: string;
  imageId: string;
  canvasData: string; // Base64 do canvas
  createdAt: Date;
  lastModified: Date;
  isCompleted: boolean;
}

export interface ColorPalette {
  id: string;
  name: string;
  colors: string[];
  isDefault: boolean;
}

export interface DrawingTool {
  type: 'brush' | 'bucket' | 'eraser';
  size: number;
  color: string;
  opacity: number;
}

export interface ParentalSettings {
  maxSessionTime: number; // em minutos
  allowAIGeneration: boolean;
  selectedDifficulty: DifficultyLevel[];
  selectedCategories: ImageCategory[];
  soundEnabled: boolean;
  vibrationEnabled: boolean;
  ageGroup?: AgeGroup; // faixa etária da criança
}

export interface SessionData {
  startTime: Date;
  totalTime: number; // em minutos
  imagesColored: number;
  achievementsUnlocked: string[];
}

export type ImageCategory = 
  | 'animals'
  | 'nature'
  | 'shapes'
  | 'characters'
  | 'vehicles'
  | 'food'
  | 'toys'
  | 'fantasy';

export type DifficultyLevel = 'easy' | 'medium' | 'hard';

export type AgeGroup = '2-4' | '5-7' | '8-10' | '11-12';

// Tipos para compliance e segurança
export interface ContentFilter {
  bannedWords: string[];
  bannedPhrases: string[];
  allowedCategories: ImageCategory[];
  maxComplexity: number;
}

export interface AIPromptValidation {
  isValid: boolean;
  filteredPrompt: string;
  reasons: string[];
}

export interface ImageValidation {
  isApproved: boolean;
  confidence: number;
  flags: string[];
  category: ImageCategory;
  ageAppropriate: boolean;
}

// Tipos para controles parentais
export interface ParentalVerification {
  isVerified: boolean;
  verificationMethod: 'math' | 'text' | 'time';
  expiresAt: Date;
}

export interface UsageReport {
  date: Date;
  sessionDuration: number;
  imagesCreated: number;
  toolsUsed: string[];
  categoriesExplored: ImageCategory[];
}

// Tipos para PWA e offline
export interface OfflineData {
  images: ColoringImage[];
  userCreations: UserCreation[];
  settings: ParentalSettings;
  lastSync: Date;
}

export interface AppState {
  currentTool: DrawingTool;
  selectedColor: string;
  currentImage: ColoringImage | null;
  isDrawing: boolean;
  canUndo: boolean;
  canRedo: boolean;
  sessionActive: boolean;
  parentalLocked: boolean;
}

// Tipos para achievements e gamificação
export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  unlockedAt?: Date;
  category: 'creativity' | 'persistence' | 'exploration' | 'completion';
}

export interface ColoringStats {
  totalImagesColored: number;
  totalTimeSpent: number;
  favoriteColors: string[];
  favoriteCategories: ImageCategory[];
  streakDays: number;
  achievementsCount: number;
}
