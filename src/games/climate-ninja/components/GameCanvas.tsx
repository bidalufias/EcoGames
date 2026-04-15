import { useEffect, useRef, useCallback } from 'react';
import { GameEngine } from '../GameEngine';
import type { GameMode, PlayerState, ZoneConfig } from '../types';

interface Props {
  mode: GameMode;
  playerNames: string[];
  speedMult: number;
  onGameOver: (results: PlayerState[]) => void;
  onScoreUpdate: (playerIndex: number, score: number) => void;
  onLivesUpdate: (playerIndex: number, lives: number) => void;
  onComboUpdate: (playerIndex: number, combo: number) => void;
  onPowerupUpdate: (playerIndex: number, powerups: string[]) => void;
  onFrenzy: (playerIndex: number, active: boolean) => void;
  onZonesUpdate: (zones: ZoneConfig[]) => void;
  gameKey: number;
}

export default function GameCanvas({
  mode, playerNames, speedMult, onGameOver, onScoreUpdate, onLivesUpdate,
  onComboUpdate, onPowerupUpdate, onFrenzy, onZonesUpdate, gameKey,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<GameEngine | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const callbacksRef = useRef({ onGameOver, onScoreUpdate, onLivesUpdate, onComboUpdate, onPowerupUpdate, onFrenzy, onZonesUpdate });
  callbacksRef.current = { onGameOver, onScoreUpdate, onLivesUpdate, onComboUpdate, onPowerupUpdate, onFrenzy, onZonesUpdate };

  const initEngine = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    if (engineRef.current) {
      engineRef.current.stop();
      engineRef.current = null;
    }

    // Fullscreen canvas
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const engine = new GameEngine(
      canvas, mode, playerNames, speedMult,
      {
        onGameOver: (r) => callbacksRef.current.onGameOver(r),
        onScoreUpdate: (i, s) => callbacksRef.current.onScoreUpdate(i, s),
        onLivesUpdate: (i, l) => callbacksRef.current.onLivesUpdate(i, l),
        onComboUpdate: (i, c) => callbacksRef.current.onComboUpdate(i, c),
        onPowerupUpdate: (i, p) => callbacksRef.current.onPowerupUpdate(i, p),
        onFrenzy: (i, f) => callbacksRef.current.onFrenzy(i, f),
      },
    );
    engineRef.current = engine;
    engine.start();

    // Send initial zones
    callbacksRef.current.onZonesUpdate(engine.getZones());
  }, [mode, playerNames, speedMult]);

  useEffect(() => {
    initEngine();
    return () => { engineRef.current?.stop(); };
  }, [initEngine, gameKey]);

  // Resize handler — fullscreen
  useEffect(() => {
    const handleResize = () => {
      const canvas = canvasRef.current;
      if (!canvas || !engineRef.current) return;
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      engineRef.current.resize(canvas.width, canvas.height);
      callbacksRef.current.onZonesUpdate(engineRef.current.getZones());
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Mouse handlers
  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const { x, y } = eventToCanvas(e.currentTarget, e.clientX, e.clientY);
    engineRef.current?.handlePointerDown(x, y);
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (e.buttons === 0) return;
    const { x, y } = eventToCanvas(e.currentTarget, e.clientX, e.clientY);
    engineRef.current?.handlePointerMove(x, y);
  }, []);

  const handleMouseUp = useCallback(() => {
    engineRef.current?.handlePointerUp();
  }, []);

  // Touch handlers
  const handleTouchStart = useCallback((e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    engineRef.current?.handleTouchStart(e.nativeEvent.touches);
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    engineRef.current?.handleTouchMove(e.nativeEvent.touches);
  }, []);

  const handleTouchEnd = useCallback((e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    engineRef.current?.handleTouchEnd(e.nativeEvent.touches);
  }, []);

  return (
    <div ref={containerRef} style={{
      width: '100%', height: '100%', display: 'flex',
      alignItems: 'center', justifyContent: 'center',
      touchAction: 'none',
    }}>
      <canvas
        ref={canvasRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{
          width: '100%', height: '100%',
          objectFit: 'contain', touchAction: 'none',
        }}
      />
    </div>
  );
}

function eventToCanvas(canvas: HTMLCanvasElement, clientX: number, clientY: number) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: (clientX - rect.left) * (canvas.width / rect.width),
    y: (clientY - rect.top) * (canvas.height / rect.height),
  };
}
