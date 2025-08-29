// Sistema de armazenamento local seguro - COPPA compliant (zero dados pessoais)

import { UserCreation, ParentalSettings, ColoringImage, SessionData, OfflineData } from '@/types';
import { SecurityManager } from './security';

// Chaves para localStorage (sem dados pessoais)
const STORAGE_KEYS = {
  USER_CREATIONS: 'cc_creations',
  PARENTAL_SETTINGS: 'cc_parental',
  SESSION_DATA: 'cc_session',
  OFFLINE_IMAGES: 'cc_images',
  APP_SETTINGS: 'cc_settings',
  ACHIEVEMENTS: 'cc_achievements',
  ANONYMOUS_ID: 'cc_anon_id'
} as const;

export class SecureStorage {
  // Verificar se localStorage está disponível
  private static isAvailable(): boolean {
    try {
      const test = '__storage_test__';
      localStorage.setItem(test, test);
      localStorage.removeItem(test);
      return true;
    } catch {
      return false;
    }
  }

  // Salvar dados com validação de segurança
  private static setItem(key: string, value: any): boolean {
    if (!this.isAvailable()) return false;

    try {
      // Validar que não há dados pessoais
      if (!SecurityManager.validateDataCollection(value)) {
        console.error('Tentativa de armazenar dados pessoais bloqueada');
        return false;
      }

      const serialized = JSON.stringify(value);
      localStorage.setItem(key, serialized);
      return true;
    } catch (error) {
      console.error('Erro ao salvar no localStorage:', error);
      return false;
    }
  }

  // Versão silenciosa para tentativas internas (evita poluir o console durante estratégia de limpeza)
  private static setItemSilent(key: string, value: any): boolean {
    if (!this.isAvailable()) return false;
    try {
      if (!SecurityManager.validateDataCollection(value)) {
        return false;
      }
      const serialized = JSON.stringify(value);
      localStorage.setItem(key, serialized);
      return true;
    } catch {
      return false;
    }
  }

