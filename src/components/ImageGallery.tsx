'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FaSearch, 
  FaFilter, 
  FaHeart, 
  FaStar, 
  FaPlay,
  FaRobot,
  FaLeaf,
  FaCar,
  FaAppleAlt,
  FaGamepad,
  FaMagic,
  FaShapes,
  FaPaw
} from 'react-icons/fa';
import { ColoringImage, ImageCategory, DifficultyLevel, AgeGroup } from '@/types';
import { useSecureStorage } from '@/lib/storage';
import { useAIImageGenerator } from '@/lib/ai-integration';

interface ImageGalleryProps {
  onSelectImage: (image: ColoringImage) => void;
  allowAIGeneration?: boolean;
  ageGroup?: AgeGroup;
}

// Ícones para categorias
const CATEGORY_ICONS: Record<ImageCategory, React.ReactNode> = {
  animals: <FaPaw />,
  nature: <FaLeaf />,
  shapes: <FaShapes />,
  characters: <FaRobot />,
  vehicles: <FaCar />,
  food: <FaAppleAlt />,
  toys: <FaGamepad />,
  fantasy: <FaMagic />
};

// Nomes em português para categorias
const CATEGORY_NAMES: Record<ImageCategory, string> = {
  animals: 'Animais',
  nature: 'Natureza',
  shapes: 'Formas',
  characters: 'Personagens',
  vehicles: 'Veículos',
  food: 'Comida',
  toys: 'Brinquedos',
  fantasy: 'Fantasia'
};

