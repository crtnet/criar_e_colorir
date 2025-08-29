'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FaLock, 
  FaUnlock, 
  FaClock, 
  FaRobot, 
  FaVolumeUp, 
  FaVolumeOff,
  FaEye,
  FaDownload,
  FaTrash,
  FaUserShield,
  FaCheck,
  FaTimes,
  FaCalculator,
  FaKeyboard,
  FaHourglass
} from 'react-icons/fa';
import { ParentalSettings, ParentalVerification, UsageReport, ImageCategory, DifficultyLevel, AgeGroup } from '@/types';
import { SecureStorage } from '@/lib/storage';

interface ParentalControlsProps {
  isOpen: boolean;
  onClose: () => void;
  onSettingsChange?: (settings: ParentalSettings) => void;
}

// Tipos de verificação parental
type VerificationMethod = 'math' | 'text' | 'time';

export default function ParentalControls({ isOpen, onClose, onSettingsChange }: ParentalControlsProps) {
  const [isVerified, setIsVerified] = useState(false);
  const [verificationStep, setVerificationStep] = useState<VerificationMethod>('math');
  const [settings, setSettings] = useState<ParentalSettings>({
    maxSessionTime: 30,
    allowAIGeneration: false,
    selectedDifficulty: ['easy'],
    selectedCategories: ['animals', 'nature', 'shapes'],
    soundEnabled: true,
    vibrationEnabled: false,
    ageGroup: '2-4'
  });
  const [usageReports, setUsageReports] = useState<UsageReport[]>([]);
  const [activeTab, setActiveTab] = useState<'settings' | 'usage' | 'data'>('settings');

  // Carregar configurações e relatórios
  useEffect(() => {
    if (isOpen && !isVerified) {
      const savedSettings = SecureStorage.getParentalSettings();
      setSettings(savedSettings);
      
      // Carregar relatórios de uso (mock data por enquanto)
      const mockReports: UsageReport[] = [
        {
          date: new Date(),
          sessionDuration: 25,
          imagesCreated: 3,
          toolsUsed: ['brush', 'bucket', 'eraser'],
          categoriesExplored: ['animals', 'nature']
        }
      ];
      setUsageReports(mockReports);
    }
  }, [isOpen, isVerified]);

  // Verificação parental
  const ParentalVerificationModal = () => {
    const [mathAnswer, setMathAnswer] = useState('');
    const [textAnswer, setTextAnswer] = useState('');
    const [timeRemaining, setTimeRemaining] = useState(10);
    const [mathProblem, setMathProblem] = useState({ a: 0, b: 0, answer: 0 });
    const [isInitialized, setIsInitialized] = useState(false);

    useEffect(() => {
      if (!isInitialized) {
        // Gerar problema matemático apenas uma vez
        const a = Math.floor(Math.random() * 10) + 1;
        const b = Math.floor(Math.random() * 10) + 1;
        setMathProblem({ a, b, answer: a + b });
        setIsInitialized(true);
      }
    }, [isInitialized]);

    useEffect(() => {
      let timer: NodeJS.Timeout;
      if (verificationStep === 'time' && timeRemaining > 0) {
        timer = setTimeout(() => setTimeRemaining(prev => prev - 1), 1000);
      } else if (verificationStep === 'time' && timeRemaining === 0) {
        handleVerificationSuccess();
      }
      return () => {
        if (timer) clearTimeout(timer);
      };
    }, [verificationStep, timeRemaining]);

    const handleVerificationSuccess = () => {
      setIsVerified(true);
      const verification: ParentalVerification = {
        isVerified: true,
        verificationMethod: verificationStep,
        expiresAt: new Date(Date.now() + 30 * 60 * 1000) // 30 minutos
      };
      // Salvar verificação (se necessário)
    };

    const handleMathSubmit = () => {
      if (parseInt(mathAnswer) === mathProblem.answer) {
        handleVerificationSuccess();
      } else {
        setVerificationStep('text');
      }
    };

    const handleTextSubmit = () => {
      if (textAnswer.toLowerCase().includes('adulto') || textAnswer.toLowerCase().includes('pai') || textAnswer.toLowerCase().includes('mãe')) {
        handleVerificationSuccess();
      } else {
        setVerificationStep('time');
      }
    };

    return (
      <motion.div
        key="parental-verification"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      >
        <motion.div
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          exit={{ scale: 0.8 }}
          className="bg-white rounded-child-lg p-6 max-w-md w-full mx-4"
        >
          <div className="text-center mb-6">
            <FaUserShield className="text-4xl text-primary-500 mx-auto mb-3" />
            <h2 className="text-child-xl font-child-friendly text-gray-800">
              Verificação Parental
            </h2>
            <p className="text-child-sm text-gray-600 mt-2">
              Esta área é apenas para adultos
            </p>
          </div>

          {verificationStep === 'math' && (
            <div className="text-center">
              <FaCalculator className="text-2xl text-blue-500 mx-auto mb-3" />
              <p className="text-child-base mb-4">
                Resolva: {mathProblem.a} + {mathProblem.b} = ?
              </p>
              <input
                type="number"
                value={mathAnswer}
                onChange={(e) => setMathAnswer(e.target.value)}
                className="w-20 p-2 text-center border-2 border-gray-300 rounded-child mb-4"
                autoFocus
              />
              <div className="flex gap-2 justify-center">
                <button
                  onClick={handleMathSubmit}
                  className="px-4 py-2 bg-green-500 text-white rounded-child"
                >
                  <FaCheck />
                </button>
                <button
                  onClick={onClose}
                  className="px-4 py-2 bg-red-500 text-white rounded-child"
                >
                  <FaTimes />
                </button>
              </div>
            </div>
          )}

          {verificationStep === 'text' && (
            <div className="text-center">
              <FaKeyboard className="text-2xl text-green-500 mx-auto mb-3" />
              <p className="text-child-base mb-4">
                Digite uma palavra que apenas adultos saberiam:
              </p>
              <input
                type="text"
                value={textAnswer}
                onChange={(e) => setTextAnswer(e.target.value)}
                placeholder="Ex: adulto, pai, mãe..."
                className="w-full p-2 border-2 border-gray-300 rounded-child mb-4"
                autoFocus
              />
              <div className="flex gap-2 justify-center">
                <button
                  onClick={handleTextSubmit}
                  className="px-4 py-2 bg-green-500 text-white rounded-child"
                >
                  <FaCheck />
                </button>
                <button
                  onClick={onClose}
                  className="px-4 py-2 bg-red-500 text-white rounded-child"
                >
                  <FaTimes />
                </button>
              </div>
            </div>
          )}

          {verificationStep === 'time' && (
            <div className="text-center">
              <FaHourglass className="text-2xl text-orange-500 mx-auto mb-3" />
              <p className="text-child-base mb-4">
                Aguarde {timeRemaining} segundos...
              </p>
              <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
                <div 
                  className="bg-orange-500 h-2 rounded-full transition-all duration-1000"
                  style={{ width: `${((10 - timeRemaining) / 10) * 100}%` }}
                />
              </div>
              <button
                onClick={onClose}
                className="px-4 py-2 bg-red-500 text-white rounded-child"
              >
                Cancelar
              </button>
            </div>
          )}
        </motion.div>
      </motion.div>
    );
  };

  // Salvar configurações
  const saveSettings = () => {
    SecureStorage.saveParentalSettings(settings);
    onSettingsChange?.(settings);
    showSuccessMessage('Configurações salvas com sucesso!');
  };

  const showSuccessMessage = (message: string) => {
    console.log(message); // Implementar toast
  };

  // Exportar dados do usuário
  const exportUserData = () => {
    const data = SecureStorage.exportUserData();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `criar-colorir-backup-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Limpar todos os dados
  const clearAllData = () => {
    if (confirm('Tem certeza que deseja apagar todos os dados? Esta ação não pode ser desfeita.')) {
      SecureStorage.clearAllData();
      showSuccessMessage('Todos os dados foram apagados.');
    }
  };

  if (!isOpen) return null;

  return (
    <div>
      <AnimatePresence mode="wait">
        {!isVerified ? (
          <ParentalVerificationModal key="verification" />
        ) : (
        <motion.div
          key="parental-controls"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-40"
        >
          <motion.div
            initial={{ scale: 0.9, y: 50 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 50 }}
            className="bg-white rounded-child-lg max-w-4xl w-full max-h-[90vh] overflow-hidden mx-4"
          >
            {/* Cabeçalho */}
            <div className="flex items-center justify-between p-6 border-b">
              <div className="flex items-center gap-3">
                <FaUserShield className="text-2xl text-primary-500" />
                <h2 className="text-child-xl font-child-friendly text-gray-800">
                  Controles Parentais
                </h2>
              </div>
              <button
                onClick={onClose}
                className="w-10 h-10 flex items-center justify-center text-gray-500 hover:text-gray-700 rounded-child hover:bg-gray-100"
              >
                <FaTimes />
              </button>
            </div>

            {/* Abas */}
            <div className="flex border-b">
              {[
                { id: 'settings', name: 'Configurações', icon: <FaLock /> },
                { id: 'usage', name: 'Uso do App', icon: <FaEye /> },
                { id: 'data', name: 'Dados', icon: <FaDownload /> }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-2 px-6 py-3 font-child-friendly text-child-base ${
                    activeTab === tab.id
                      ? 'border-b-2 border-primary-500 text-primary-500'
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  {tab.icon}
                  {tab.name}
                </button>
              ))}
            </div>

            {/* Conteúdo */}
            <div className="p-6 overflow-y-auto max-h-[60vh]">
              {activeTab === 'settings' && (
                <div className="space-y-6">
                  {/* Faixa etária */}
                  <div className="setting-group">
                    <div className="flex items-center gap-3 mb-3">
                      <FaUserShield className="text-xl text-purple-500" />
                      <h3 className="text-child-lg font-child-friendly text-gray-800">
                        Faixa etária da criança
                      </h3>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {(['2-4','5-7','8-10','11-12'] as AgeGroup[]).map((age) => (
                        <button
                          key={age}
                          onClick={() => setSettings(prev => ({ ...prev, ageGroup: age }))}
                          className={`px-4 py-2 rounded-child font-child-friendly text-child-sm ${
                            (settings.ageGroup || '2-4') === age
                              ? 'bg-primary-500 text-white'
                              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                          }`}
                        >
                          {age} anos
                        </button>
                      ))}
                    </div>
                    <p className="text-child-sm text-gray-600 mt-2">
                      A geração por IA usará esta faixa para adequar a complexidade dos desenhos
                    </p>
                  </div>
                  {/* Tempo de sessão */}
                  <div className="setting-group">
                    <div className="flex items-center gap-3 mb-3">
                      <FaClock className="text-xl text-blue-500" />
                      <h3 className="text-child-lg font-child-friendly text-gray-800">
                        Tempo de Sessão
                      </h3>
                    </div>
                    <div className="flex items-center gap-4">
                      <input
                        type="range"
                        min="10"
                        max="120"
                        step="10"
                        value={settings.maxSessionTime}
                        onChange={(e) => setSettings(prev => ({ ...prev, maxSessionTime: parseInt(e.target.value) }))}
                        className="flex-1"
                      />
                      <span className="text-child-base font-child-friendly w-20">
                        {settings.maxSessionTime} min
                      </span>
                    </div>
                    <p className="text-child-sm text-gray-600 mt-2">
                      Tempo máximo que a criança pode usar o app por sessão
                    </p>
                  </div>

                  {/* Geração de IA */}
                  <div className="setting-group">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <FaRobot className="text-xl text-purple-500" />
                        <div>
                          <h3 className="text-child-lg font-child-friendly text-gray-800">
                            Geração de Imagens com IA
                          </h3>
                          <p className="text-child-sm text-gray-600">
                            Permitir que a criança crie novas imagens usando inteligência artificial
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => setSettings(prev => ({ ...prev, allowAIGeneration: !prev.allowAIGeneration }))}
                        className={`w-12 h-6 rounded-full transition-colors ${
                          settings.allowAIGeneration ? 'bg-green-500' : 'bg-gray-300'
                        }`}
                      >
                        <div className={`w-5 h-5 bg-white rounded-full transition-transform ${
                          settings.allowAIGeneration ? 'translate-x-6' : 'translate-x-0.5'
                        }`} />
                      </button>
                    </div>
                  </div>

                  {/* Som */}
                  <div className="setting-group">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {settings.soundEnabled ? <FaVolumeUp className="text-xl text-green-500" /> : <FaVolumeOff className="text-xl text-gray-400" />}
                        <div>
                          <h3 className="text-child-lg font-child-friendly text-gray-800">
                            Sons e Efeitos
                          </h3>
                          <p className="text-child-sm text-gray-600">
                            Ativar sons de feedback e efeitos sonoros
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => setSettings(prev => ({ ...prev, soundEnabled: !prev.soundEnabled }))}
                        className={`w-12 h-6 rounded-full transition-colors ${
                          settings.soundEnabled ? 'bg-green-500' : 'bg-gray-300'
                        }`}
                      >
                        <div className={`w-5 h-5 bg-white rounded-full transition-transform ${
                          settings.soundEnabled ? 'translate-x-6' : 'translate-x-0.5'
                        }`} />
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'usage' && (
                <div className="space-y-6">
                  <h3 className="text-child-lg font-child-friendly text-gray-800">
                    Relatório de Uso
                  </h3>
                  
                  {usageReports.length > 0 ? (
                    <div className="space-y-4">
                      {usageReports.map((report, index) => (
                        <div key={index} className="bg-gray-50 rounded-child p-4">
                          <div className="flex justify-between items-start mb-3">
                            <h4 className="font-child-friendly text-child-base">
                              {report.date.toLocaleDateString('pt-BR')}
                            </h4>
                            <span className="text-child-sm text-gray-600">
                              {report.sessionDuration} minutos
                            </span>
                          </div>
                          
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-child-sm">
                            <div>
                              <span className="text-gray-600">Imagens criadas:</span>
                              <span className="ml-2 font-semibold">{report.imagesCreated}</span>
                            </div>
                            <div>
                              <span className="text-gray-600">Ferramentas usadas:</span>
                              <span className="ml-2">{report.toolsUsed.join(', ')}</span>
                            </div>
                            <div>
                              <span className="text-gray-600">Categorias:</span>
                              <span className="ml-2">{report.categoriesExplored.join(', ')}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <FaEye className="text-4xl text-gray-400 mx-auto mb-3" />
                      <p className="text-child-base text-gray-600">
                        Nenhum relatório de uso disponível ainda
                      </p>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'data' && (
                <div className="space-y-6">
                  <h3 className="text-child-lg font-child-friendly text-gray-800">
                    Gerenciar Dados
                  </h3>
                  
                  <div className="space-y-4">
                    <div className="bg-blue-50 rounded-child p-4">
                      <div className="flex items-center gap-3 mb-3">
                        <FaDownload className="text-xl text-blue-500" />
                        <h4 className="font-child-friendly text-child-base">Exportar Dados</h4>
                      </div>
                      <p className="text-child-sm text-gray-600 mb-3">
                        Baixe uma cópia de todas as criações e configurações
                      </p>
                      <button
                        onClick={exportUserData}
                        className="px-4 py-2 bg-blue-500 text-white rounded-child font-child-friendly text-child-sm hover:bg-blue-600"
                      >
                        Baixar Backup
                      </button>
                    </div>

                    <div className="bg-red-50 rounded-child p-4">
                      <div className="flex items-center gap-3 mb-3">
                        <FaTrash className="text-xl text-red-500" />
                        <h4 className="font-child-friendly text-child-base">Apagar Todos os Dados</h4>
                      </div>
                      <p className="text-child-sm text-gray-600 mb-3">
                        Remove todas as criações, configurações e dados do app
                      </p>
                      <button
                        onClick={clearAllData}
                        className="px-4 py-2 bg-red-500 text-white rounded-child font-child-friendly text-child-sm hover:bg-red-600"
                      >
                        Apagar Tudo
                      </button>
                    </div>

                    <div className="bg-green-50 rounded-child p-4">
                      <div className="flex items-center gap-3 mb-2">
                        <FaUserShield className="text-xl text-green-500" />
                        <h4 className="font-child-friendly text-child-base">Privacidade</h4>
                      </div>
                      <ul className="text-child-sm text-gray-600 space-y-1">
                        <li>✓ Nenhum dado pessoal é coletado</li>
                        <li>✓ Todas as criações ficam no seu dispositivo</li>
                        <li>✓ Não há rastreamento ou cookies</li>
                        <li>✓ Conformidade total com COPPA e GDPR</li>
                      </ul>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Rodapé */}
            <div className="flex justify-end gap-3 p-6 border-t">
              <button
                onClick={onClose}
                className="px-6 py-2 text-gray-600 hover:text-gray-800 font-child-friendly text-child-base"
              >
                Cancelar
              </button>
              {activeTab === 'settings' && (
                <button
                  onClick={saveSettings}
                  className="px-6 py-2 bg-primary-500 text-white rounded-child font-child-friendly text-child-base hover:bg-primary-600"
                >
                  Salvar Configurações
                </button>
              )}
            </div>
          </motion.div>
        </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