  // Recuperar dados com validação
  private static getItem<T>(key: string, defaultValue: T): T {
    if (!this.isAvailable()) return defaultValue;

    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
      console.error('Erro ao ler do localStorage:', error);
      return defaultValue;
    }
  }

  // Remover item específico
  private static removeItem(key: string): void {
    if (SecureStorage.isAvailable()) {
      localStorage.removeItem(key);
    }
  }

  // === CRIAÇÕES DO USUÁRIO ===
  static saveUserCreation(creation: UserCreation): boolean {
    const creations = SecureStorage.getUserCreations();
    const existingIndex = creations.findIndex(c => c.id === creation.id);
    
    if (existingIndex >= 0) {
      creations[existingIndex] = creation;
    } else {
      creations.push(creation);
    }

    return SecureStorage.setItem(STORAGE_KEYS.USER_CREATIONS, creations);
  }

  static getUserCreations(): UserCreation[] {
    return SecureStorage.getItem(STORAGE_KEYS.USER_CREATIONS, []);
  }

  static deleteUserCreation(creationId: string): boolean {
    const creations = SecureStorage.getUserCreations();
    const filtered = creations.filter(c => c.id !== creationId);
    return SecureStorage.setItem(STORAGE_KEYS.USER_CREATIONS, filtered);
  }

  static getUserCreation(creationId: string): UserCreation | null {
    const creations = SecureStorage.getUserCreations();
    return creations.find(c => c.id === creationId) || null;
  }

  // === CONFIGURAÇÕES PARENTAIS ===
  static saveParentalSettings(settings: ParentalSettings): boolean {
    return SecureStorage.setItem(STORAGE_KEYS.PARENTAL_SETTINGS, settings);
  }

  static getParentalSettings(): ParentalSettings {
    return SecureStorage.getItem(STORAGE_KEYS.PARENTAL_SETTINGS, {
      maxSessionTime: 30, // 30 minutos padrão
      allowAIGeneration: false, // Desabilitado por padrão
      selectedDifficulty: ['easy'],
      selectedCategories: ['animals', 'nature', 'shapes'],
      soundEnabled: true,
      vibrationEnabled: false,
      ageGroup: '2-4'
    });
  }

  // === DADOS DE SESSÃO ===
  static saveSessionData(session: SessionData): boolean {
    return SecureStorage.setItem(STORAGE_KEYS.SESSION_DATA, session);
  }

  static getSessionData(): SessionData {
    return SecureStorage.getItem(STORAGE_KEYS.SESSION_DATA, {
      startTime: new Date(),
      totalTime: 0,
      imagesColored: 0,
      achievementsUnlocked: []
    });
  }

  static clearSessionData(): void {
    SecureStorage.removeItem(STORAGE_KEYS.SESSION_DATA);
  }

  // === IMAGENS OFFLINE ===
  private static readonly MAX_OFFLINE_IMAGES = 20;
  static saveOfflineImages(images: ColoringImage[]): boolean {
    return SecureStorage.setItem(STORAGE_KEYS.OFFLINE_IMAGES, images);
  }

  static getOfflineImages(): ColoringImage[] {
    return SecureStorage.getItem(STORAGE_KEYS.OFFLINE_IMAGES, []);
  }

  static addOfflineImage(image: ColoringImage): boolean {
    // Normalizar datas
    if (!image.createdAt) image.createdAt = new Date();

    let images = SecureStorage.getOfflineImages();
    if (!images.find(img => img.id === image.id)) {
      images.push(image);
    }

    // Ordenar por mais novo primeiro e respeitar limite máximo
    images = images
      .sort((a: any, b: any) => new Date(b.createdAt as any).getTime() - new Date(a.createdAt as any).getTime())
      .slice(0, SecureStorage.MAX_OFFLINE_IMAGES);

    // Tentar salvar; se exceder a cota, evict mais antigos até caber
    const trySave = (arr: ColoringImage[]) => SecureStorage.setItemSilent(STORAGE_KEYS.OFFLINE_IMAGES, arr);
    if (trySave(images)) return true;

    // Ordenar por createdAt asc (mais antigos primeiro)
    images = images.sort((a: any, b: any) => new Date(a.createdAt as any).getTime() - new Date(b.createdAt as any).getTime());
    while (images.length > 0 && !trySave(images)) {
      images.shift(); // remover o mais antigo
    }
    return images.length > 0;
  }

  static clearOfflineImages(): void {
    SecureStorage.removeItem(STORAGE_KEYS.OFFLINE_IMAGES);
  }

  // === ID ANÔNIMO ===
  static getAnonymousId(): string {
    let id = SecureStorage.getItem(STORAGE_KEYS.ANONYMOUS_ID, '');
    if (!id) {
      id = SecurityManager.generateAnonymousId();
      SecureStorage.setItem(STORAGE_KEYS.ANONYMOUS_ID, id);
    }
    return id;
  }

  // === CONFIGURAÇÕES DO APP ===
  static saveAppSettings(settings: any): boolean {
    return SecureStorage.setItem(STORAGE_KEYS.APP_SETTINGS, settings);
  }

  static getAppSettings(): any {
    return SecureStorage.getItem(STORAGE_KEYS.APP_SETTINGS, {
      theme: 'light',
      language: 'pt-BR',
      animations: true,
      sounds: true
    });
  }

  // === CONQUISTAS ===
  static saveAchievements(achievements: string[]): boolean {
    return SecureStorage.setItem(STORAGE_KEYS.ACHIEVEMENTS, achievements);
  }

  static getAchievements(): string[] {
    return SecureStorage.getItem(STORAGE_KEYS.ACHIEVEMENTS, []);
  }

  static addAchievement(achievementId: string): boolean {
    const achievements = SecureStorage.getAchievements();
    if (!achievements.includes(achievementId)) {
      achievements.push(achievementId);
      return SecureStorage.setItem(STORAGE_KEYS.ACHIEVEMENTS, achievements);
    }
    return true;
  }

  // === UTILITÁRIOS ===
  
  // Exportar todos os dados do usuário (para backup)
  static exportUserData(): OfflineData {
    return {
      images: SecureStorage.getOfflineImages(),
      userCreations: SecureStorage.getUserCreations(),
      settings: SecureStorage.getParentalSettings(),
      lastSync: new Date()
    };
  }

  // Importar dados do usuário (de backup)
  static importUserData(data: OfflineData): boolean {
    try {
      // Validar dados antes de importar
      if (!SecurityManager.validateDataCollection(data)) {
        return false;
      }

      SecureStorage.setItem(STORAGE_KEYS.OFFLINE_IMAGES, data.images);
      SecureStorage.setItem(STORAGE_KEYS.USER_CREATIONS, data.userCreations);
      SecureStorage.setItem(STORAGE_KEYS.PARENTAL_SETTINGS, data.settings);
      
      return true;
    } catch (error) {
      console.error('Erro ao importar dados:', error);
      return false;
    }
  }

  // Limpar todos os dados (reset completo)
  static clearAllData(): void {
    Object.values(STORAGE_KEYS).forEach(key => {
      SecureStorage.removeItem(key);
    });
  }

  // Verificar uso de armazenamento
  static getStorageUsage(): { used: number; available: number; percentage: number } {
    if (!SecureStorage.isAvailable()) {
      return { used: 0, available: 0, percentage: 0 };
    }

    try {
      let used = 0;
      for (let key in localStorage) {
        if (localStorage.hasOwnProperty(key)) {
          used += localStorage[key].length + key.length;
        }
      }

      // Estimar limite do localStorage (geralmente 5-10MB)
      const available = 5 * 1024 * 1024; // 5MB
      const percentage = (used / available) * 100;

      return { used, available, percentage };
    } catch {
      return { used: 0, available: 0, percentage: 0 };
    }
  }

  // Limpar dados antigos automaticamente
  static cleanupOldData(daysOld: number = 30): void {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    // Limpar criações antigas não finalizadas
    const creations = SecureStorage.getUserCreations();
    const recentCreations = creations.filter(creation => {
      const creationDate = new Date(creation.createdAt);
      return creationDate > cutoffDate || creation.isCompleted;
    });

    if (recentCreations.length !== creations.length) {
      SecureStorage.setItem(STORAGE_KEYS.USER_CREATIONS, recentCreations);
    }
  }
}