// Imagens pré-carregadas seguras
const PRELOADED_IMAGES: ColoringImage[] = [
  {
    id: 'cat_001',
    name: 'Gatinho Fofo',
    category: 'animals',
    difficulty: 'easy',
    imageUrl: '/images/coloring/cat-simple.svg',
    thumbnailUrl: '/images/coloring/thumbs/cat-simple.jpg',
    isAIGenerated: false,
    isApproved: true,
    createdAt: new Date('2024-01-01'),
    tags: ['gato', 'animal', 'fofo', 'simples']
  },
  {
    id: 'dog_001',
    name: 'Cachorrinho Amigável',
    category: 'animals',
    difficulty: 'easy',
    imageUrl: '/images/coloring/dog-simple.svg',
    thumbnailUrl: '/images/coloring/thumbs/dog-simple.jpg',
    isAIGenerated: false,
    isApproved: true,
    createdAt: new Date('2024-01-01'),
    tags: ['cachorro', 'animal', 'amigável', 'simples']
  },
  {
    id: 'flower_001',
    name: 'Flor Bonita',
    category: 'nature',
    difficulty: 'easy',
    imageUrl: '/images/coloring/flower-simple.svg',
    thumbnailUrl: '/images/coloring/thumbs/flower-simple.jpg',
    isAIGenerated: false,
    isApproved: true,
    createdAt: new Date('2024-01-01'),
    tags: ['flor', 'natureza', 'bonita', 'simples']
  },
  {
    id: 'sun_001',
    name: 'Sol Sorridente',
    category: 'nature',
    difficulty: 'easy',
    imageUrl: '/images/coloring/sun-simple.svg',
    thumbnailUrl: '/images/coloring/thumbs/sun-simple.jpg',
    isAIGenerated: false,
    isApproved: true,
    createdAt: new Date('2024-01-01'),
    tags: ['sol', 'natureza', 'sorridente', 'simples']
  },
  {
    id: 'circle_001',
    name: 'Círculo Decorado',
    category: 'shapes',
    difficulty: 'easy',
    imageUrl: '/images/coloring/circle-pattern.svg',
    thumbnailUrl: '/images/coloring/thumbs/circle-pattern.jpg',
    isAIGenerated: false,
    isApproved: true,
    createdAt: new Date('2024-01-01'),
    tags: ['círculo', 'forma', 'padrão', 'simples']
  },
  {
    id: 'star_001',
    name: 'Estrela Brilhante',
    category: 'shapes',
    difficulty: 'easy',
    imageUrl: '/images/coloring/star-simple.svg',
    thumbnailUrl: '/images/coloring/thumbs/star-simple.jpg',
    isAIGenerated: false,
    isApproved: true,
    createdAt: new Date('2024-01-01'),
    tags: ['estrela', 'forma', 'brilhante', 'simples']
  },
  {
    id: 'robot_001',
    name: 'Robô Amigável',
    category: 'characters',
    difficulty: 'medium',
    imageUrl: '/images/coloring/robot-friendly.svg',
    thumbnailUrl: '/images/coloring/thumbs/robot-friendly.jpg',
    isAIGenerated: false,
    isApproved: true,
    createdAt: new Date('2024-01-01'),
    tags: ['robô', 'personagem', 'amigável', 'tecnologia']
  },
  {
    id: 'princess_001',
    name: 'Princesa Gentil',
    category: 'characters',
    difficulty: 'medium',
    imageUrl: '/images/coloring/princess-kind.svg',
    thumbnailUrl: '/images/coloring/thumbs/princess-kind.jpg',
    isAIGenerated: false,
    isApproved: true,
    createdAt: new Date('2024-01-01'),
    tags: ['princesa', 'personagem', 'gentil', 'fantasia']
  },
  {
    id: 'car_001',
    name: 'Carrinho Divertido',
    category: 'vehicles',
    difficulty: 'easy',
    imageUrl: '/images/coloring/car-fun.svg',
    thumbnailUrl: '/images/coloring/thumbs/car-fun.jpg',
    isAIGenerated: false,
    isApproved: true,
    createdAt: new Date('2024-01-01'),
    tags: ['carro', 'veículo', 'divertido', 'transporte']
  },
  {
    id: 'airplane_001',
    name: 'Aviãozinho',
    category: 'vehicles',
    difficulty: 'easy',
    imageUrl: '/images/coloring/airplane-simple.svg',
    thumbnailUrl: '/images/coloring/thumbs/airplane-simple.jpg',
    isAIGenerated: false,
    isApproved: true,
    createdAt: new Date('2024-01-01'),
    tags: ['avião', 'veículo', 'voo', 'transporte']
  },
  {
    id: 'apple_001',
    name: 'Maçã Saudável',
    category: 'food',
    difficulty: 'easy',
    imageUrl: '/images/coloring/apple-healthy.svg',
    thumbnailUrl: '/images/coloring/thumbs/apple-healthy.jpg',
    isAIGenerated: false,
    isApproved: true,
    createdAt: new Date('2024-01-01'),
    tags: ['maçã', 'fruta', 'saudável', 'comida']
  },
  {
    id: 'cake_001',
    name: 'Bolo de Aniversário',
    category: 'food',
    difficulty: 'medium',
    imageUrl: '/images/coloring/birthday-cake.svg',
    thumbnailUrl: '/images/coloring/thumbs/birthday-cake.jpg',
    isAIGenerated: false,
    isApproved: true,
    createdAt: new Date('2024-01-01'),
    tags: ['bolo', 'aniversário', 'festa', 'comida']
  },
  {
    id: 'teddy_001',
    name: 'Ursinho de Pelúcia',
    category: 'toys',
    difficulty: 'easy',
    imageUrl: '/images/coloring/teddy-bear.svg',
    thumbnailUrl: '/images/coloring/thumbs/teddy-bear.jpg',
    isAIGenerated: false,
    isApproved: true,
    createdAt: new Date('2024-01-01'),
    tags: ['ursinho', 'brinquedo', 'pelúcia', 'fofo']
  },
  {
    id: 'ball_001',
    name: 'Bola Colorida',
    category: 'toys',
    difficulty: 'easy',
    imageUrl: '/images/coloring/colorful-ball.svg',
    thumbnailUrl: '/images/coloring/thumbs/colorful-ball.jpg',
    isAIGenerated: false,
    isApproved: true,
    createdAt: new Date('2024-01-01'),
    tags: ['bola', 'brinquedo', 'colorida', 'esporte']
  },
  {
    id: 'unicorn_001',
    name: 'Unicórnio Mágico',
    category: 'fantasy',
    difficulty: 'medium',
    imageUrl: '/images/coloring/magical-unicorn.svg',
    thumbnailUrl: '/images/coloring/thumbs/magical-unicorn.jpg',
    isAIGenerated: false,
    isApproved: true,
    createdAt: new Date('2024-01-01'),
    tags: ['unicórnio', 'fantasia', 'mágico', 'arco-íris']
  },
  {
    id: 'castle_001',
    name: 'Castelo Encantado',
    category: 'fantasy',
    difficulty: 'hard',
    imageUrl: '/images/coloring/enchanted-castle.svg',
    thumbnailUrl: '/images/coloring/thumbs/enchanted-castle.jpg',
    isAIGenerated: false,
    isApproved: true,
    createdAt: new Date('2024-01-01'),
    tags: ['castelo', 'fantasia', 'encantado', 'princesa']
  }
];

