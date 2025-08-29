// Sistema de segurança e compliance COPPA/GDPR

import { ContentFilter, AIPromptValidation, ImageValidation } from '@/types';

// Lista de palavras e frases proibidas (expandir conforme necessário)
const BANNED_WORDS = [
  'violence', 'violent', 'fight', 'gun', 'weapon', 'blood', 'death', 'kill',
  'scary', 'horror', 'monster', 'demon', 'devil', 'evil', 'dark', 'nightmare',
  'adult', 'mature', 'inappropriate', 'sexual', 'nude', 'naked',
  'drug', 'alcohol', 'cigarette', 'smoke', 'beer', 'wine',
  'hate', 'racism', 'discrimination', 'offensive', 'rude',
  'personal', 'name', 'address', 'phone', 'email', 'location',
  'violência', 'violento', 'luta', 'arma', 'sangue', 'morte', 'matar',
  'assustador', 'terror', 'monstro', 'demônio', 'diabo', 'mal', 'escuro', 'pesadelo',
  'adulto', 'maduro', 'inapropriado', 'sexual', 'nu', 'pelado',
  'droga', 'álcool', 'cigarro', 'fumar', 'cerveja', 'vinho',
  'ódio', 'racismo', 'discriminação', 'ofensivo', 'grosseiro',
  'pessoal', 'nome', 'endereço', 'telefone', 'email', 'localização'
];

const BANNED_PHRASES = [
  'personal information', 'contact details', 'real name', 'home address',
  'informações pessoais', 'dados de contato', 'nome real', 'endereço residencial'
];

// Palavras que devem ser automaticamente adicionadas aos prompts de IA
const SAFETY_KEYWORDS = [
  'child-friendly',
  'cartoon style',
  'coloring book',
  'simple outline',
  'black and white',
  'educational',
  'safe for children',
  'appropriate',
  'wholesome',
  'family-friendly'
];

export class SecurityManager {
  private static contentFilter: ContentFilter = {
    bannedWords: BANNED_WORDS,
    bannedPhrases: BANNED_PHRASES,
    allowedCategories: ['animals', 'nature', 'shapes', 'characters', 'vehicles', 'food', 'toys'],
    maxComplexity: 0.7
  };

