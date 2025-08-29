// Sistema de integração com IA para geração segura de imagens para colorir

import { SecurityManager } from './security';
import { ColoringImage, ImageCategory, AIPromptValidation, ImageValidation, AgeGroup, DifficultyLevel } from '@/types';

// Configurações da API de IA
const AI_CONFIG = {
  // Usar variáveis de ambiente para chaves de API
  OPENAI_API_KEY: process.env.NEXT_PUBLIC_OPENAI_API_KEY,
  STABILITY_API_KEY: process.env.NEXT_PUBLIC_STABILITY_API_KEY,
  
  // Configurações de geração
  MAX_RETRIES: 3,
  TIMEOUT: 30000, // 30 segundos
  IMAGE_SIZE: '768x768',
  STYLE: 'coloring book outline',
  
  // Cache settings
  CACHE_DURATION: 24 * 60 * 60 * 1000, // 24 horas
  MAX_CACHE_SIZE: 50 // máximo de imagens em cache
};

// Prompts pré-definidos seguros por categoria (mais elaborados e agradáveis, inspirados no estilo Bobbie Goods)
const SAFE_PROMPTS: Record<ImageCategory, string[]> = {
  animals: [
    'whimsical kitten among daisies and tiny stars, big friendly face, sitting pose',
    'playful puppy with a bow, surrounded by hearts and bones, wagging tail',
    'happy elephant holding a flower, balloons around, simple cute patterns',
    'smiling lion with fluffy mane, sunny sky with clouds and sparkles',
    'butterfly over a garden, simple flowers below, small stars around',
    'friendly bear with honey pot, little bees with smiley faces around',
    'curious rabbit with carrot in a meadow, mushrooms and hearts nearby',
    'dolphin jumping over waves, bubbles and little stars in the sky'
  ],
  nature: [
    'flower bouquet with simple petals, leaves and sparkles, soft curves',
    'cozy tree with round canopy, hanging hearts and tiny birds',
    'bright smiling sun, clouds and rainbow arcs, simple cute rays',
    'garden scene with big flowers, butterflies and small hearts',
    'mountain and lake with simple shapes, stars and crescent moon',
    'rainbow over hills, tiny flowers dotting the field, cheerful vibe',
    'potted plant with big leaves, patterned pot, sparkles around',
    'simple ocean wave with seashells and starfish, smiling faces'
  ],
  shapes: [
    'circle with playful patterns, stars and hearts arranged symmetrically',
    'square frame with scalloped border, dots and tiny stars inside',
    'triangle composition with simple stripes and hearts around',
    'five-point star with dotted patterns and sparkles around',
    'heart shape with ribbons and tiny flowers, simple symmetry',
    'diamond shape with checker pattern and little stars',
    'oval with wave patterns and dots, decorative border',
    'hexagon with concentric lines, hearts in corners, clean layout'
  ],
  characters: [
    'friendly robot with rounded shapes, heart antenna, stars and bolts',
    'cute fairy with tiny wings, magic sparkles and daisies around',
    'smiling prince with crown and cape, hearts and stars around',
    'kind princess with dress and flower wand, sparkles in the air',
    'happy wizard with hat and wand, stars and moons floating',
    'gentle knight with shield and banner, simple emblems',
    'cheerful astronaut with flag, planets and stars in background',
    'friendly pirate with treasure map, shells and stars around'
  ],
  vehicles: [
    'cute car with big wheels, smiling front, stars and road lines',
    'airplane with rounded windows, clouds and sparkles around',
    'sailboat with flag, simple waves and seagull shapes',
    'train with two cars, puffs of cloud smoke, stars above',
    'bicycle with basket of flowers, hearts and dots around',
    'van with windows and luggage on top, clouds and sparkles',
    'school bus with windows, road lines and small stars',
    'submarine with round windows, bubbles and tiny fish around'
  ],
  food: [
    'apple with leaf, tiny hearts and dots around, simple cute face',
    'banana with peel curls, stars and dots in the background',
    'ice cream cone with two scoops, sprinkles and hearts',
    'pizza slice with simple toppings, stars and lines around',
    'birthday cake with candles, confetti and sparkles',
    'sandwich with layers, little hearts and dots around',
    'cookie with chips, stars and tiny crumbs, happy face',
    'cupcake with frosting swirl, sprinkles and hearts'
  ],
  toys: [
    'teddy bear sitting with bow, hearts and stars around',
    'ball with simple panels, sparkles and motion lines',
    'kite with tail bows, clouds and dots, gentle wind lines',
    'doll with dress and ribbon, hearts and flowers around',
    'toy car with big wheels, stars and dashed road',
    'stacked building blocks with letters, dots and stars',
    'yo-yo with string loop, sparkles and motion lines',
    'spinning top with stripes, stars and dots around'
  ],
  fantasy: [
    'friendly dragon with wings, stars and tiny flames, cute face',
    'unicorn with rainbow mane, hearts and sparkles around',
    'castle with towers and flags, stars and clouds above',
    'magic wand with stars and ribbons, sparkles everywhere',
    'treasure chest with gems, stars and simple coins around',
    'flying carpet with patterns, clouds and stars, moon nearby',
    'crystal ball with sparkles, moons and stars around',
    'enchanted forest with simple trees, stars and fireflies'
  ]
};