export default function ImageGallery({ onSelectImage, allowAIGeneration = false, ageGroup = '2-4' }: ImageGalleryProps) {
  const [images, setImages] = useState<ColoringImage[]>(PRELOADED_IMAGES);
  const [filteredImages, setFilteredImages] = useState<ColoringImage[]>(PRELOADED_IMAGES);
  const [selectedCategory, setSelectedCategory] = useState<ImageCategory | 'all'>('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState<DifficultyLevel | 'all'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);

  const storage = useSecureStorage();
  const aiGenerator = useAIImageGenerator();

  // Carregar imagens offline e favoritos
  useEffect(() => {
    const offlineImages = storage.getOfflineImages();
    const allImages = [...PRELOADED_IMAGES, ...offlineImages];
    setImages(allImages);
    setFilteredImages(allImages);

    // Carregar favoritos (usando achievements como proxy)
    const achievements = storage.getAchievements();
    const favoriteIds = achievements.filter(id => id.startsWith('fav_'));
    setFavorites(favoriteIds.map(id => id.replace('fav_', '')));
  }, []);

  // Filtrar imagens
  useEffect(() => {
    let filtered = images;

    // Filtrar por categoria
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(img => img.category === selectedCategory);
    }

    // Filtrar por dificuldade
    if (selectedDifficulty !== 'all') {
      filtered = filtered.filter(img => img.difficulty === selectedDifficulty);
    } else {
      // Aplicar dificuldade padrão baseada na faixa etária
      const allowed: DifficultyLevel[] =
        ageGroup === '2-4' ? ['easy'] :
        ageGroup === '5-7' ? ['easy'] :
        ageGroup === '8-10' ? ['easy', 'medium'] :
        ['medium', 'hard'];
      filtered = filtered.filter(img => allowed.includes(img.difficulty));
    }

    // Filtrar por termo de busca
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(img => 
        img.name.toLowerCase().includes(term) ||
        img.tags.some(tag => tag.toLowerCase().includes(term))
      );
    }

    setFilteredImages(filtered);
  }, [images, selectedCategory, selectedDifficulty, searchTerm, ageGroup]);

  // Alternar favorito
  const toggleFavorite = (imageId: string) => {
    const isFavorite = favorites.includes(imageId);
    let newFavorites;

    if (isFavorite) {
      newFavorites = favorites.filter(id => id !== imageId);
    } else {
      newFavorites = [...favorites, imageId];
    }

    setFavorites(newFavorites);
    
    // Salvar como achievements
    const achievementIds = newFavorites.map(id => `fav_${id}`);
    storage.saveAchievements(achievementIds);
  };

  // Gerar imagem com IA
  const generateAIImage = async (category: ImageCategory) => {
    if (!allowAIGeneration || isGeneratingAI) return;

    setIsGeneratingAI(true);
    try {
      const newImage = await aiGenerator.generateImage('', category, false, ageGroup);
      if (newImage) {
        const updatedImages = [...images, newImage];
        setImages(updatedImages);
        storage.addOfflineImage(newImage);
        
        // Mostrar feedback positivo
        showSuccessMessage('Nova imagem criada! ✨');
      } else {
        showErrorMessage('Não foi possível criar uma nova imagem. Tente novamente!');
      }
    } catch (error) {
      console.error('Erro ao gerar imagem:', error);
      showErrorMessage('Erro ao criar imagem. Tente novamente!');
    } finally {
      setIsGeneratingAI(false);
    }
  };

  const showSuccessMessage = (message: string) => {
    // Implementar toast de sucesso
    console.log(message);
  };

  const showErrorMessage = (message: string) => {
    // Implementar toast de erro
    console.error(message);
  };

  return (
    <div className="image-gallery p-4">
      {/* Cabeçalho */}
      <div className="gallery-header mb-6">
        <h1 className="text-child-2xl font-child-friendly text-center text-gray-800 mb-4">
          Escolha uma Imagem para Colorir! 🎨
        </h1>

        {/* Barra de busca */}
        <div className="search-bar relative mb-4">
          <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Procurar imagens..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 text-child-base font-child-friendly rounded-child-lg border-2 border-gray-300 focus:border-primary-500 focus:outline-none"
          />
        </div>

        {/* Botão de filtros */}
        <div className="flex justify-center mb-4">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 px-6 py-3 bg-secondary-500 text-white rounded-child-lg font-child-friendly text-child-base"
          >
            <FaFilter />
            Filtros
          </motion.button>
        </div>

        {/* Filtros */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="filters bg-white rounded-child-lg shadow-child p-4 mb-4"
            >
              {/* Categorias */}
              <div className="mb-4">
                <h3 className="text-child-lg font-child-friendly text-gray-800 mb-2">
                  Categorias:
                </h3>
                <div className="flex flex-wrap gap-2">
                  <CategoryButton
                    category="all"
                    icon={<FaStar />}
                    name="Todas"
                    active={selectedCategory === 'all'}
                    onClick={() => setSelectedCategory('all')}
                  />
                  {Object.entries(CATEGORY_ICONS).map(([category, icon]) => (
                    <CategoryButton
                      key={category}
                      category={category as ImageCategory}
                      icon={icon}
                      name={CATEGORY_NAMES[category as ImageCategory]}
                      active={selectedCategory === category}
                      onClick={() => setSelectedCategory(category as ImageCategory)}
                    />
                  ))}
                </div>
              </div>

              {/* Dificuldade */}
              <div>
                <h3 className="text-child-lg font-child-friendly text-gray-800 mb-2">
                  Dificuldade:
                </h3>
                <div className="flex gap-2">
                  {[
                    { value: 'all', name: 'Todas' },
                    { value: 'easy', name: 'Fácil' },
                    { value: 'medium', name: 'Médio' },
                    { value: 'hard', name: 'Difícil' }
                  ].map(({ value, name }) => (
                    <motion.button
                      key={value}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setSelectedDifficulty(value as DifficultyLevel | 'all')}
                      className={`px-4 py-2 rounded-child font-child-friendly text-child-sm ${
                        selectedDifficulty === value
                          ? 'bg-primary-500 text-white'
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                    >
                      {name}
                    </motion.button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Gerador de IA */}
      {allowAIGeneration && (
        <div className="ai-generator bg-gradient-to-r from-purple-400 to-pink-400 rounded-child-lg p-4 mb-6">
          <h3 className="text-child-lg font-child-friendly text-white text-center mb-3">
            Criar Nova Imagem com IA ✨
          </h3>
          <div className="flex flex-wrap justify-center gap-2">
            {Object.entries(CATEGORY_NAMES).map(([category, name]) => (
              <motion.button
                key={category}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => generateAIImage(category as ImageCategory)}
                disabled={isGeneratingAI}
                className="flex items-center gap-2 px-4 py-2 bg-white text-purple-600 rounded-child font-child-friendly text-child-sm hover:bg-gray-100 disabled:opacity-50"
              >
                {CATEGORY_ICONS[category as ImageCategory]}
                {isGeneratingAI ? 'Criando...' : name}
              </motion.button>
            ))}
          </div>
        </div>
      )}

      {/* Grid de imagens */}
      <div className="images-grid grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {filteredImages.map((image) => (
          <ImageCard
            key={image.id}
            image={image}
            isFavorite={favorites.includes(image.id)}
            onSelect={() => onSelectImage(image)}
            onToggleFavorite={() => toggleFavorite(image.id)}
          />
        ))}
      </div>

      {/* Mensagem quando não há imagens */}
      {filteredImages.length === 0 && (
        <div className="no-images text-center py-12">
          <div className="text-6xl mb-4">🎨</div>
          <h3 className="text-child-xl font-child-friendly text-gray-600 mb-2">
            Nenhuma imagem encontrada
          </h3>
          <p className="text-child-base text-gray-500">
            Tente ajustar os filtros ou fazer uma nova busca!
          </p>
        </div>
      )}
    </div>
  );
}

// Componente de botão de categoria
interface CategoryButtonProps {
  category: ImageCategory | 'all';
  icon: React.ReactNode;
  name: string;
  active: boolean;
  onClick: () => void;
}

function CategoryButton({ icon, name, active, onClick }: CategoryButtonProps) {
  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-2 rounded-child font-child-friendly text-child-sm ${
        active
          ? 'bg-primary-500 text-white'
          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
      }`}
    >
      {icon}
      {name}
    </motion.button>
  );
}

// Componente de card de imagem
interface ImageCardProps {
  image: ColoringImage;
  isFavorite: boolean;
  onSelect: () => void;
  onToggleFavorite: () => void;
}

function ImageCard({ image, isFavorite, onSelect, onToggleFavorite }: ImageCardProps) {
  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className="image-card bg-white rounded-child-lg shadow-child overflow-hidden cursor-pointer"
    >
      {/* Imagem */}
      <div className="relative aspect-square bg-gray-100">
        <img
          src={image.thumbnailUrl}
          alt={image.name}
          className="w-full h-full object-cover"
          onError={(e) => {
            // Fallback para imagem padrão
            (e.target as HTMLImageElement).src = '/images/placeholder-coloring.svg';
          }}
        />
        
        {/* Botão de favorito */}
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={(e) => {
            e.stopPropagation();
            onToggleFavorite();
          }}
          className={`absolute top-2 right-2 w-8 h-8 rounded-full flex items-center justify-center ${
            isFavorite ? 'bg-red-500 text-white' : 'bg-white text-gray-400'
          }`}
        >
          <FaHeart />
        </motion.button>

        {/* Badge de IA */}
        {image.isAIGenerated && (
          <div className="absolute top-2 left-2 bg-purple-500 text-white px-2 py-1 rounded-child text-xs font-child-friendly">
            IA
          </div>
        )}

        {/* Botão de play */}
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={onSelect}
          className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-0 hover:bg-opacity-20 transition-all"
        >
          <div className="w-12 h-12 bg-primary-500 text-white rounded-full flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
            <FaPlay />
          </div>
        </motion.button>
      </div>

      {/* Informações */}
      <div className="p-3">
        <h3 className="text-child-base font-child-friendly text-gray-800 mb-1 truncate">
          {image.name}
        </h3>
        <div className="flex items-center justify-between text-child-sm text-gray-600">
          <span className="flex items-center gap-1">
            {CATEGORY_ICONS[image.category]}
            {CATEGORY_NAMES[image.category]}
          </span>
          <span className={`px-2 py-1 rounded text-xs ${
            image.difficulty === 'easy' ? 'bg-green-100 text-green-800' :
            image.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-800' :
            'bg-red-100 text-red-800'
          }`}>
            {image.difficulty === 'easy' ? 'Fácil' :
             image.difficulty === 'medium' ? 'Médio' : 'Difícil'}
          </span>
        </div>
      </div>
    </motion.div>
  );
}
