import { Box, Typography } from '@mui/material';
import { motion } from 'framer-motion';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import EcoButton from '../../../components/EcoButton';
import Board from './Board';
import {
  applyMove,
  highestValue,
  makeIdGen,
  startBoard,
  type BoardState,
  type Direction,
  type IdGen,
} from '../engine';
import { BOARD_SIZE, paletteFor, stageFor, type TechTrack } from '../data';

interface ChallengePlayProps {
  track: TechTrack;
  onChangeMode: () => void;
}

const TARGET_OPTIONS = [128, 512, 2048] as const;
type Target = (typeof TARGET_OPTIONS)[number];

interface PlayerSlot {
  state: BoardState;
  idGen: IdGen;
  stuck: boolean;
  reachedTarget: boolean;
}

function freshSlot(): PlayerSlot {
  const idGen = makeIdGen();
  return { state: startBoard(BOARD_SIZE, idGen), idGen, stuck: false, reachedTarget: false };
}

interface PlayerColumnProps {
  label: string;
  controls: string;
  accent: string;
  slot: PlayerSlot;
  track: TechTrack;
  target: Target;
  onMove: (dir: Direction) => void;
  winnerLabel?: string | null;
  /** Render this column rotated 180° so a player on the far side of a
   *  tabletop screen sees their own board right-side up. Inverts swipes too. */
  flipped?: boolean;
}

