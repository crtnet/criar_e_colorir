'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FaPalette, 
  FaCog, 
  FaHeart, 
  FaPlay, 
  FaPause,
  FaClock,
  FaStar,
  FaTrophy,
  FaVolumeUp,
  FaVolumeOff
} from 'react-icons/fa';

import ImageGallery from '@/components/ImageGallery';
import ColoringCanvas from '@/components/ColoringCanvas';
import ParentalControls from '@/components/ParentalControls';
import { ColoringImage, UserCreation, ParentalSettings, SessionData } from '@/types';
import { SecureStorage } from '@/lib/storage';

type AppView = 'home' | 'gallery' | 'coloring' | 'creations';

export default function HomePage() {
  const [currentView, setCurrentView] = useState<AppView>('home');
  const [selectedImage, setSelectedImage] = useState<ColoringImage | null>(null);
  const [showParentalControls, setShowParentalControls] = useState(false);
  const [parentalSettings, setParentalSettings] = useState<ParentalSettings>({
    maxSessionTime: 30,
    allowAIGeneration: false,
    selectedDifficulty: ['easy'],
    selectedCategories: ['animals', 'nature', 'shapes'],
    soundEnabled: true,
    vibrationEnabled: false,
    ageGroup: '2-4'
  });
  const [sessionData, setSessionData] = useState<SessionData>({
    startTime: new Date(),
    totalTime: 0,
    imagesColored: 0,
    achievementsUnlocked: []
  });
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [userCreations, setUserCreations] = useState<UserCreation[]>([]);
  const [achievements, setAchievements] = useState<string[]>([]);

  // Carregar dados iniciais
  useEffect(() => {
    const savedSettings = SecureStorage.getParentalSettings();
    setParentalSettings(savedSettings);
    
    const savedSession = SecureStorage.getSessionData();
    setSessionData(savedSession);
    
    const creations = SecureStorage.getUserCreations();
    setUserCreations(creations);
    
    const savedAchievements = SecureStorage.getAchievements();
    setAchievements(savedAchievements);
    
    setTimeRemaining(savedSettings.maxSessionTime * 60); // converter para segundos
  }, []);

  // Timer de sessão
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isSessionActive && timeRemaining > 0) {
      interval = setInterval(() => {
        setTimeRemaining(prev => {
          const newTime = prev - 1;
          if (newTime <= 0) {
            handleSessionEnd();
            return 0;
          }
          return newTime;
        });
        
        setSessionData(prev => ({
          ...prev,
          totalTime: prev.totalTime + 1/60 // incrementar em minutos
        }));
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isSessionActive, timeRemaining]);

  // Iniciar sessão
  const startSession = () => {
    setIsSessionActive(true);
    setSessionData(prev => ({
      ...prev,
      startTime: new Date()
    }));
    SecureStorage.saveSessionData(sessionData);
  };

  // Finalizar sessão
  const handleSessionEnd = () => {
    setIsSessionActive(false);
    SecureStorage.saveSessionData(sessionData);
    
    // Mostrar resumo da sessão
    showSessionSummary();
    
    // Voltar para home
    setCurrentView('home');
  };

  // Mostrar resumo da sessão
  const showSessionSummary = () => {
    // Implementar modal de resumo
    console.log('Sessão finalizada:', sessionData);
  };

  // Selecionar imagem para colorir
  const handleSelectImage = (image: ColoringImage) => {
    setSelectedImage(image);
    setCurrentView('coloring');
    
    if (!isSessionActive) {
      startSession();
    }
  };

  // Salvar criação
  const handleSaveCreation = (creation: UserCreation) => {
    setUserCreations(prev => [...prev, creation]);
    setSessionData(prev => ({
      ...prev,
      imagesColored: prev.imagesColored + 1
    }));
    
    // Verificar conquistas
    checkAchievements();
  };

  // Verificar conquistas
  const checkAchievements = () => {
    const newAchievements: string[] = [];
    
    // Primeira criação
    if (userCreations.length === 0 && !achievements.includes('first_creation')) {
      newAchievements.push('first_creation');
    }
    
    // 5 criações
    if (userCreations.length >= 4 && !achievements.includes('five_creations')) {
      newAchievements.push('five_creations');
    }
    
    // 30 minutos de uso
    if (sessionData.totalTime >= 30 && !achievements.includes('thirty_minutes')) {
      newAchievements.push('thirty_minutes');
    }
    
    if (newAchievements.length > 0) {
      const updatedAchievements = [...achievements, ...newAchievements];
      setAchievements(updatedAchievements);
      SecureStorage.saveAchievements(updatedAchievements);
      
      // Mostrar notificação de conquista
      showAchievementNotification(newAchievements);
    }
  };

  // Mostrar notificação de conquista
  const showAchievementNotification = (newAchievements: string[]) => {
    // Implementar toast de conquista
    console.log('Novas conquistas:', newAchievements);
  };

  // Alternar configurações parentais
  const handleParentalSettingsChange = (newSettings: ParentalSettings) => {
    setParentalSettings(newSettings);
    setTimeRemaining(newSettings.maxSessionTime * 60);
  };

  // Formatar tempo
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
      {/* Barra superior */}
      <header className="bg-white shadow-child sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <motion.div
                whileHover={{ rotate: 360 }}
                transition={{ duration: 0.5 }}
                className="w-10 h-10 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-full flex items-center justify-center"
              >
                <FaPalette className="text-white text-xl" />
              </motion.div>
              <h1 className="text-child-xl font-child-friendly text-gray-800">
                Criar e Colorir
              </h1>
            </div>

            {/* Informações da sessão */}
            {isSessionActive && (
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 text-child-sm">
                  <FaClock className="text-primary-500" />
                  <span className={`font-mono ${timeRemaining < 300 ? 'text-red-500' : 'text-gray-600'}`}>
                    {formatTime(timeRemaining)}
                  </span>
                </div>
                
                <div className="flex items-center gap-2 text-child-sm">
                  <FaTrophy className="text-yellow-500" />
                  <span className="text-gray-600">{achievements.length}</span>
                </div>
              </div>
            )}

            {/* Controles */}
            <div className="flex items-center gap-2">
              {/* Som */}
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setParentalSettings(prev => ({ ...prev, soundEnabled: !prev.soundEnabled }))}
                className="w-10 h-10 flex items-center justify-center text-gray-600 hover:text-primary-500 rounded-child hover:bg-gray-100"
              >
                {parentalSettings.soundEnabled ? <FaVolumeUp /> : <FaVolumeOff />}
              </motion.button>

              {/* Configurações parentais */}
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setShowParentalControls(true)}
                className="w-10 h-10 flex items-center justify-center text-gray-600 hover:text-primary-500 rounded-child hover:bg-gray-100"
              >
                <FaCog />
              </motion.button>
            </div>
          </div>
        </div>
      </header>

      {/* Navegação principal */}
      {currentView !== 'coloring' && (
        <nav className="bg-white shadow-child-lg sticky top-16 z-20">
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex justify-center gap-2 py-4">
              {[
                { id: 'home', name: 'Início', icon: <FaStar /> },
                { id: 'gallery', name: 'Galeria', icon: <FaPalette /> },
                { id: 'creations', name: 'Minhas Criações', icon: <FaHeart /> }
              ].map((item) => (
                <motion.button
                  key={item.id}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setCurrentView(item.id as AppView)}
                  className={`flex items-center gap-2 px-6 py-3 rounded-child-lg font-child-friendly text-child-base transition-all ${
                    currentView === item.id
                      ? 'bg-primary-500 text-white shadow-child'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {item.icon}
                  {item.name}
                </motion.button>
              ))}
            </div>
          </div>
        </nav>
      )}

      {/* Conteúdo principal */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        <AnimatePresence mode="wait">
          {currentView === 'home' && (
            <motion.div
              key="home-view"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="text-center"
            >
              <div className="mb-8">
                <h2 className="text-child-2xl font-child-friendly text-gray-800 mb-4">
                  Bem-vindo ao mundo da criatividade! 🌈
                </h2>
                <p className="text-child-lg text-gray-600 max-w-2xl mx-auto">
                  Escolha uma imagem e deixe sua imaginação voar com cores incríveis!
                </p>
              </div>

              {/* Botões de ação */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setCurrentView('gallery')}
                  className="flex items-center justify-center gap-3 px-8 py-4 bg-primary-500 text-white rounded-child-lg font-child-friendly text-child-lg shadow-child-lg hover:bg-primary-600"
                >
                  <FaPlay />
                  Começar a Colorir
                </motion.button>
                
                {userCreations.length > 0 && (
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setCurrentView('creations')}
                    className="flex items-center justify-center gap-3 px-8 py-4 bg-secondary-500 text-white rounded-child-lg font-child-friendly text-child-lg shadow-child-lg hover:bg-secondary-600"
                  >
                    <FaHeart />
                    Ver Minhas Criações ({userCreations.length})
                  </motion.button>
                )}
              </div>

              {/* Estatísticas */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl mx-auto">
                <div className="bg-white rounded-child-lg shadow-child p-6 text-center">
                  <FaPalette className="text-3xl text-primary-500 mx-auto mb-2" />
                  <div className="text-child-xl font-child-friendly text-gray-800">
                    {userCreations.length}
                  </div>
                  <div className="text-child-sm text-gray-600">Criações</div>
                </div>
                
                <div className="bg-white rounded-child-lg shadow-child p-6 text-center">
                  <FaTrophy className="text-3xl text-yellow-500 mx-auto mb-2" />
                  <div className="text-child-xl font-child-friendly text-gray-800">
                    {achievements.length}
                  </div>
                  <div className="text-child-sm text-gray-600">Conquistas</div>
                </div>
                
                <div className="bg-white rounded-child-lg shadow-child p-6 text-center">
                  <FaClock className="text-3xl text-green-500 mx-auto mb-2" />
                  <div className="text-child-xl font-child-friendly text-gray-800">
                    {Math.round(sessionData.totalTime)}
                  </div>
                  <div className="text-child-sm text-gray-600">Minutos</div>
                </div>
              </div>
            </motion.div>
          )}

          {currentView === 'gallery' && (
            <motion.div
              key="gallery-view"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <ImageGallery
                onSelectImage={handleSelectImage}
                allowAIGeneration={parentalSettings.allowAIGeneration}
                ageGroup={parentalSettings.ageGroup}
              />
            </motion.div>
          )}

          {currentView === 'coloring' && selectedImage && (
            <motion.div
              key="coloring-view"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
            >
              <div className="mb-4 flex justify-between items-center">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setCurrentView('gallery')}
                  className="px-4 py-2 bg-gray-500 text-white rounded-child font-child-friendly text-child-base hover:bg-gray-600"
                >
                  ← Voltar à Galeria
                </motion.button>

                {isSessionActive && (
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleSessionEnd}
                    className="px-4 py-2 bg-red-500 text-white rounded-child font-child-friendly text-child-base hover:bg-red-600"
                  >
                    <FaPause className="inline mr-2" />
                    Pausar Sessão
                  </motion.button>
                )}
              </div>

              <ColoringCanvas
                image={selectedImage}
                onSave={handleSaveCreation}
                onComplete={() => {
                  // Lógica quando imagem é completada
                  checkAchievements();
                }}
              />
            </motion.div>
          )}

          {currentView === 'creations' && (
            <motion.div
              key="creations-view"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
            >
              <div className="text-center mb-6">
                <h2 className="text-child-2xl font-child-friendly text-gray-800 mb-2">
                  Minhas Criações Incríveis! 🎨
                </h2>
                <p className="text-child-base text-gray-600">
                  Veja todas as suas obras de arte
                </p>
              </div>

              {userCreations.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {userCreations.map((creation) => (
                    <motion.div
                      key={creation.id}
                      whileHover={{ scale: 1.02 }}
                      className="bg-white rounded-child-lg shadow-child overflow-hidden"
                    >
                      <div className="aspect-square bg-gray-100">
                        <img
                          src={creation.canvasData}
                          alt="Minha criação"
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="p-3">
                        <div className="text-child-sm text-gray-600">
                          {new Date(creation.createdAt).toLocaleDateString('pt-BR')}
                        </div>
                        <div className={`text-xs px-2 py-1 rounded mt-1 ${
                          creation.isCompleted 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {creation.isCompleted ? 'Finalizada' : 'Em progresso'}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <FaPalette className="text-6xl text-gray-400 mx-auto mb-4" />
                  <h3 className="text-child-xl font-child-friendly text-gray-600 mb-2">
                    Ainda não há criações
                  </h3>
                  <p className="text-child-base text-gray-500 mb-6">
                    Comece a colorir para ver suas obras aqui!
                  </p>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setCurrentView('gallery')}
                    className="px-6 py-3 bg-primary-500 text-white rounded-child-lg font-child-friendly text-child-base hover:bg-primary-600"
                  >
                    Começar a Colorir
                  </motion.button>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Controles parentais */}
      <ParentalControls
        isOpen={showParentalControls}
        onClose={() => setShowParentalControls(false)}
        onSettingsChange={handleParentalSettingsChange}
      />

      {/* Aviso de tempo restante */}
      {isSessionActive && timeRemaining < 300 && timeRemaining > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          className="fixed bottom-4 right-4 bg-yellow-500 text-white px-4 py-2 rounded-child-lg shadow-child-lg z-50"
        >
          <div className="flex items-center gap-2 font-child-friendly text-child-sm">
            <FaClock />
            Restam {Math.ceil(timeRemaining / 60)} minutos!
          </div>
        </motion.div>
      )}
    </div>
  );
}
