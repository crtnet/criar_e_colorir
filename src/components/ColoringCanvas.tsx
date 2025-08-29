'use client';

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FaPaintBrush, 
  FaFillDrip, 
  FaEraser, 
  FaUndo, 
  FaRedo, 
  FaSave,
  FaDownload,
  FaPalette,
  FaExpand,
  FaCompress,
  FaPrint
} from 'react-icons/fa';
import { DrawingTool, ColoringImage, UserCreation } from '@/types';
import { useSecureStorage } from '@/lib/storage';

interface ColoringCanvasProps {
  image: ColoringImage;
  onSave?: (creation: UserCreation) => void;
  onComplete?: () => void;
}

// Paleta ampliada organizada por grupos
const COLOR_PALETTE = [
  // Vermelhos/Rosas
  '#ff4757', '#ff6b81', '#ff7f7f', '#ff9aa2',
  // Laranjas/Amarelos
  '#ff7f50', '#ffa502', '#ffdd59', '#ffe066',
  // Verdes
  '#2ed573', '#7bed9f', '#55efc4', '#00b894',
  // Azuis
  '#3742fa', '#70a1ff', '#1e90ff', '#74b9ff',
  // Roxos
  '#a55eea', '#e0c3fc', '#9b59b6', '#8e44ad',
  // Pastéis
  '#ffd1dc', '#c6f1e7', '#fef3bd', '#c3f0ff',
  // Neutros/Marrom
  '#ffffff', '#000000', '#747d8c', '#8b4513', '#a0522d',
  // Tons de pele
  '#f6c7b6', '#e0ac69', '#c68642', '#8d5524'
];