function PlayerColumn({ label, controls, accent, slot, track, target, onMove, winnerLabel, flipped }: PlayerColumnProps) {
  const top = highestValue(slot.state);
  const palette = paletteFor(top || 2);
  const stage = stageFor(track, top || 2);
  return (
    <Box
      sx={{
        flex: 1,
        minWidth: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'stretch',
        gap: 1.2,
        transform: flipped ? 'rotate(180deg)' : undefined,
        transformOrigin: 'center center',
      }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 1,
          background: '#FFFFFF',
          border: `2px solid ${accent}40`,
          borderRadius: 3,
          px: 1.6,
          py: 1,
        }}
      >
        <Box sx={{ minWidth: 0 }}>
          <Typography sx={{ fontSize: '0.66rem', fontWeight: 800, letterSpacing: '0.14em', textTransform: 'uppercase', color: accent }}>
            {label}
          </Typography>
          <Typography sx={{ fontSize: '0.78rem', color: '#5A6A7E', lineHeight: 1.2 }}>{controls}</Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1.2, alignItems: 'center' }}>
          <Box sx={{ textAlign: 'center' }}>
            <Typography sx={{ fontSize: '0.55rem', fontWeight: 800, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#94A3B8' }}>Score</Typography>
            <Typography sx={{ fontSize: '1.05rem', fontWeight: 800, color: '#1A2332', lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>
              {slot.state.score.toLocaleString()}
            </Typography>
          </Box>
          <Box
            sx={{
              minWidth: 60,
              textAlign: 'center',
              borderRadius: 2,
              px: 0.8,
              py: 0.4,
              background: palette.bg,
              color: palette.fg,
              border: '1px solid rgba(0,0,0,0.06)',
            }}
          >
            <Typography sx={{ fontSize: '0.55rem', fontWeight: 800, letterSpacing: '0.12em', opacity: 0.8 }}>BEST</Typography>
            <Typography sx={{ fontSize: '0.78rem', fontWeight: 800, lineHeight: 1.1 }}>
              {stage.emoji} {top || 2}
            </Typography>
          </Box>
        </Box>
      </Box>

      <Box sx={{ flex: 1, minHeight: 0, minWidth: 0, display: 'grid', placeItems: 'center' }}>
        {/* Square wrapper sized exactly like the board, so the overlay below
            tracks the board's bounds rather than the leftover grid cell. */}
        <Box sx={{ position: 'relative', width: '100%', aspectRatio: '1 / 1', maxWidth: '100%', maxHeight: '100%' }}>
          <Board
            state={slot.state}
            track={track}
            onMove={onMove}
            disabled={slot.stuck || !!winnerLabel}
            invertGestures={flipped}
          />

          {(slot.reachedTarget || slot.stuck) && !winnerLabel && (
            <Box
              sx={{
                position: 'absolute',
                inset: 0,
                background: slot.reachedTarget ? 'rgba(13, 155, 74, 0.45)' : 'rgba(118, 110, 101, 0.4)',
                borderRadius: 'inherit',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 25,
              }}
            >
              <Typography sx={{ color: '#FFFFFF', fontWeight: 900, fontSize: 'clamp(1rem, 4cqi, 1.6rem)', textShadow: '0 1px 2px rgba(0,0,0,0.25)' }}>
                {slot.reachedTarget ? `Reached ${target}!` : 'No moves left'}
              </Typography>
            </Box>
          )}
        </Box>
      </Box>
    </Box>
  );
}

export default function ChallengePlay({ track, onChangeMode }: ChallengePlayProps) {
  const [target, setTarget] = useState<Target>(512);
  const [phase, setPhase] = useState<'setup' | 'playing' | 'finished'>('setup');
  const [p1, setP1] = useState<PlayerSlot>(freshSlot);
  const [p2, setP2] = useState<PlayerSlot>(freshSlot);
  const [winner, setWinner] = useState<'p1' | 'p2' | 'draw' | null>(null);
  const phaseRef = useRef(phase);
  useEffect(() => {
    phaseRef.current = phase;
  }, [phase]);

  const startMatch = useCallback(() => {
    setP1(freshSlot());
    setP2(freshSlot());
    setWinner(null);
    setPhase('playing');
  }, []);

  const finishIfDecided = useCallback((a: PlayerSlot, b: PlayerSlot, who: 'p1' | 'p2') => {
    // If `who` just reached the target, they win immediately
    if (a.reachedTarget) {
      setWinner(who);
      setPhase('finished');
      return;
    }
    // If both stuck, decide by score
    if (a.stuck && b.stuck) {
      if (a.state.score > b.state.score) setWinner(who);
      else if (b.state.score > a.state.score) setWinner(who === 'p1' ? 'p2' : 'p1');
      else setWinner('draw');
      setPhase('finished');
    }
  }, []);

  const moveFor = useCallback(
    (player: 'p1' | 'p2', dir: Direction) => {
      if (phaseRef.current !== 'playing') return;
      const setSelf = player === 'p1' ? setP1 : setP2;
      const otherRef = player === 'p1' ? p2 : p1;

      setSelf(prev => {
        if (prev.stuck || prev.reachedTarget) return prev;
        const result = applyMove(prev.state, dir, prev.idGen, target);
        if (!result.moved) return prev;
        const reached = !prev.reachedTarget && highestValue(result.state) >= target;
        const stuck = result.state.over && !reached;
        const next: PlayerSlot = {
          ...prev,
          state: result.state,
          reachedTarget: reached,
          stuck,
        };
        // Defer final-state check to next tick so React batching doesn't fight us
        if (reached || stuck) {
          queueMicrotask(() => finishIfDecided(next, otherRef, player));
        }
        return next;
      });
    },
    [p1, p2, target, finishIfDecided],
  );

  // Single keyboard listener routes to whichever player owns the key.
  useEffect(() => {
    if (phase !== 'playing') return;
    const handler = (e: KeyboardEvent) => {
      const p1Map: Record<string, Direction> = { w: 'up', W: 'up', a: 'left', A: 'left', s: 'down', S: 'down', d: 'right', D: 'right' };
      const p2Map: Record<string, Direction> = { ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right' };
      if (e.key in p1Map) { e.preventDefault(); moveFor('p1', p1Map[e.key]); return; }
      if (e.key in p2Map) { e.preventDefault(); moveFor('p2', p2Map[e.key]); return; }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [phase, moveFor]);

  const winnerLabel = useMemo(() => {
    if (!winner) return null;
    if (winner === 'draw') return "It's a draw!";
    if (winner === 'p1') return 'Player 1 wins!';
    return 'Player 2 wins!';
  }, [winner]);

  // --- Setup screen ---
  if (phase === 'setup') {
    return (
      <Box
        sx={{
          height: '100dvh',
          bgcolor: '#FAF8EF',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          px: 3,
          py: 6,
          overflow: 'hidden',
        }}
      >
        <Typography sx={{ fontSize: '0.78rem', fontWeight: 800, letterSpacing: '0.18em', textTransform: 'uppercase', color: '#A39A8C' }}>
          Challenge · {track.short}
        </Typography>
        <Typography sx={{ mt: 0.5, fontSize: 'clamp(1.6rem, 3.6vh, 2.3rem)', fontWeight: 900, color: '#776E65', lineHeight: 1 }}>
          Pick the target tile
        </Typography>
        <Typography sx={{ mt: 1, color: '#776E65', opacity: 0.78, fontSize: '0.92rem', textAlign: 'center', maxWidth: 540 }}>
          First player to merge up to the target wins. If both players run out of moves, the higher score takes it.
        </Typography>

        <Box sx={{ mt: 3, display: 'flex', gap: 1.6, flexWrap: 'wrap', justifyContent: 'center' }}>
          {TARGET_OPTIONS.map(opt => {
            const stage = stageFor(track, opt);
            const palette = paletteFor(opt);
            const selected = target === opt;
            return (
              <motion.div key={opt} whileHover={{ y: -3 }}>
                <Box
                  onClick={() => setTarget(opt)}
                  sx={{
                    cursor: 'pointer',
                    minWidth: 160,
                    px: 2,
                    py: 1.5,
                    borderRadius: 3,
                    background: selected ? palette.bg : '#FFFFFF',
                    color: selected ? palette.fg : '#1A2332',
                    border: `2px solid ${selected ? '#776E65' : '#E2E8F0'}`,
                    textAlign: 'center',
                    transition: 'all 0.18s',
                  }}
                >
                  <Typography sx={{ fontSize: '0.62rem', fontWeight: 800, letterSpacing: '0.14em', textTransform: 'uppercase', opacity: 0.7 }}>
                    {opt === 128 ? 'Quick' : opt === 512 ? 'Standard' : 'Marathon'}
                  </Typography>
                  <Typography sx={{ fontSize: '1.4rem', fontWeight: 900, lineHeight: 1.1 }}>
                    {stage.emoji} {opt}
                  </Typography>
                  <Typography sx={{ fontSize: '0.72rem', fontWeight: 700, opacity: 0.85 }}>
                    {stage.name}
                  </Typography>
                </Box>
              </motion.div>
            );
          })}
        </Box>

        <Box sx={{ mt: 4, display: 'flex', gap: 1.5 }}>
          <EcoButton onClick={startMatch} size="large">Start match</EcoButton>
          <EcoButton variant="ghost" onClick={onChangeMode}>← Back</EcoButton>
        </Box>
      </Box>
    );
  }

  // --- Match (playing or finished) ---
  return (
    <Box
      sx={{
        height: '100dvh',
        bgcolor: '#FAF8EF',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        px: 'clamp(8px, 1.5vw, 24px)',
        py: 'clamp(8px, 1.6vh, 18px)',
        overflow: 'hidden',
      }}
    >
      {/* Header bar */}
      <Box
        sx={{
          width: '100%',
          maxWidth: 1280,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 2,
          mb: 1.4,
        }}
      >
        <Box sx={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
          <Typography sx={{ fontSize: '1.6rem', fontWeight: 900, color: '#776E65', lineHeight: 1, letterSpacing: '-0.02em' }}>
            Climate 2048 · Challenge
          </Typography>
          <Typography sx={{ fontSize: '0.8rem', color: '#776E65', opacity: 0.8 }}>
            First to <Box component="span" sx={{ fontWeight: 800 }}>{stageFor(track, target).emoji} {target} ({stageFor(track, target).name})</Box> wins.
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <EcoButton size="small" onClick={startMatch}>Rematch</EcoButton>
          <EcoButton size="small" variant="ghost" onClick={onChangeMode}>Change mode</EcoButton>
        </Box>
      </Box>

      {/* Boards row */}
      <Box
        sx={{
          width: '100%',
          maxWidth: 1280,
          flex: 1,
          minHeight: 0,
          display: 'flex',
          gap: 'clamp(12px, 2vw, 28px)',
          alignItems: 'stretch',
          position: 'relative',
        }}
      >
        <PlayerColumn
          label="Player 1"
          controls="Swipe / W A S D"
          accent="#F59E0B"
          slot={p1}
          track={track}
          target={target}
          onMove={dir => moveFor('p1', dir)}
          winnerLabel={winnerLabel}
        />

        {/* Center divider with VS badge */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
            width: 0,
          }}
        >
          <Box
            sx={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: 52,
              height: 52,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #F59E0B 0%, #0EA5E9 100%)',
              color: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 900,
              fontSize: '1rem',
              letterSpacing: '0.04em',
              boxShadow: '0 6px 18px rgba(15,23,42,0.18)',
              zIndex: 5,
            }}
          >
            VS
          </Box>
        </Box>

        <PlayerColumn
          label="Player 2"
          controls="Swipe / ↑ ↓ ← →"
          accent="#0EA5E9"
          slot={p2}
          track={track}
          target={target}
          onMove={dir => moveFor('p2', dir)}
          winnerLabel={winnerLabel}
          flipped
        />

        {/* Match-end overlay */}
        {phase === 'finished' && winner && (
          <Box
            sx={{
              position: 'absolute',
              inset: 0,
              background: 'rgba(250, 248, 239, 0.88)',
              backdropFilter: 'blur(2px)',
              WebkitBackdropFilter: 'blur(2px)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 50,
              gap: 1.5,
              px: 3,
              textAlign: 'center',
            }}
          >
            <motion.div initial={{ scale: 0.85, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.32, ease: 'easeOut' }}>
              <Typography sx={{ fontSize: 'clamp(1.6rem, 5vh, 2.6rem)', fontWeight: 900, color: '#776E65', lineHeight: 1.05 }}>
                {winnerLabel}
              </Typography>
              <Typography sx={{ mt: 1, color: '#776E65', opacity: 0.85, fontSize: '0.95rem' }}>
                P1 score <Box component="span" sx={{ fontWeight: 800 }}>{p1.state.score.toLocaleString()}</Box> · P2 score <Box component="span" sx={{ fontWeight: 800 }}>{p2.state.score.toLocaleString()}</Box>
              </Typography>
              <Box sx={{ mt: 2.4, display: 'flex', gap: 1.2, justifyContent: 'center', flexWrap: 'wrap' }}>
                <EcoButton onClick={startMatch}>Rematch</EcoButton>
                <EcoButton variant="secondary" onClick={() => setPhase('setup')}>Change target</EcoButton>
                <EcoButton variant="ghost" onClick={onChangeMode}>Change mode</EcoButton>
              </Box>
            </motion.div>
          </Box>
        )}
      </Box>
    </Box>
  );
}