  // Validação de prompts para IA
  static validateAIPrompt(prompt: string): AIPromptValidation {
    const lowerPrompt = prompt.toLowerCase().trim();
    const normalizedPrompt = SecurityManager.normalizeText(lowerPrompt);
    const reasons: string[] = [];

    // Verificar palavras proibidas
    for (const word of this.contentFilter.bannedWords) {
      const w = SecurityManager.normalizeText(word.toLowerCase());
      if (!w) continue;
      // Checar palavra inteira para evitar falsos positivos (ex: "mal" em "small")
      const pattern = new RegExp(`\\b${SecurityManager.escapeRegExp(w)}\\b`, 'i');
      if (pattern.test(normalizedPrompt)) {
        reasons.push(`Palavra proibida detectada: ${word}`);
      }
    }

    // Verificar frases proibidas
    for (const phrase of this.contentFilter.bannedPhrases) {
      const p = SecurityManager.normalizeText(phrase.toLowerCase());
      if (!p) continue;
      const pattern = new RegExp(`\\b${SecurityManager.escapeRegExp(p)}\\b`, 'i');
      if (pattern.test(normalizedPrompt)) {
        reasons.push(`Frase proibida detectada: ${phrase}`);
      }
    }

    // Verificar se o prompt é muito longo (possível tentativa de bypass)
    if (prompt.length > 200) {
      reasons.push('Prompt muito longo');
    }

    // Verificar caracteres especiais suspeitos
    const suspiciousChars = /[<>{}[\]\\|`~!@#$%^&*()+=]/g;
    if (suspiciousChars.test(prompt)) {
      reasons.push('Caracteres suspeitos detectados');
    }

    const isValid = reasons.length === 0;
    
    // Se válido, adicionar palavras de segurança
    let filteredPrompt = prompt;
    if (isValid) {
      filteredPrompt = this.enhancePromptSafety(prompt);
    }

    return {
      isValid,
      filteredPrompt,
      reasons
    };
  }

  // Normalizar texto removendo acentos/diacríticos
  private static normalizeText(text: string): string {
    return text
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  // Escapar regex
  private static escapeRegExp(text: string): string {
    return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  // Adicionar palavras de segurança ao prompt
  private static enhancePromptSafety(prompt: string): string {
    const safetyPrefix = SAFETY_KEYWORDS.slice(0, 3).join(', ');
    const safetySuffix = ', simple coloring page, appropriate for children ages 2-12';
    
    return `${safetyPrefix}, ${prompt}${safetySuffix}`;
  }

  // Validação de imagens geradas pela IA
  static async validateGeneratedImage(imageUrl: string): Promise<ImageValidation> {
    try {
      // Aqui seria implementada a validação real da imagem
      // Por enquanto, retornamos uma validação mock
      
      // Simular análise de conteúdo
      const mockAnalysis = {
        isApproved: true,
        confidence: 0.95,
        flags: [],
        category: 'animals' as const,
        ageAppropriate: true
      };

      return mockAnalysis;
    } catch (error) {
      console.error('Erro na validação de imagem:', error);
      return {
        isApproved: false,
        confidence: 0,
        flags: ['validation_error'],
        category: 'animals',
        ageAppropriate: false
      };
    }
  }

  // Verificar se dados pessoais estão sendo coletados (compliance COPPA)
  static validateDataCollection(data: any): boolean {
    // Verificar apenas chaves de primeiro nível para evitar falsos positivos
    const personalDataKeys = [
      'personalName', 'fullName', 'firstName', 'lastName',
      'email', 'emailAddress', 'phone', 'phoneNumber', 'telephone',
      'address', 'homeAddress', 'streetAddress', 
      'location', 'geoLocation', 'coordinates',
      'birthdate', 'birthday', 'dateOfBirth',
      'socialSecurity', 'ssn', 'creditCard', 'password'
    ];

    // Verificar apenas as chaves do objeto, não o conteúdo
    const keys = this.getAllKeys(data);
    
    for (const key of keys) {
      const lowerKey = key.toLowerCase();
      for (const personalKey of personalDataKeys) {
        if (lowerKey === personalKey.toLowerCase() || lowerKey.includes(personalKey.toLowerCase())) {
          console.warn(`Tentativa de coleta de dados pessoais detectada: ${key}`);
          return false;
        }
      }
    }

    return true;
  }

  // Obter todas as chaves de um objeto recursivamente
  private static getAllKeys(obj: any, prefix = ''): string[] {
    let keys: string[] = [];
    
    if (obj && typeof obj === 'object') {
      for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
          const fullKey = prefix ? `${prefix}.${key}` : key;
          keys.push(fullKey);
          
          if (typeof obj[key] === 'object' && obj[key] !== null) {
            keys = keys.concat(this.getAllKeys(obj[key], fullKey));
          }
        }
      }
    }
    
    return keys;
  }

  // Sanitizar entrada do usuário
  static sanitizeInput(input: string): string {
    return input
      .replace(/[<>]/g, '') // Remover tags HTML
      .replace(/javascript:/gi, '') // Remover JavaScript
      .replace(/on\w+=/gi, '') // Remover event handlers
      .trim()
      .substring(0, 100); // Limitar tamanho
  }

  // Verificar se o conteúdo é apropriado para a idade
  static isAgeAppropriate(content: string, ageGroup: string): boolean {
    const lowerContent = content.toLowerCase();
    
    // Verificações específicas por idade
    if (ageGroup === '2-4') {
      // Crianças muito pequenas - apenas formas simples e animais básicos
      const allowedTerms = ['circle', 'square', 'cat', 'dog', 'sun', 'flower'];
      return allowedTerms.some(term => lowerContent.includes(term));
    }

    // Para outras idades, usar validação padrão
    return !this.contentFilter.bannedWords.some(word => 
      lowerContent.includes(word.toLowerCase())
    );
  }

  // Gerar hash anônimo para tracking sem identificação
  static generateAnonymousId(): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2);
    return `anon_${timestamp}_${random}`;
  }

  // Verificar headers de segurança
  static validateSecurityHeaders(headers: Headers): boolean {
    const requiredHeaders = [
      'x-frame-options',
      'x-content-type-options',
      'referrer-policy'
    ];

    return requiredHeaders.every(header => headers.has(header));
  }
}

// Middleware para validação de segurança
export function securityMiddleware(req: Request): boolean {
  // Verificar origem
  const origin = req.headers.get('origin');
  if (origin && !isAllowedOrigin(origin)) {
    return false;
  }

  // Verificar user agent suspeito
  const userAgent = req.headers.get('user-agent') || '';
  if (isSuspiciousUserAgent(userAgent)) {
    return false;
  }

  return true;
}

function isAllowedOrigin(origin: string): boolean {
  const allowedOrigins = [
    'http://localhost:3000',
    'https://criar-e-colorir.vercel.app',
    // Adicionar outros domínios permitidos
  ];
  
  return allowedOrigins.includes(origin);
}

function isSuspiciousUserAgent(userAgent: string): boolean {
  const suspiciousPatterns = [
    /bot/i,
    /crawler/i,
    /spider/i,
    /scraper/i
  ];
  
  return suspiciousPatterns.some(pattern => pattern.test(userAgent));
}

// Utilitários para compliance
export const ComplianceUtils = {
  // Verificar se precisa de consentimento parental
  requiresParentalConsent: (feature: string): boolean => {
    const restrictedFeatures = ['ai_generation', 'export', 'advanced_tools'];
    return restrictedFeatures.includes(feature);
  },

  // Gerar política de privacidade simplificada
  generatePrivacyNotice: (): string => {
    return `
      Este aplicativo é seguro para crianças:
      • Não coletamos informações pessoais
      • Não usamos cookies de rastreamento
      • Não compartilhamos dados com terceiros
      • Todas as criações ficam no seu dispositivo
      • Pais podem controlar todas as funcionalidades
    `;
  },

  // Verificar conformidade COPPA
  isCOPPACompliant: (): boolean => {
    // Verificar se não há coleta de dados pessoais
    // Verificar se há controles parentais adequados
    // Verificar se o conteúdo é apropriado
    return true; // Implementar verificações reais
  }
};