export default function ColoringCanvas({ image, onSave, onComplete }: ColoringCanvasProps) {
  const baseCanvasRef = useRef<HTMLCanvasElement>(null); // camada do desenho original (não apagável)
  const drawCanvasRef = useRef<HTMLCanvasElement>(null); // camada de edição do usuário
  const [currentTool, setCurrentTool] = useState<DrawingTool>({
    type: 'brush',
    size: 20,
    color: COLOR_PALETTE[0],
    opacity: 1
  });
  
  const [isDrawing, setIsDrawing] = useState(false);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [customColor, setCustomColor] = useState('#ff4757');
  const [recentColors, setRecentColors] = useState<string[]>([]);
  const [favoriteColors, setFavoriteColors] = useState<string[]>([]);
  const [undoStack, setUndoStack] = useState<ImageData[]>([]);
  const [redoStack, setRedoStack] = useState<ImageData[]>([]);
  const [lastPos, setLastPos] = useState<{ x: number; y: number } | null>(null);
  
  const storage = useSecureStorage();

  // Inicializar canvas (duas camadas: base e desenho do usuário)
  useEffect(() => {
    const baseCanvas = baseCanvasRef.current;
    const drawCanvas = drawCanvasRef.current;
    if (!baseCanvas || !drawCanvas) return;

    const baseCtx = baseCanvas.getContext('2d');
    const drawCtx = drawCanvas.getContext('2d');
    if (!baseCtx || !drawCtx) return;

    // Configurar tamanhos e garantir same-size e posição relativa 1:1
    const W = 800; const H = 600;
    baseCanvas.width = W; baseCanvas.height = H;
    drawCanvas.width = W; drawCanvas.height = H;

    // Base: fundo branco + imagem
    baseCtx.fillStyle = '#ffffff';
    baseCtx.fillRect(0, 0, baseCanvas.width, baseCanvas.height);

    // Limpar camada de desenho (transparente)
    drawCtx.clearRect(0, 0, drawCanvas.width, drawCanvas.height);

    // Carregar imagem de fundo (linhas) na camada base
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      baseCtx.drawImage(img, 0, 0, baseCanvas.width, baseCanvas.height);
      saveState(); // salvar estado inicial da camada de desenho
    };
    img.src = image.imageUrl;

  }, [image.imageUrl]);

  // Salvar estado para undo/redo
  const saveState = useCallback(() => {
    const canvas = drawCanvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    setUndoStack(prev => [...prev.slice(-9), imageData]); // Manter apenas 10 estados
    setRedoStack([]); // Limpar redo stack
    setCanUndo(true);
    setCanRedo(false);
  }, []);

  // Função de undo
  const undo = useCallback(() => {
    if (undoStack.length <= 1) return;

    const canvas = drawCanvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const currentState = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const previousState = undoStack[undoStack.length - 2];

    ctx.putImageData(previousState, 0, 0);
    
    setRedoStack(prev => [...prev, currentState]);
    setUndoStack(prev => prev.slice(0, -1));
    setCanUndo(undoStack.length > 2);
    setCanRedo(true);
  }, [undoStack]);

  // Função de redo
  const redo = useCallback(() => {
    if (redoStack.length === 0) return;

    const canvas = drawCanvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const nextState = redoStack[redoStack.length - 1];
    ctx.putImageData(nextState, 0, 0);

    setUndoStack(prev => [...prev, nextState]);
    setRedoStack(prev => prev.slice(0, -1));
    setCanUndo(true);
    setCanRedo(redoStack.length > 1);
  }, [redoStack]);

  // Obter posição do mouse/toque
  const getEventPos = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = drawCanvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    let clientX, clientY;
    
    if ('touches' in e) {
      clientX = e.touches[0]?.clientX || 0;
      clientY = e.touches[0]?.clientY || 0;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY
    };
  };


  // Iniciar desenho
  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    const pos = getEventPos(e);

    // Conta-gotas com Alt/Option (ou botão direito)
    if (("button" in e && (e as any).button === 2) || ("altKey" in e && (e as any).altKey)) {
      const canvas = drawCanvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      const data = ctx.getImageData(Math.floor(pos.x), Math.floor(pos.y), 1, 1).data;
      const toHex = (n: number) => n.toString(16).padStart(2, '0');
      const hex = `#${toHex(data[0])}${toHex(data[1])}${toHex(data[2])}`;
      setCurrentTool(prev => ({ ...prev, color: hex }));
      setRecentColors(prev => [hex, ...prev.filter(c => c !== hex)].slice(0, 8));
      return;
    }

    if (currentTool.type === 'bucket') {
      // Executa preenchimento imediato e não entra no modo de desenho contínuo
      floodFill(pos.x, pos.y);
      setIsDrawing(false);
      setLastPos(null);
      return;
    }

    setIsDrawing(true);
    setLastPos(pos);
  };

  // Desenhar
  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (currentTool.type === 'bucket') return; // balde não desenha ao arrastar
    if (!isDrawing || !lastPos) return;

    const canvas = drawCanvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const pos = getEventPos(e);

    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineWidth = currentTool.size;
    ctx.globalAlpha = currentTool.opacity;

    if (currentTool.type === 'brush') {
      ctx.globalCompositeOperation = 'source-over';
      ctx.strokeStyle = currentTool.color;
    } else if (currentTool.type === 'eraser') {
      ctx.globalCompositeOperation = 'destination-out';
    }

    ctx.beginPath();
    ctx.moveTo(lastPos.x, lastPos.y);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();

    setLastPos(pos);
  };

  // Parar desenho
  const stopDrawing = () => {
    if (isDrawing) {
      setIsDrawing(false);
      setLastPos(null);
      saveState();
    }
  };

  // Flood fill real (scanline BFS) com tolerância; usa base (linhas) para bordas
  const floodFill = (startX: number, startY: number) => {
    const baseCanvas = baseCanvasRef.current;
    const drawCanvas = drawCanvasRef.current;
    if (!baseCanvas || !drawCanvas) return;

    const baseCtx = baseCanvas.getContext('2d');
    const drawCtx = drawCanvas.getContext('2d');
    if (!baseCtx || !drawCtx) return;

    const width = drawCanvas.width;
    const height = drawCanvas.height;
    const baseImage = baseCtx.getImageData(0, 0, width, height);
    const baseData = baseImage.data;
    const drawImage = drawCtx.getImageData(0, 0, width, height);
    const drawData = drawImage.data;

    const x = Math.floor(startX);
    const y = Math.floor(startY);

    const target = getPixelColor(drawImage, x, y); // alvo na camada de desenho
    const fill = hexToRgba(currentTool.color);
    if (colorsEqual(target, fill)) return;

    const stack: Array<{x:number;y:number}> = [{ x, y }];
    const visited = new Uint8Array(width * height);

    const edgeThreshold = 40; // borda na camada base
    const colorTolerance = 20; // tolerância de cor na camada de desenho

    const isEdgePixel = (px: number, py: number) => {
      const idx = (py * width + px) * 4;
      const r = baseData[idx], g = baseData[idx+1], b = baseData[idx+2];
      return (r + g + b) / 3 < edgeThreshold;
    };

    const isSameRegion = (px: number, py: number) => {
      if (isEdgePixel(px, py)) return false; // não atravessa linha da base
      const idx = (py * width + px) * 4;
      const r = drawData[idx], g = drawData[idx+1], b = drawData[idx+2], a = drawData[idx+3];
      if (isTransparent({ r, g, b, a }) && isTransparent(target)) return true;
      return Math.abs(r - target.r) <= colorTolerance &&
             Math.abs(g - target.g) <= colorTolerance &&
             Math.abs(b - target.b) <= colorTolerance &&
             (a > 0 || isTransparent(target));
    };

    const setPixel = (px: number, py: number, c: {r:number;g:number;b:number;a:number}) => {
      const idx = (py * width + px) * 4;
      drawData[idx] = c.r; drawData[idx+1] = c.g; drawData[idx+2] = c.b; drawData[idx+3] = c.a;
    };

    while (stack.length) {
      const { x: cx, y: cy } = stack.pop()!;
      if (cx < 0 || cy < 0 || cx >= width || cy >= height) continue;
      const vIdx = cy * width + cx;
      if (visited[vIdx]) continue;
      visited[vIdx] = 1;

      if (!isSameRegion(cx, cy)) continue;

      // expandir para esquerda e direita (scanline)
      let left = cx;
      while (left >= 0 && isSameRegion(left, cy)) {
        setPixel(left, cy, fill);
        left--;
      }
      left++;

      let right = cx + 1;
      while (right < width && isSameRegion(right, cy)) {
        setPixel(right, cy, fill);
        right++;
      }

      // empurrar linhas acima/abaixo entre [left, right)
      for (let nx = left; nx < right; nx++) {
        const upIdx = (cy - 1) * width + nx;
        const downIdx = (cy + 1) * width + nx;
        if (cy > 0 && !visited[upIdx]) stack.push({ x: nx, y: cy - 1 });
        if (cy < height - 1 && !visited[downIdx]) stack.push({ x: nx, y: cy + 1 });
      }
    }

    drawCtx.putImageData(drawImage, 0, 0);
    saveState();
  };

  // Utilitários para cores
  const getPixelColor = (imageData: ImageData, x: number, y: number) => {
    const index = (y * imageData.width + x) * 4;
    return {
      r: imageData.data[index],
      g: imageData.data[index + 1],
      b: imageData.data[index + 2],
      a: imageData.data[index + 3]
    };
  };

  const hexToRgba = (hex: string) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return { r, g, b, a: 255 };
  };

  const colorsEqual = (c1: any, c2: any) => {
    return c1.r === c2.r && c1.g === c2.g && c1.b === c2.b && c1.a === c2.a;
  };

  // Considerar pixels “apagados” (transparentes) como preenchíveis
  const isTransparent = (c: {r:number;g:number;b:number;a:number}) => c.a === 0 || (c.r === 0 && c.g === 0 && c.b === 0 && c.a < 10);

  // Salvar criação
  const saveCreation = () => {
    const baseCanvas = baseCanvasRef.current;
    const drawCanvas = drawCanvasRef.current;
    if (!baseCanvas || !drawCanvas) return;

    // Compor as duas camadas em um canvas temporário
    const W = baseCanvas.width, H = baseCanvas.height;
    const temp = document.createElement('canvas');
    temp.width = W; temp.height = H;
    const tctx = temp.getContext('2d');
    if (!tctx) return;
    tctx.drawImage(baseCanvas, 0, 0, W, H);
    tctx.drawImage(drawCanvas, 0, 0, W, H);

    const canvasData = temp.toDataURL('image/png');
    const creation: UserCreation = {
      id: `creation_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      imageId: image.id,
      canvasData,
      createdAt: new Date(),
      lastModified: new Date(),
      isCompleted: false
    };

    storage.saveCreation(creation);
    onSave?.(creation);

    // Feedback visual
    showSuccessMessage('Desenho salvo! 🎨');
  };

  // Baixar imagem
  const downloadImage = () => {
    const baseCanvas = baseCanvasRef.current;
    const drawCanvas = drawCanvasRef.current;
    if (!baseCanvas || !drawCanvas) return;

    const W = baseCanvas.width, H = baseCanvas.height;
    const temp = document.createElement('canvas');
    temp.width = W; temp.height = H;
    const tctx = temp.getContext('2d');
    if (!tctx) return;
    tctx.drawImage(baseCanvas, 0, 0, W, H);
    tctx.drawImage(drawCanvas, 0, 0, W, H);

    const link = document.createElement('a');
    link.download = `colorir_${image.name}_${Date.now()}.png`;
    link.href = temp.toDataURL('image/png');
    link.click();

    showSuccessMessage('Imagem baixada! 📱');
  };

  // Mostrar mensagem de sucesso
  const showSuccessMessage = (message: string) => {
    // Implementar toast ou notificação
    console.log(message);
  };

  // Alternar fullscreen
  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  // Imprimir imagem (composição das camadas)
  const printImage = () => {
    const baseCanvas = baseCanvasRef.current;
    const drawCanvas = drawCanvasRef.current;
    if (!baseCanvas || !drawCanvas) return;

    const W = baseCanvas.width, H = baseCanvas.height;
    const temp = document.createElement('canvas');
    temp.width = W; temp.height = H;
    const tctx = temp.getContext('2d');
    if (!tctx) return;
    tctx.drawImage(baseCanvas, 0, 0, W, H);
    tctx.drawImage(drawCanvas, 0, 0, W, H);

    const dataUrl = temp.toDataURL('image/png');
    const win = window.open('', '_blank');
    if (!win) return;
    win.document.write(`<!doctype html><html><head><title>Imprimir - ${image.name}</title>
      <style>@page{size:A4;margin:12mm;}body{margin:0;display:flex;justify-content:center;align-items:center;}img{width:100%;height:auto;}</style>
      </head><body><img src="${dataUrl}" alt="${image.name}" /></body></html>`);
    win.document.close();
    win.onload = () => {
      win.focus();
      win.print();
      setTimeout(() => { try { win.close(); } catch {} }, 300);
    };
  };

  return (
    <div className={`coloring-canvas ${isFullscreen ? 'fullscreen' : ''}`}>
      {/* Barra de ferramentas */}
      <div className="toolbar bg-white shadow-child rounded-child-lg p-4 mb-4">
        <div className="flex flex-wrap gap-4 items-center justify-center">
          {/* Ferramentas principais */}
          <div className="flex gap-2">
            <ToolButton
              icon={<FaPaintBrush />}
              active={currentTool.type === 'brush'}
              onClick={() => setCurrentTool(prev => ({ ...prev, type: 'brush' }))}
              label="Pincel"
            />
            <ToolButton
              icon={<FaFillDrip />}
              active={currentTool.type === 'bucket'}
              onClick={() => setCurrentTool(prev => ({ ...prev, type: 'bucket' }))}
              label="Balde"
            />
            <ToolButton
              icon={<FaEraser />}
              active={currentTool.type === 'eraser'}
              onClick={() => setCurrentTool(prev => ({ ...prev, type: 'eraser' }))}
              label="Borracha"
            />
          </div>

          {/* Controles de tamanho */}
          <div className="flex items-center gap-2">
            <span className="text-child-sm font-child-friendly">Tamanho:</span>
            <input
              type="range"
              min="5"
              max="50"
              value={currentTool.size}
              onChange={(e) => setCurrentTool(prev => ({ ...prev, size: parseInt(e.target.value) }))}
              className="w-20"
            />
            <span className="text-child-sm w-8">{currentTool.size}</span>
          </div>

          {/* Opacidade */}
          <div className="flex items-center gap-2">
            <span className="text-child-sm font-child-friendly">Opacidade:</span>
            <input
              type="range"
              min="0.1"
              max="1"
              step="0.05"
              value={currentTool.opacity}
              onChange={(e) => setCurrentTool(prev => ({ ...prev, opacity: parseFloat(e.target.value) }))}
              className="w-24"
            />
            <span className="text-child-sm w-10">{Math.round(currentTool.opacity*100)}%</span>
          </div>

          {/* Seletor de cores */}
          <div className="relative">
            <ToolButton
              icon={<FaPalette />}
              active={showColorPicker}
              onClick={() => setShowColorPicker(!showColorPicker)}
              label="Cores"
              style={{ backgroundColor: currentTool.color }}
            />
            
            <AnimatePresence>
              {showColorPicker && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="absolute top-full mt-2 bg-white shadow-child-lg rounded-child p-4 z-10"
                >
                  <div className="grid grid-cols-4 gap-2 w-56">
                    {COLOR_PALETTE.map((color, index) => (
                      <button
                        key={index}
                        className={`w-10 h-10 rounded-child border-2 transition-transform hover:scale-110 ${
                          currentTool.color === color ? 'border-gray-800' : 'border-gray-300'
                        }`}
                        style={{ backgroundColor: color }}
                        onClick={() => {
                          setCurrentTool(prev => ({ ...prev, color }));
                          setRecentColors(prev => [color, ...prev.filter(c => c !== color)].slice(0, 8));
                          setShowColorPicker(false);
                        }}
                        aria-label={`Cor ${color}`}
                      />
                    ))}
                  </div>
                  {/* Favoritas */}
                  {favoriteColors.length > 0 && (
                    <div className="mt-3">
                      <div className="text-child-sm text-gray-600 mb-1">Favoritas:</div>
                      <div className="flex flex-wrap gap-2">
                        {favoriteColors.map((color) => (
                          <button
                            key={color}
                            className="w-8 h-8 rounded-full border"
                            style={{ backgroundColor: color, borderColor: '#ccc' }}
                            onClick={() => {
                              setCurrentTool(prev => ({ ...prev, color }));
                              setShowColorPicker(false);
                            }}
                            aria-label={`Favorita ${color}`}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                  <div className="mt-3 flex items-center gap-2">
                    <input
                      type="color"
                      value={customColor}
                      onChange={(e) => setCustomColor(e.target.value)}
                      className="w-10 h-10 p-0 border rounded"
                      aria-label="Cor personalizada"
                    />
                    <input
                      type="text"
                      value={customColor}
                      onChange={(e) => setCustomColor(e.target.value)}
                      className="w-24 border rounded px-2 py-1 text-child-sm"
                      aria-label="Hex"
                    />
                    <button
                      className="px-3 py-2 bg-primary-500 text-white rounded-child text-child-sm"
                      onClick={() => {
                        const hex = customColor.startsWith('#') ? customColor : `#${customColor}`;
                        setCurrentTool(prev => ({ ...prev, color: hex }));
                        setRecentColors(prev => [hex, ...prev.filter(c => c !== hex)].slice(0, 8));
                        setShowColorPicker(false);
                      }}
                    >
                      Usar
                    </button>
                    <button
                      className="px-3 py-2 bg-yellow-500 text-white rounded-child text-child-sm"
                      onClick={() => {
                        const hex = customColor.startsWith('#') ? customColor : `#${customColor}`;
                        setFavoriteColors(prev => [hex, ...prev.filter(c => c !== hex)].slice(0, 12));
                      }}
                    >
                      Favoritar
                    </button>
                  </div>
                  {recentColors.length > 0 && (
                    <div className="mt-3">
                      <div className="text-child-sm text-gray-600 mb-1">Recentes:</div>
                      <div className="flex flex-wrap gap-2">
                        {recentColors.map((color) => (
                          <button
                            key={color}
                            className="w-8 h-8 rounded-full border"
                            style={{ backgroundColor: color, borderColor: '#ccc' }}
                            onClick={() => {
                              setCurrentTool(prev => ({ ...prev, color }));
                              setShowColorPicker(false);
                            }}
                            aria-label={`Recente ${color}`}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Ações */}
          <div className="flex gap-2">
            <ToolButton
              icon={<FaUndo />}
              onClick={undo}
              disabled={!canUndo}
              label="Desfazer"
            />
            <ToolButton
              icon={<FaRedo />}
              onClick={redo}
              disabled={!canRedo}
              label="Refazer"
            />
            <ToolButton
              icon={<FaSave />}
              onClick={saveCreation}
              label="Salvar"
            />
            <ToolButton
              icon={<FaDownload />}
              onClick={downloadImage}
              label="Baixar"
            />
            <ToolButton
              icon={<FaPrint />}
              onClick={printImage}
              label="Imprimir"
            />
            <ToolButton
              icon={isFullscreen ? <FaCompress /> : <FaExpand />}
              onClick={toggleFullscreen}
              label={isFullscreen ? "Sair da tela cheia" : "Tela cheia"}
            />
          </div>
        </div>
      </div>

      {/* Canvas em camadas: base (linhas) + edição (usuário) */}
      <div className="canvas-container bg-white rounded-child-lg shadow-child p-4 relative">
        <div className="relative inline-block">
          <canvas
            ref={baseCanvasRef}
            className="block"
            style={{ display: 'block' }}
          />
          <canvas
            ref={drawCanvasRef}
            className="absolute top-0 left-0 cursor-crosshair touch-action-none"
            style={{ display: 'block' }}
            onMouseDown={startDrawing}
            onContextMenu={(e) => { e.preventDefault(); startDrawing(e as any); }}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
            onTouchStart={startDrawing}
            onTouchMove={draw}
            onTouchEnd={stopDrawing}
          />
        </div>
      </div>

      {/* Informações da imagem */}
      <div className="image-info mt-4 text-center">
        <h2 className="text-child-xl font-child-friendly text-gray-800 mb-2">
          {image.name}
        </h2>
        <div className="flex justify-center gap-4 text-child-sm text-gray-600">
          <span>Categoria: {image.category}</span>
          <span>Dificuldade: {image.difficulty}</span>
        </div>
      </div>
    </div>
  );
}

// Componente de botão de ferramenta
interface ToolButtonProps {
  icon: React.ReactNode;
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
  label: string;
  style?: React.CSSProperties;
}

function ToolButton({ icon, onClick, active, disabled, label, style }: ToolButtonProps) {
  return (
    <motion.button
      whileHover={{ scale: disabled ? 1 : 1.1 }}
      whileTap={{ scale: disabled ? 1 : 0.95 }}
      className={`
        min-w-child-touch min-h-child-touch
        flex items-center justify-center
        rounded-child border-2 transition-all
        font-child-friendly text-child-sm
        ${active 
          ? 'bg-primary-500 text-white border-primary-600' 
          : 'bg-white text-gray-700 border-gray-300 hover:border-primary-400'
        }
        ${disabled 
          ? 'opacity-50 cursor-not-allowed' 
          : 'cursor-pointer'
        }
      `}
      onClick={onClick}
      disabled={disabled}
      title={label}
      style={style}
    >
      {icon}
    </motion.button>
  );
}
