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

  // Size the canvas to its container (the 16:9 stage), not the raw viewport.
  const measure = useCallback(() => {
    const container = containerRef.current;
    if (!container) return { w: 0, h: 0 };
    const rect = container.getBoundingClientRect();
    return { w: Math.max(1, Math.floor(rect.width)), h: Math.max(1, Math.floor(rect.height)) };
  }, []);

  const initEngine = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    if (engineRef.current) {
      engineRef.current.stop();
      engineRef.current = null;
    }

    const { w, h } = measure();
    canvas.width = w;
    canvas.height = h;

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
  }, [mode, playerNames, speedMult, measure]);

  useEffect(() => {
    initEngine();
    return () => { engineRef.current?.stop(); };
  }, [initEngine, gameKey]);

  // Track container size — the stage may resize when the user rotates or
  // resizes the window even though the stage itself is locked to 16:9.
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const handleResize = () => {
      const canvas = canvasRef.current;
      if (!canvas || !engineRef.current) return;
      const { w, h } = measure();
      if (w === canvas.width && h === canvas.height) return;
      canvas.width = w;
      canvas.height = h;
      engineRef.current.resize(w, h);
      callbacksRef.current.onZonesUpdate(engineRef.current.getZones());
    };
    const observer = new ResizeObserver(handleResize);
    observer.observe(container);
    window.addEventListener('resize', handleResize);
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', handleResize);
    };
  }, [measure]);

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