export class AIImageGenerator {
  private static cache = new Map<string, { image: ColoringImage; timestamp: number }>();

  // Gerar imagem usando IA com validação de segurança
  static async generateImage(
    prompt: string,
    category: ImageCategory,
    useCustomPrompt: boolean = false,
    ageGroup: AgeGroup = '2-4'
  ): Promise<ColoringImage | null> {
    try {
      // Se não for prompt customizado, usar prompt pré-definido
      let finalPrompt = prompt;
      if (!useCustomPrompt) {
        finalPrompt = AIImageGenerator.getRandomSafePrompt(category, ageGroup);
      }

      // Validar prompt
      const validation = SecurityManager.validateAIPrompt(finalPrompt);
      if (!validation.isValid) {
        console.error('Prompt inválido:', validation.reasons);
        return AIImageGenerator.getFallbackImage(category);
      }

      // Verificar cache primeiro
      const cacheKey = AIImageGenerator.generateCacheKey(validation.filteredPrompt, category, ageGroup);
      const cached = AIImageGenerator.getFromCache(cacheKey);
      if (cached) {
        return cached;
      }

      // Gerar imagem
      const imageUrl = await AIImageGenerator.callAIAPI(validation.filteredPrompt, ageGroup);
      if (!imageUrl) {
        return AIImageGenerator.getFallbackImage(category);
      }

      // Validar imagem gerada
      const imageValidation = await SecurityManager.validateGeneratedImage(imageUrl);
      if (!imageValidation.isApproved) {
        console.error('Imagem rejeitada:', imageValidation.flags);
        return AIImageGenerator.getFallbackImage(category);
      }

      // Criar objeto de imagem
      const coloringImage: ColoringImage = {
        id: `ai_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name: AIImageGenerator.generateImageName(category, ageGroup),
        category,
        difficulty: AIImageGenerator.getDifficultyForAge(ageGroup),
        imageUrl,
        thumbnailUrl: imageUrl, // Por enquanto usar a mesma URL
        isAIGenerated: true,
        isApproved: imageValidation.isApproved,
        createdAt: new Date(),
        tags: AIImageGenerator.generateTags(category, finalPrompt, ageGroup)
      };

      // Salvar no cache
      AIImageGenerator.saveToCache(cacheKey, coloringImage);

      return coloringImage;

    } catch (error) {
      console.error('Erro ao gerar imagem:', error);
      return AIImageGenerator.getFallbackImage(category);
    }
  }

  // Chamar API da IA (OpenAI via rota server) com fallback para mock
  private static async callAIAPI(prompt: string, ageGroup: AgeGroup): Promise<string | null> {
    try {
      const res = await fetch('/api/ai/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, size: AI_CONFIG.IMAGE_SIZE })
      });

      if (res.ok) {
        const data = await res.json();
        if (data?.url) return data.url as string;
      } else {
        try {
          const err = await res.json();
          console.error('OpenAI API error:', err);
        } catch {
          console.error('OpenAI API error status:', res.status);
        }
      }

      // Fallback para mock
      const mockImageUrl = AIImageGenerator.generateMockSVG(prompt, ageGroup);
      return mockImageUrl;

    } catch (error) {
      console.error('Erro na chamada da API:', error);
      // Fallback final
      return AIImageGenerator.generateMockSVG(prompt, ageGroup);
    }
  }

  // Obter prompt seguro aleatório por categoria
  private static getRandomSafePrompt(category: ImageCategory, ageGroup: AgeGroup): string {
    const prompts = SAFE_PROMPTS[category] || SAFE_PROMPTS.animals;
    const randomPrompt = prompts[Math.floor(Math.random() * prompts.length)];
    const ageHints: Record<AgeGroup, string> = {
      '2-4': 'very simple, large shapes, minimal details',
      '5-7': 'simple, few details, bold outlines',
      '8-10': 'moderate details, slightly more complex outlines',
      '11-12': 'more details, slightly advanced patterns'
    };
    const styleHints = 'Bobbie Goods inspired, bold outlines, clean line art, cute shapes, coloring page';
    // Incluir tag explícita da categoria para forçar o mock a usar a categoria correta
    let built = `${randomPrompt}, ${ageHints[ageGroup]}, ${styleHints}, for ages ${ageGroup}, category:${category}`;
    if (built.length > 180) {
      const shortAge: Record<AgeGroup, string> = {
        '2-4': 'very simple shapes, thick outline',
        '5-7': 'simple shapes, bold outline',
        '8-10': 'moderate detail, clear outline',
        '11-12': 'detailed outline, clean patterns'
      };
      const shortStyle = 'Bobbie Goods inspired, bold outlines, clean line art';
      built = `${randomPrompt}, ${shortAge[ageGroup]}, ${shortStyle}, category:${category}`;
    }
    // Garantir que não ultrapasse 200 caracteres do validador
    return built.length > 200 ? built.slice(0, 200) : built;
  }

  // Gerar imagem de fallback quando IA falha
  private static getFallbackImage(category: ImageCategory): ColoringImage {
    const fallbackImages: Record<ImageCategory, ColoringImage> = {
      animals: {
        id: 'fallback_cat',
        name: 'Gatinho Fofo',
        category: 'animals',
        difficulty: 'easy',
        imageUrl: '/images/fallback/cat-outline.svg',
        thumbnailUrl: '/images/fallback/cat-outline.svg',
        isAIGenerated: false,
        isApproved: true,
        createdAt: new Date(),
        tags: ['gato', 'animal', 'fofo']
      },
      nature: {
        id: 'fallback_flower',
        name: 'Flor Simples',
        category: 'nature',
        difficulty: 'easy',
        imageUrl: '/images/fallback/flower-outline.svg',
        thumbnailUrl: '/images/fallback/flower-outline.svg',
        isAIGenerated: false,
        isApproved: true,
        createdAt: new Date(),
        tags: ['flor', 'natureza', 'simples']
      },
      shapes: {
        id: 'fallback_circle',
        name: 'Círculo Decorado',
        category: 'shapes',
        difficulty: 'easy',
        imageUrl: '/images/fallback/circle-outline.svg',
        thumbnailUrl: '/images/fallback/circle-outline.svg',
        isAIGenerated: false,
        isApproved: true,
        createdAt: new Date(),
        tags: ['círculo', 'forma', 'padrão']
      },
      characters: {
        id: 'fallback_robot',
        name: 'Robô Amigável',
        category: 'characters',
        difficulty: 'easy',
        imageUrl: '/images/fallback/robot-outline.svg',
        thumbnailUrl: '/images/fallback/robot-outline.svg',
        isAIGenerated: false,
        isApproved: true,
        createdAt: new Date(),
        tags: ['robô', 'personagem', 'amigável']
      },
      vehicles: {
        id: 'fallback_car',
        name: 'Carrinho Simples',
        category: 'vehicles',
        difficulty: 'easy',
        imageUrl: '/images/placeholder-coloring.svg',
        thumbnailUrl: '/images/placeholder-coloring.svg',
        isAIGenerated: false,
        isApproved: true,
        createdAt: new Date(),
        tags: ['carro', 'veículo', 'simples']
      },
      food: {
        id: 'fallback_apple',
        name: 'Maçã Deliciosa',
        category: 'food',
        difficulty: 'easy',
        imageUrl: '/images/fallback/apple-outline.svg',
        thumbnailUrl: '/images/fallback/apple-outline.svg',
        isAIGenerated: false,
        isApproved: true,
        createdAt: new Date(),
        tags: ['maçã', 'fruta', 'saudável']
      },
      toys: {
        id: 'fallback_teddy',
        name: 'Ursinho de Pelúcia',
        category: 'toys',
        difficulty: 'easy',
        imageUrl: '/images/fallback/teddy-outline.svg',
        thumbnailUrl: '/images/fallback/teddy-outline.svg',
        isAIGenerated: false,
        isApproved: true,
        createdAt: new Date(),
        tags: ['ursinho', 'brinquedo', 'pelúcia']
      },
      fantasy: {
        id: 'fallback_unicorn',
        name: 'Unicórnio Mágico',
        category: 'fantasy',
        difficulty: 'easy',
        imageUrl: '/images/fallback/unicorn-outline.svg',
        thumbnailUrl: '/images/fallback/unicorn-outline.svg',
        isAIGenerated: false,
        isApproved: true,
        createdAt: new Date(),
        tags: ['unicórnio', 'fantasia', 'mágico']
      }
    };

    return fallbackImages[category] || fallbackImages.animals;
  }

  // Gerar nome para imagem baseado na categoria
  private static generateImageName(category: ImageCategory, ageGroup: AgeGroup): string {
    const names: Record<ImageCategory, string[]> = {
      animals: ['Animalzinho Fofo', 'Bichinho Amigável', 'Criatura Adorável'],
      nature: ['Natureza Bela', 'Paisagem Simples', 'Elemento Natural'],
      shapes: ['Forma Divertida', 'Padrão Legal', 'Desenho Geométrico'],
      characters: ['Personagem Amigável', 'Herói Corajoso', 'Amigo Especial'],
      vehicles: ['Veículo Legal', 'Transporte Divertido', 'Máquina Incrível'],
      food: ['Comida Gostosa', 'Lanche Saudável', 'Delícia Especial'],
      toys: ['Brinquedo Divertido', 'Diversão Garantida', 'Companheiro de Brincadeira'],
      fantasy: ['Criatura Mágica', 'Mundo Encantado', 'Fantasia Especial']
    };

    const categoryNames = names[category] || names.animals;
    const base = categoryNames[Math.floor(Math.random() * categoryNames.length)];
    return `${base} (${ageGroup})`;
  }

  // Dificuldade baseada na faixa etária
  private static getDifficultyForAge(ageGroup: AgeGroup): DifficultyLevel {
    switch (ageGroup) {
      case '2-4':
      case '5-7':
        return 'easy';
      case '8-10':
        return 'medium';
      case '11-12':
        return 'hard';
      default:
        return 'easy';
    }
  }

  // Gerar tags para imagem
  private static generateTags(category: ImageCategory, prompt: string, ageGroup: AgeGroup): string[] {
    const baseTags = [category, 'colorir', 'criança', 'seguro', `idade:${ageGroup}`];
    const promptWords = prompt.toLowerCase().split(' ').filter(word => word.length > 2);
    return [...baseTags, ...promptWords.slice(0, 3)];
  }

  // Gerar SVG mock baseado no prompt e categoria
  private static generateMockSVG(prompt: string, ageGroup: AgeGroup): string {
    // Em vez de detectar por prompt, aceitar categoria embutida no prompt como tag `category:xxx`
    // e cair para detecção apenas se não houver tag.
    const categoryMatch = prompt.toLowerCase().match(/category:(animals|nature|shapes|characters|vehicles|food|toys|fantasy)/);
    const category = (categoryMatch ? categoryMatch[1] : AIImageGenerator.detectCategoryFromPrompt(prompt)) as ImageCategory;
    
    let mainShape = '';
    let decorations: string[] = [];

    switch (category) {
      case 'animals':
        // Gerar diferentes animais
        const animals = [
          // Gato
          `<circle cx="200" cy="180" r="60" fill="none" stroke="#000" stroke-width="3"/>
           <path d="M160 130 L170 110 L180 130 Z" fill="none" stroke="#000" stroke-width="3"/>
           <path d="M220 130 L230 110 L240 130 Z" fill="none" stroke="#000" stroke-width="3"/>
           <circle cx="185" cy="170" r="4" fill="#000"/>
           <circle cx="215" cy="170" r="4" fill="#000"/>
           <ellipse cx="200" cy="280" rx="70" ry="40" fill="none" stroke="#000" stroke-width="3"/>`,
          
          // Cachorro
          `<ellipse cx="200" cy="180" rx="50" ry="40" fill="none" stroke="#000" stroke-width="3"/>
           <ellipse cx="170" cy="160" rx="15" ry="25" fill="none" stroke="#000" stroke-width="3"/>
           <ellipse cx="230" cy="160" rx="15" ry="25" fill="none" stroke="#000" stroke-width="3"/>
           <circle cx="185" cy="175" r="3" fill="#000"/>
           <circle cx="215" cy="175" r="3" fill="#000"/>
           <ellipse cx="200" cy="280" rx="60" ry="35" fill="none" stroke="#000" stroke-width="3"/>`,
          
          // Pássaro
          `<ellipse cx="200" cy="200" rx="50" ry="35" fill="none" stroke="#000" stroke-width="3"/>
           <circle cx="200" cy="160" r="30" fill="none" stroke="#000" stroke-width="3"/>
           <path d="M150 200 Q120 180 130 160" fill="none" stroke="#000" stroke-width="3"/>
           <path d="M250 200 Q280 180 270 160" fill="none" stroke="#000" stroke-width="3"/>
           <circle cx="190" cy="155" r="2" fill="#000"/>
           <path d="M205 160 L215 165 L205 170" fill="none" stroke="#000" stroke-width="2"/>`
        ];
        mainShape = animals[Math.floor(Math.random() * animals.length)];
        break;

      case 'nature':
        const nature = [
          // Flor
          `<circle cx="200" cy="200" r="20" fill="none" stroke="#000" stroke-width="3"/>
           <ellipse cx="200" cy="150" rx="15" ry="30" fill="none" stroke="#000" stroke-width="3"/>
           <ellipse cx="200" cy="250" rx="15" ry="30" fill="none" stroke="#000" stroke-width="3"/>
           <ellipse cx="150" cy="200" rx="30" ry="15" fill="none" stroke="#000" stroke-width="3"/>
           <ellipse cx="250" cy="200" rx="30" ry="15" fill="none" stroke="#000" stroke-width="3"/>
           <line x1="200" y1="220" x2="200" y2="320" stroke="#000" stroke-width="4"/>`,
          
          // Árvore
          `<ellipse cx="200" cy="150" rx="60" ry="80" fill="none" stroke="#000" stroke-width="3"/>
           <rect x="190" y="230" width="20" height="80" fill="none" stroke="#000" stroke-width="3"/>
           <ellipse cx="160" cy="180" rx="30" ry="40" fill="none" stroke="#000" stroke-width="2"/>
           <ellipse cx="240" cy="180" rx="30" ry="40" fill="none" stroke="#000" stroke-width="2"/>`,
          
          // Sol
          `<circle cx="200" cy="200" r="50" fill="none" stroke="#000" stroke-width="3"/>
           <line x1="200" y1="100" x2="200" y2="120" stroke="#000" stroke-width="3"/>
           <line x1="200" y1="280" x2="200" y2="300" stroke="#000" stroke-width="3"/>
           <line x1="100" y1="200" x2="120" y2="200" stroke="#000" stroke-width="3"/>
           <line x1="280" y1="200" x2="300" y2="200" stroke="#000" stroke-width="3"/>
           <line x1="141" y1="141" x2="155" y2="155" stroke="#000" stroke-width="3"/>
           <line x1="259" y1="259" x2="245" y2="245" stroke="#000" stroke-width="3"/>
           <line x1="259" y1="141" x2="245" y2="155" stroke="#000" stroke-width="3"/>
           <line x1="141" y1="259" x2="155" y2="245" stroke="#000" stroke-width="3"/>`
        ];
        mainShape = nature[Math.floor(Math.random() * nature.length)];
        break;

      case 'vehicles':
        const vehicles = [
          // Carro
          `<rect x="120" y="220" width="160" height="60" rx="10" fill="none" stroke="#000" stroke-width="3"/>
           <rect x="140" y="180" width="120" height="40" rx="5" fill="none" stroke="#000" stroke-width="3"/>
           <circle cx="160" cy="290" r="20" fill="none" stroke="#000" stroke-width="3"/>
           <circle cx="240" cy="290" r="20" fill="none" stroke="#000" stroke-width="3"/>
           <rect x="150" y="190" width="30" height="25" fill="none" stroke="#000" stroke-width="2"/>
           <rect x="220" y="190" width="30" height="25" fill="none" stroke="#000" stroke-width="2"/>`,
          
          // Avião
          `<ellipse cx="200" cy="200" rx="80" ry="20" fill="none" stroke="#000" stroke-width="3"/>
           <ellipse cx="120" cy="200" rx="40" ry="8" fill="none" stroke="#000" stroke-width="3"/>
           <ellipse cx="280" cy="200" rx="40" ry="8" fill="none" stroke="#000" stroke-width="3"/>
           <path d="M200 180 L200 150 L220 160 Z" fill="none" stroke="#000" stroke-width="3"/>
           <circle cx="180" cy="195" r="8" fill="none" stroke="#000" stroke-width="2"/>
           <circle cx="200" cy="195" r="8" fill="none" stroke="#000" stroke-width="2"/>
           <circle cx="220" cy="195" r="8" fill="none" stroke="#000" stroke-width="2"/>`,
          
          // Barco
          `<path d="M120 250 L280 250 L260 280 L140 280 Z" fill="none" stroke="#000" stroke-width="3"/>
           <line x1="200" y1="250" x2="200" y2="150" stroke="#000" stroke-width="4"/>
           <path d="M200 150 L160 180 L200 200 L240 180 Z" fill="none" stroke="#000" stroke-width="3"/>`
        ];
        mainShape = vehicles[Math.floor(Math.random() * vehicles.length)];
        break;

      case 'food':
        const food = [
          // Maçã em prato decorado
          `<ellipse cx="200" cy="310" rx="110" ry="18" fill="none" stroke="#000" stroke-width="3"/>
           <path d="M200 290 C150 290 120 245 120 200 C120 150 150 120 200 120 C250 120 280 150 280 200 C280 245 250 290 200 290 Z" fill="none" stroke="#000" stroke-width="3"/>
           <path d="M200 120 Q190 100 200 85 Q210 100 200 120" fill="none" stroke="#000" stroke-width="3"/>
           <ellipse cx="212" cy="108" rx="8" ry="15" fill="none" stroke="#000" stroke-width="2"/>`,
          
          // Bolo com base e decoração
          `<ellipse cx="200" cy="290" rx="120" ry="20" fill="none" stroke="#000" stroke-width="3"/>
           <rect x="120" y="210" width="160" height="80" rx="8" fill="none" stroke="#000" stroke-width="3"/>
           <ellipse cx="200" cy="210" rx="80" ry="18" fill="none" stroke="#000" stroke-width="3"/>
           <path d="M140 240 Q160 260 180 240 T220 240 T260 240" fill="none" stroke="#000" stroke-width="2"/>
           <line x1="170" y1="190" x2="170" y2="160" stroke="#000" stroke-width="3"/>
           <line x1="200" y1="190" x2="200" y2="160" stroke="#000" stroke-width="3"/>
           <line x1="230" y1="190" x2="230" y2="160" stroke="#000" stroke-width="3"/>`,
          
          // Sorvete triplo com detalhes
          `<path d="M180 310 L200 200 L220 310 Z" fill="none" stroke="#000" stroke-width="3"/>
           <circle cx="200" cy="185" r="25" fill="none" stroke="#000" stroke-width="3"/>
           <circle cx="185" cy="160" r="20" fill="none" stroke="#000" stroke-width="3"/>
           <circle cx="215" cy="160" r="20" fill="none" stroke="#000" stroke-width="3"/>
           <path d="M188 150 Q200 145 212 150" fill="none" stroke="#000" stroke-width="2"/>`
        ];
        mainShape = food[Math.floor(Math.random() * food.length)];
        break;

      case 'toys':
        const toys = [
          // Ursinho
          `<circle cx="200" cy="200" r="40" fill="none" stroke="#000" stroke-width="3"/>
           <circle cx="170" cy="170" r="15" fill="none" stroke="#000" stroke-width="3"/>
           <circle cx="230" cy="170" r="15" fill="none" stroke="#000" stroke-width="3"/>
           <circle cx="190" cy="190" r="3" fill="#000"/>
           <circle cx="210" cy="190" r="3" fill="#000"/>
           <path d="M195 205 Q200 210 205 205" fill="none" stroke="#000" stroke-width="2"/>
           <ellipse cx="200" cy="280" rx="50" ry="35" fill="none" stroke="#000" stroke-width="3"/>`,
          
          // Bola
          `<circle cx="200" cy="200" r="60" fill="none" stroke="#000" stroke-width="3"/>
           <path d="M140 200 Q200 150 260 200" fill="none" stroke="#000" stroke-width="2"/>
           <path d="M140 200 Q200 250 260 200" fill="none" stroke="#000" stroke-width="2"/>
           <path d="M200 140 Q150 200 200 260" fill="none" stroke="#000" stroke-width="2"/>
           <path d="M200 140 Q250 200 200 260" fill="none" stroke="#000" stroke-width="2"/>`,
          
          // Pipa
          `<path d="M200 120 L160 200 L200 280 L240 200 Z" fill="none" stroke="#000" stroke-width="3"/>
           <line x1="160" y1="200" x2="240" y2="200" stroke="#000" stroke-width="2"/>
           <line x1="200" y1="120" x2="200" y2="280" stroke="#000" stroke-width="2"/>
           <line x1="200" y1="280" x2="200" y2="340" stroke="#000" stroke-width="3"/>
           <circle cx="190" cy="320" r="5" fill="none" stroke="#000" stroke-width="2"/>
           <circle cx="210" cy="330" r="5" fill="none" stroke="#000" stroke-width="2"/>`
        ];
        mainShape = toys[Math.floor(Math.random() * toys.length)];
        break;

      case 'fantasy':
        const fantasy = [
          // Castelo
          `<rect x="140" y="200" width="120" height="100" fill="none" stroke="#000" stroke-width="3"/>
           <rect x="120" y="180" width="30" height="120" fill="none" stroke="#000" stroke-width="3"/>
           <rect x="250" y="180" width="30" height="120" fill="none" stroke="#000" stroke-width="3"/>
           <path d="M120 180 L125 160 L130 180 L135 160 L140 180" fill="none" stroke="#000" stroke-width="2"/>
           <path d="M250 180 L255 160 L260 180 L265 160 L270 180" fill="none" stroke="#000" stroke-width="2"/>
           <rect x="190" y="250" width="20" height="50" fill="none" stroke="#000" stroke-width="3"/>`,
          
          // Unicórnio
          `<ellipse cx="200" cy="220" rx="60" ry="40" fill="none" stroke="#000" stroke-width="3"/>
           <ellipse cx="160" cy="180" rx="30" ry="25" fill="none" stroke="#000" stroke-width="3"/>
           <path d="M160 155 L170 120 L180 155" fill="none" stroke="#000" stroke-width="3"/>
           <circle cx="150" cy="175" r="3" fill="#000"/>
           <path d="M130 170 Q120 160 125 150" fill="none" stroke="#000" stroke-width="2"/>
           <ellipse cx="180" cy="280" rx="12" ry="20" fill="none" stroke="#000" stroke-width="3"/>
           <ellipse cx="220" cy="280" rx="12" ry="20" fill="none" stroke="#000" stroke-width="3"/>`,
          
          // Varinha mágica
          `<line x1="150" y1="300" x2="250" y2="200" stroke="#000" stroke-width="4"/>
           <path d="M240 190 L260 200 L250 220 L240 210 Z" fill="none" stroke="#000" stroke-width="3"/>
           <circle cx="245" cy="185" r="3" fill="#000"/>
           <circle cx="255" cy="195" r="3" fill="#000"/>
           <circle cx="235" cy="205" r="3" fill="#000"/>
           <path d="M230 180 Q235 175 240 180" fill="none" stroke="#000" stroke-width="2"/>
           <path d="M260 210 Q265 205 270 210" fill="none" stroke="#000" stroke-width="2"/>`
        ];
        mainShape = fantasy[Math.floor(Math.random() * fantasy.length)];
        break;

      default: // shapes
        const shapes = [
          '<circle cx="200" cy="200" r="80" fill="none" stroke="#000" stroke-width="3"/>',
          '<rect x="120" y="120" width="160" height="160" fill="none" stroke="#000" stroke-width="3"/>',
          '<path d="M200 120 L280 280 L120 280 Z" fill="none" stroke="#000" stroke-width="3"/>',
          '<path d="M200 120 L220 180 L280 180 L235 220 L255 280 L200 245 L145 280 L165 220 L120 180 L180 180 Z" fill="none" stroke="#000" stroke-width="3"/>',
          '<path d="M200 280 C200 280 120 200 120 150 C120 120 140 100 170 100 C185 100 200 115 200 115 C200 115 215 100 230 100 C260 100 280 120 280 150 C280 200 200 280 200 280 Z" fill="none" stroke="#000" stroke-width="3"/>'
        ];
        mainShape = shapes[Math.floor(Math.random() * shapes.length)];
        break;
    }

    const strokeWidth = ageGroup === '2-4' ? 5 : ageGroup === '5-7' ? 4 : ageGroup === '8-10' ? 3 : 2;
    const tunedMainShape = mainShape.replace(/stroke-width="\d+"/g, `stroke-width="${strokeWidth}"`);

    const extraDecor = AIImageGenerator.generateDecorationsSVG(category, ageGroup, strokeWidth);
    const frame = ageGroup === '2-4' ? '<rect x="20" y="20" width="360" height="360" rx="20" fill="none" stroke="#000" stroke-width="2"/>' : '';

    const svg = `
      <svg width="768" height="768" viewBox="0 0 768 768" fill="none" xmlns="http://www.w3.org/2000/svg">
        <style>
          * { vector-effect: non-scaling-stroke; }
        </style>
        <rect width="768" height="768" fill="#ffffff"/>
        ${frame.replace(/(\d+)/g, (m) => String(Math.floor(Number(m) * 1.92)))}
        <g stroke="#000" fill="none" stroke-linecap="round" stroke-linejoin="round">
          ${tunedMainShape.replace(/(\d+\.?\d*)/g, (m) => String(Math.floor(Number(m) * 1.92)))}
          ${extraDecor.replace(/(\d+\.?\d*)/g, (m) => String(Math.floor(Number(m) * 1.92)))}
        </g>
      </svg>
    `;

    // Converter SVG para data URL
    const encodedSvg = encodeURIComponent(svg.trim());
    return `data:image/svg+xml,${encodedSvg}`;
  }

  // Detectar categoria baseada no prompt
  private static detectCategoryFromPrompt(prompt: string): ImageCategory {
    const lowerPrompt = prompt.toLowerCase();
    
    // Palavras-chave por categoria
    const categoryKeywords = {
      animals: ['cat', 'dog', 'animal', 'pet', 'bird', 'fish', 'gato', 'cachorro', 'animal', 'pássaro', 'peixe'],
      nature: ['flower', 'tree', 'sun', 'nature', 'plant', 'flor', 'árvore', 'sol', 'natureza', 'planta'],
      vehicles: ['car', 'plane', 'boat', 'vehicle', 'transport', 'carro', 'avião', 'barco', 'veículo', 'transporte'],
      food: ['apple', 'cake', 'food', 'fruit', 'ice cream', 'maçã', 'bolo', 'comida', 'fruta', 'sorvete'],
      toys: ['teddy', 'ball', 'toy', 'doll', 'kite', 'ursinho', 'bola', 'brinquedo', 'boneca', 'pipa'],
      fantasy: ['castle', 'unicorn', 'magic', 'fairy', 'dragon', 'castelo', 'unicórnio', 'mágico', 'fada', 'dragão'],
      characters: ['robot', 'princess', 'knight', 'character', 'robô', 'princesa', 'cavaleiro', 'personagem'],
      shapes: ['circle', 'square', 'triangle', 'shape', 'círculo', 'quadrado', 'triângulo', 'forma']
    };

    // Verificar qual categoria tem mais matches
    let bestCategory: ImageCategory = 'shapes';
    let maxMatches = 0;

    for (const [category, keywords] of Object.entries(categoryKeywords)) {
      const matches = keywords.filter(keyword => lowerPrompt.includes(keyword)).length;
      if (matches > maxMatches) {
        maxMatches = matches;
        bestCategory = category as ImageCategory;
      }
    }

    return bestCategory;
  }

  // Decorações SVG adicionais por categoria e idade para enriquecer o desenho
  private static generateDecorationsSVG(category: ImageCategory, ageGroup: AgeGroup, strokeWidth: number): string {
    const qty = ageGroup === '2-4' ? 4 : ageGroup === '5-7' ? 6 : ageGroup === '8-10' ? 8 : 10;
    const elements: string[] = [];
    const rand = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;

    const addStar = () => {
      const cx = rand(40, 360); const cy = rand(40, 360); const r = rand(6, 10);
      elements.push(`<path d="M${cx} ${cy - r} L${cx + r*0.588} ${cy + r*0.809} L${cx - r} ${cy - r*0.309} L${cx + r} ${cy - r*0.309} L${cx - r*0.588} ${cy + r*0.809} Z" stroke="#000" stroke-width="${Math.max(1, strokeWidth-1)}" fill="none"/>`);
    };
    const addHeart = () => {
      const x = rand(50, 340); const y = rand(50, 340); const s = rand(6, 10);
      elements.push(`<path d="M ${x} ${y} C ${x - s} ${y - s}, ${x - 2*s} ${y + s}, ${x} ${y + 2*s} C ${x + 2*s} ${y + s}, ${x + s} ${y - s}, ${x} ${y} Z" stroke="#000" stroke-width="${Math.max(1, strokeWidth-1)}" fill="none"/>`);
    };
    const addCloud = () => {
      const x = rand(60, 300); const y = rand(40, 120); const r = rand(8, 14);
      elements.push(`<circle cx="${x}" cy="${y}" r="${r}" stroke="#000" stroke-width="${Math.max(1, strokeWidth-1)}" fill="none"/>`);
      elements.push(`<circle cx="${x + r}" cy="${y}" r="${r+4}" stroke="#000" stroke-width="${Math.max(1, strokeWidth-1)}" fill="none"/>`);
      elements.push(`<circle cx="${x + 2*r}" cy="${y}" r="${r}" stroke="#000" stroke-width="${Math.max(1, strokeWidth-1)}" fill="none"/>`);
    };

    const addSparkle = () => {
      const x = rand(40, 360); const y = rand(40, 360); const s = rand(4, 8);
      elements.push(`<path d="M ${x} ${y - s} L ${x} ${y + s} M ${x - s} ${y} L ${x + s} ${y}" stroke="#000" stroke-width="${Math.max(1, strokeWidth-1)}"/>`);
    };

    const addTinyShape = () => {
      const x = rand(30, 370); const y = rand(30, 370); const s = rand(6, 12);
      elements.push(`<rect x="${x}" y="${y}" width="${s}" height="${s}" rx="2" stroke="#000" stroke-width="${Math.max(1, strokeWidth-1)}" fill="none"/>`);
    };

    const addByCategory = () => {
      switch (category) {
        case 'animals':
        case 'characters':
          return addHeart();
        case 'nature':
          return addCloud();
        case 'fantasy':
          return addSparkle();
        case 'vehicles':
          return addStar();
        case 'shapes':
        case 'toys':
        case 'food':
        default:
          return addTinyShape();
      }
    };

    for (let i = 0; i < qty; i++) {
      if (ageGroup === '2-4') {
        // Padrões mais simples
        if (i % 2 === 0) addStar(); else addCloud();
      } else if (ageGroup === '5-7') {
        if (i % 3 === 0) addHeart(); else addStar();
      } else if (ageGroup === '8-10') {
        addByCategory();
      } else {
        // 11-12: misturar mais
        [addByCategory, addStar, addHeart, addSparkle][i % 4]();
      }
    }
    return elements.join('\n');
  }

  // Gerenciar cache
  private static generateCacheKey(prompt: string, category: ImageCategory, ageGroup: AgeGroup): string {
    return `${category}_${ageGroup}_${prompt.replace(/\s+/g, '_').toLowerCase()}`;
  }

  private static getFromCache(key: string): ColoringImage | null {
    const cached = AIImageGenerator.cache.get(key);
    if (!cached) return null;

    // Verificar se não expirou
    const now = Date.now();
    if (now - cached.timestamp > AI_CONFIG.CACHE_DURATION) {
      AIImageGenerator.cache.delete(key);
      return null;
    }

    return cached.image;
  }

  private static saveToCache(key: string, image: ColoringImage): void {
    // Limpar cache se estiver muito grande
    if (AIImageGenerator.cache.size >= AI_CONFIG.MAX_CACHE_SIZE) {
      const oldestKey = AIImageGenerator.cache.keys().next().value;
      AIImageGenerator.cache.delete(oldestKey);
    }

    AIImageGenerator.cache.set(key, {
      image,
      timestamp: Date.now()
    });
  }

  // Limpar cache
  static clearCache(): void {
    AIImageGenerator.cache.clear();
  }

  // Obter estatísticas do cache
  static getCacheStats(): { size: number; maxSize: number; hitRate: number } {
    return {
      size: AIImageGenerator.cache.size,
      maxSize: AI_CONFIG.MAX_CACHE_SIZE,
      hitRate: 0 // Implementar tracking de hit rate se necessário
    };
  }

  // Pré-carregar imagens populares
  static async preloadPopularImages(): Promise<void> {
    const popularPrompts = [
      { category: 'animals' as ImageCategory, prompt: 'cute cat' },
      { category: 'nature' as ImageCategory, prompt: 'simple flower' },
      { category: 'shapes' as ImageCategory, prompt: 'circle with patterns' },
      { category: 'vehicles' as ImageCategory, prompt: 'simple car' }
    ];

    for (const { category, prompt } of popularPrompts) {
      try {
        await AIImageGenerator.generateImage(prompt, category, true);
      } catch (error) {
        console.error('Erro ao pré-carregar imagem:', error);
      }
    }
  }
}

// Hook para usar geração de IA
export function useAIImageGenerator() {
  return {
    generateImage: AIImageGenerator.generateImage,
    clearCache: AIImageGenerator.clearCache,
    getCacheStats: AIImageGenerator.getCacheStats,
    preloadPopular: AIImageGenerator.preloadPopularImages
  };
}
