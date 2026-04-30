import { Box, Typography } from '@mui/material';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import EcoButton from '../../../components/EcoButton';
import LeaderboardPanel from '../../../components/LeaderboardPanel';
import InGameMenuButton from '../../../components/InGameMenuButton';
import MgtcLogo from '../../../components/MgtcLogo';
import HUD from './HUD';
import Board from './Board';
import GameOverModal from './GameOverModal';
import {
  applyMove,
  highestValue,
  makeIdGen,
  startBoard,
  type BoardState,
  type Direction,
} from '../engine';
import { BOARD_SIZE, WIN_VALUE, type TechTrack } from '../data';

interface SoloPlayProps {
  track: TechTrack;
  onChangeMode: () => void;
}

const BEST_KEY = (trackId: string) => `climate2048:best:${trackId}`;

export default function SoloPlay({ track, onChangeMode }: SoloPlayProps) {
  const idGenRef = useRef(makeIdGen());
  const [state, setState] = useState<BoardState>(() => startBoard(BOARD_SIZE, idGenRef.current));
  const [scoreDelta, setScoreDelta] = useState<number | undefined>(undefined);
  const [showWin, setShowWin] = useState(false);
  const [showOver, setShowOver] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [playerName, setPlayerName] = useState('');
  const [submitted, setSubmitted] = useState(false);

  // Best score persists per-track across reloads
  const [persistedBest, setPersistedBest] = useState(0);
  useEffect(() => {
    const raw = localStorage.getItem(BEST_KEY(track.id));
    const best = raw ? Number(raw) || 0 : 0;
    setPersistedBest(best);
    setState(s => ({ ...s, best }));
  }, [track.id]);

  useEffect(() => {
    if (state.score > persistedBest) {
      setPersistedBest(state.score);
      localStorage.setItem(BEST_KEY(track.id), String(state.score));
    }
  }, [state.score, persistedBest, track.id]);

  const newGame = useCallback(() => {
    idGenRef.current = makeIdGen();
    setState({ ...startBoard(BOARD_SIZE, idGenRef.current), best: persistedBest });
    setShowWin(false);
    setShowOver(false);
    setSubmitted(false);
    setScoreDelta(undefined);
  }, [persistedBest]);

  const doMove = useCallback(
    (dir: Direction) => {
      if (showOver) return;
      setState(prev => {
        const result = applyMove(prev, dir, idGenRef.current, WIN_VALUE);
        if (!result.moved) return prev;
        if (result.scoreDelta > 0) setScoreDelta(result.scoreDelta);
        if (result.reachedWin) setShowWin(true);
        if (result.state.over) setTimeout(() => setShowOver(true), 250);
        return result.state;
      });
    },
    [showOver],
  );

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const map: Record<string, Direction> = {
        ArrowLeft: 'left', ArrowRight: 'right', ArrowUp: 'up', ArrowDown: 'down',
        a: 'left', A: 'left', d: 'right', D: 'right', w: 'up', W: 'up', s: 'down', S: 'down',
      };
      const dir = map[e.key];
      if (dir) {
        e.preventDefault();
        doMove(dir);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [doMove]);

  const best = highestValue(state);

  const submitScore = useCallback(async () => {
    if (!playerName.trim() || submitted) return;
    const { submitScore: send } = await import('../../../lib/supabase');
    await send({ game_id: 'climate-2048', player_name: playerName.trim(), score: state.score });
    setSubmitted(true);
    setShowLeaderboard(true);
  }, [playerName, submitted, state.score]);

  const subtitle = useMemo(
    () => `Merge tiles to climb the ${track.short.toLowerCase()} stack — reach Net Zero (4096) to win.`,
    [track.short],
  );

  if (showLeaderboard) {
    return (
      <Box
        sx={{
          height: '100%',
          bgcolor: '#FAF8EF',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          px: 3,
          py: 5,
          overflow: 'auto',
        }}
      >
        <Typography sx={{ fontSize: '1.8rem', fontWeight: 900, color: '#776E65', mb: 3 }}>
          🏆 Climate 2048 Leaderboard
        </Typography>
        <Box sx={{ width: '100%', maxWidth: 520 }}>
          <LeaderboardPanel gameId="climate-2048" playerName={playerName} />
        </Box>
        <Box sx={{ mt: 3, display: 'flex', gap: 1.5 }}>
          <EcoButton onClick={() => { setShowLeaderboard(false); newGame(); }}>↻ Play Again</EcoButton>
          <EcoButton variant="ghost" onClick={onChangeMode}>Menu</EcoButton>
        </Box>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        position: 'relative',
        height: '100%',
        bgcolor: '#FAF8EF',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        px: 3,
        py: 'clamp(12px, 2.5cqh, 28px)',
        overflow: 'hidden',
      }}
    >
      <InGameMenuButton onClick={onChangeMode} ariaLabel="Back to Climate 2048 main menu" />
      <MgtcLogo />

      {/* HUD + controls + board, capped to 520px wide; the board itself
          shrinks to fit the leftover height so nothing clips on short viewports.
          A top offset clears the absolutely-positioned Menu button + logo above. */}
      <Box sx={{ width: '100%', maxWidth: 520, flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', gap: 1.4, mt: 'clamp(28px, 5cqh, 44px)' }}>
        <HUD
          title="Climate 2048"
          subtitle={subtitle}
          score={state.score}
          best={persistedBest}
          scoreDelta={scoreDelta}
          track={track}
        />
        <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end', flexShrink: 0 }}>
          <EcoButton size="small" onClick={newGame}>↻ New Game</EcoButton>
        </Box>

        {/* Board area — fills the remaining height; Board self-caps to a square. */}
        <Box sx={{ flex: 1, minHeight: 0, minWidth: 0, display: 'grid', placeItems: 'center' }}>
          {/* Square wrapper sized exactly like the board so overlays below
              track the board's bounds rather than the leftover space. */}
          <Box sx={{ position: 'relative', width: '100%', aspectRatio: '1 / 1', maxWidth: '100%', maxHeight: '100%' }}>
          <Board state={state} track={track} onMove={doMove} disabled={showOver} />

          {/* Win overlay shows once at 4096; player can keep going or start over */}
          <GameOverModal
            open={showWin && !showOver}
            won
            bestValue={best}
            score={state.score}
            track={track}
            onKeepGoing={() => setShowWin(false)}
            onNewGame={newGame}
            onLeaderboard={() => setShowLeaderboard(true)}
            onChangeMode={onChangeMode}
          />

          {/* Game-over overlay: name entry → leaderboard submit */}
          {showOver && (
            <Box
              sx={{
                position: 'absolute',
                inset: 0,
                background: 'rgba(238, 228, 218, 0.85)',
                borderRadius: 'inherit',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 30,
                p: 3,
                textAlign: 'center',
                gap: 1.2,
              }}
            >
              <Typography sx={{ fontSize: 'clamp(1.4rem, 4cqh, 2.2rem)', fontWeight: 900, color: '#776E65' }}>
                Game over
              </Typography>
              <Typography sx={{ color: '#776E65', fontSize: '0.95rem' }}>
                Score: <Box component="span" sx={{ fontWeight: 800 }}>{state.score.toLocaleString()}</Box>
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, mt: 1, alignItems: 'center', flexWrap: 'wrap', justifyContent: 'center' }}>
                <input
                  value={playerName}
                  onChange={e => setPlayerName(e.target.value)}
                  placeholder="Your name"
                  maxLength={20}
                  style={{
                    padding: '8px 12px',
                    borderRadius: 8,
                    border: '1px solid #BBADA0',
                    fontSize: '0.95rem',
                    outline: 'none',
                    width: 180,
                    background: '#FFFFFF',
                  }}
                />
                <EcoButton size="small" onClick={submitScore}>🏆 Submit</EcoButton>
              </Box>
              <Box sx={{ display: 'flex', gap: 1, mt: 0.5, flexWrap: 'wrap', justifyContent: 'center' }}>
                <EcoButton size="small" onClick={newGame}>↻ New Game</EcoButton>
                <EcoButton size="small" variant="ghost" onClick={onChangeMode}>Menu</EcoButton>
              </Box>
            </Box>
          )}
          </Box>
        </Box>

        <Typography
          sx={{
            color: '#776E65',
            opacity: 0.75,
            fontSize: '0.78rem',
            textAlign: 'center',
            lineHeight: 1.4,
            flexShrink: 0,
          }}
        >
          <Box component="span" sx={{ fontWeight: 800 }}>How to play:</Box> swipe, arrow keys or WASD to slide tiles. Matching techs merge into the next stage.
        </Typography>
      </Box>
    </Box>
  );
}