// Hook para usar armazenamento seguro
export function useSecureStorage() {
  return {
    // Criações
    saveCreation: SecureStorage.saveUserCreation,
    getCreations: SecureStorage.getUserCreations,
    deleteCreation: SecureStorage.deleteUserCreation,
    getCreation: SecureStorage.getUserCreation,

    // Configurações parentais
    saveParentalSettings: SecureStorage.saveParentalSettings,
    getParentalSettings: SecureStorage.getParentalSettings,

    // Sessão
    saveSession: SecureStorage.saveSessionData,
    getSession: SecureStorage.getSessionData,
    clearSession: SecureStorage.clearSessionData,

    // Offline
    saveOfflineImages: SecureStorage.saveOfflineImages,
    getOfflineImages: SecureStorage.getOfflineImages,
    addOfflineImage: SecureStorage.addOfflineImage,
    clearOfflineImages: SecureStorage.clearOfflineImages,

    // Conquistas
    saveAchievements: SecureStorage.saveAchievements,
    getAchievements: SecureStorage.getAchievements,
    addAchievement: SecureStorage.addAchievement,

    // Configurações do app
    saveAppSettings: SecureStorage.saveAppSettings,
    getAppSettings: SecureStorage.getAppSettings,

    // Utilitários
    exportData: SecureStorage.exportUserData,
    importData: SecureStorage.importUserData,
    clearAll: SecureStorage.clearAllData,
    getUsage: SecureStorage.getStorageUsage,
    cleanup: SecureStorage.cleanupOldData,

    // ID anônimo
    getAnonymousId: SecureStorage.getAnonymousId
  };
}
