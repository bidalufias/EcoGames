import { useState, useCallback, useEffect } from 'react';
import type { GameMode, PlayerState, ZoneConfig } from './types';
import IntroScreen from './IntroScreen';
import StartScreen from './components/StartScreen';
import NameEntryScreen from './components/NameEntryScreen';
import CountdownOverlay from './components/CountdownOverlay';
import GameCanvas from './components/GameCanvas';
import GameHUD from './components/GameHUD';
import PauseMenu from './components/PauseMenu';
import GameOver from './components/GameOver';
import Leaderboard from './components/Leaderboard';
import ChallengerNameEntry from './components/ChallengerNameEntry';
import ChampionRoundEnd from './components/ChampionRoundEnd';
import { Box, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';

type Screen = 'intro' | 'modeselect' | 'nameentry' | 'countdown' | 'playing' | 'gameover' | 'leaderboard' | 'challenger' | 'championend';

export default function ClimateNinjaGame() {
  const navigate = useNavigate();
  const [screen, setScreen] = useState<Screen>('intro');
  const [mode, setMode] = useState<GameMode>('1p');
  const [speed, setSpeed] = useState(1);
  const [playerNames, setPlayerNames] = useState<string[]>(['Player 1']);
  const [gameKey, setGameKey] = useState(0);

  // Live game state from engine callbacks
  const [players, setPlayers] = useState<PlayerState[]>([]);
  const [combos, setCombos] = useState<number[]>([]);
  const [powerups, setPowerups] = useState<string[][]>([]);
  const [frenzy, setFrenzy] = useState<boolean[]>([]);

  // Champion mode state
  const [championName, setChampionName] = useState('');
  const [championState, setChampionState] = useState<PlayerState | null>(null);
  const [challengerName, setChallengerName] = useState('');
  const [challengerState, setChallengerState] = useState<PlayerState | null>(null);
  const [streak, setStreak] = useState(0);

  // Pause
  const [paused, setPaused] = useState(false);

  // Zones ref — updated by canvas engine callback
  const [zones, setZones] = useState<ZoneConfig[]>([]);

  const handleSelectMode = useCallback((m: GameMode, s: number) => {
    setMode(m);
    setSpeed(s);
    setScreen('nameentry');
  }, []);

  const handleNamesSubmit = useCallback((names: string[]) => {
    setPlayerNames(names);
    setScreen('countdown');
  }, []);

  const handleCountdownDone = useCallback(() => {
    setPaused(false);
    setCombos([]);
    setPowerups([]);
    setFrenzy([]);
    setZones([]);
    setGameKey(k => k + 1);
    setScreen('playing');
  }, []);

  const handleGameOver = useCallback((results: PlayerState[]) => {
    setPlayers(results);

    if (mode === 'champion') {
      const champResult = results[0];
      const challResult = results[1];
      setChampionState(champResult);
      setChallengerState(challResult);
      const champWon = champResult.score >= challResult.score;
      if (champWon) {
        setStreak(s => s + 1);
      }
      setScreen('championend');
    } else {
      setScreen('gameover');
    }
  }, [mode]);

  const handleNextChallenger = useCallback((name: string) => {
    setChallengerName(name);
    setPlayerNames([championName, name]);
    setScreen('countdown');
  }, [championName]);

  const handleChampionNextRound = useCallback(() => {
    const champWon = championState && challengerState ? championState.score >= challengerState.score : false;
    if (!champWon && challengerState) {
      setChampionName(challengerName);
      setChampionState(challengerState);
      setStreak(1);
    }
    setScreen('challenger');
  }, [championState, challengerState, challengerName]);

  const handlePlayAgain = useCallback(() => {
    setScreen('modeselect');
  }, []);

  // Escape key for pause
  useEffect(() => {
    if (screen !== 'playing') return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setPaused(p => !p);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [screen]);

  // --- Render ---

  if (screen === 'intro') {
    return <IntroScreen onStart={() => setScreen('modeselect')} />;
  }

  if (screen === 'modeselect') {
    return <StartScreen onSelectMode={handleSelectMode} />;
  }

  if (screen === 'nameentry') {
    const numPlayers = mode === '4p' ? 4 : mode === '2p' || mode === 'champion' ? 2 : 1;
    return <NameEntryScreen playerCount={numPlayers} onSubmit={handleNamesSubmit} />;
  }

  if (screen === 'countdown') {
    return <CountdownOverlay onComplete={handleCountdownDone} />;
  }

  if (screen === 'playing') {
    return (
      <div style={{ position: 'relative', width: '100vw', height: '100dvh', overflow: 'hidden' }}>
        <GameCanvas
          mode={mode}
          playerNames={playerNames}
          speedMult={speed}
          onGameOver={handleGameOver}
          onScoreUpdate={(_, s) => setPlayers(p => { const n = [...p]; if (n[0]) n[0] = { ...n[0], score: s }; return n; })}
          onLivesUpdate={(_, l) => setPlayers(p => { const n = [...p]; if (n[0]) n[0] = { ...n[0], lives: l }; return n; })}
          onComboUpdate={(i, c) => setCombos(arr => { const n = [...arr]; n[i] = c; return n; })}
          onPowerupUpdate={(i, p) => setPowerups(arr => { const n = [...arr]; n[i] = p; return n; })}
          onFrenzy={(i, f) => setFrenzy(arr => { const n = [...arr]; n[i] = f; return n; })}
          onZonesUpdate={(z) => setZones(z)}
          gameKey={gameKey}
        />
        <GameHUD players={players.length ? players : []} zones={zones} combos={combos} powerups={powerups} frenzy={frenzy} />
        {paused && <PauseMenu onResume={() => setPaused(false)} onQuit={() => setScreen('gameover')} />}

        {/* Back button */}
        <Box
          onClick={() => navigate('/')}
          sx={{
            position: 'absolute', top: 12, left: 12, zIndex: 1001,
            px: 1.5, py: 0.5, borderRadius: 2,
            background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(8px)',
            border: '1px solid #E8EDF2', cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: 0.5,
            '&:hover': { background: 'rgba(255,255,255,0.95)' },
            transition: 'background 0.2s',
          }}
        >
          <Typography sx={{ fontSize: 14, color: '#5A6A7E', fontWeight: 600 }}>← Home</Typography>
        </Box>
      </div>
    );
  }

  if (screen === 'gameover') {
    return (
      <Box sx={{ position: 'relative' }}>
        <GameOver
          players={players}
          playerNames={playerNames}
          onPlayAgain={handlePlayAgain}
          onViewLeaderboard={() => setScreen('leaderboard')}
        />
        {/* Back button */}
        <Box
          onClick={() => navigate('/')}
          sx={{
            position: 'absolute', top: 12, left: 12, zIndex: 10,
            px: 1.5, py: 0.5, borderRadius: 2,
            background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(8px)',
            border: '1px solid #E8EDF2', cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: 0.5,
            '&:hover': { background: 'rgba(255,255,255,0.95)' },
          }}
        >
          <Typography sx={{ fontSize: 14, color: '#5A6A7E', fontWeight: 600 }}>← Home</Typography>
        </Box>
      </Box>
    );
  }

  if (screen === 'leaderboard') {
    return (
      <Leaderboard
        scores={players.map((p, i) => ({ name: playerNames[i] || `Player ${i + 1}`, score: p.score }))}
        onBack={handlePlayAgain}
      />
    );
  }

  if (screen === 'challenger') {
    return (
      <ChallengerNameEntry
        championName={championName}
        streak={streak}
        onSubmit={handleNextChallenger}
      />
    );
  }

  if (screen === 'championend' && championState && challengerState) {
    const champWon = championState.score >= challengerState.score;
    return (
      <ChampionRoundEnd
        champion={{ name: championName, state: championState }}
        challenger={{ name: challengerName, state: challengerState }}
        winner={champWon ? 'champion' : 'challenger'}
        streak={streak}
        onNextRound={handleChampionNextRound}
      />
    );
  }

  return null;
}
