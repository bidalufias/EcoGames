import { Box, Typography } from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import EcoButton from '../../../components/EcoButton';
import LeaderboardPanel from '../../../components/LeaderboardPanel';
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
import { BOARD_SIZE, WIN_VALUE, paletteFor, stageFor, type Stage, type TechTrack } from '../data';

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
  // Stages whose tiles have appeared on the board at least once this round.
  // Persisted in match order so the side stack reads top-to-bottom newest-first
  // even after the underlying tiles merge away.
  const [unlocked, setUnlocked] = useState<Stage[]>([]);

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

  // Watch the board for new tile values. The first time a value appears on
  // the board, push its stage onto the unlocked list so the side stack
  // grows as the player progresses through the tech tree.
  useEffect(() => {
    setUnlocked(prev => {
      const have = new Set(prev.map(s => s.value));
      const additions: Stage[] = [];
      for (const t of state.tiles) {
        if (!have.has(t.value)) {
          have.add(t.value);
          additions.push(stageFor(track, t.value));
        }
      }
      if (additions.length === 0) return prev;
      // Order additions by ascending value so a single move that spawns a
      // new tile and merges to a higher one logs them low-to-high (which
      // becomes top-to-bottom newest-first when reversed for display).
      additions.sort((a, b) => a.value - b.value);
      return [...prev, ...additions];
    });
  }, [state.tiles, track]);

  const newGame = useCallback(() => {
    idGenRef.current = makeIdGen();
    setState({ ...startBoard(BOARD_SIZE, idGenRef.current), best: persistedBest });
    setShowWin(false);
    setShowOver(false);
    setSubmitted(false);
    setScoreDelta(undefined);
    setUnlocked([]);
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
          <EcoButton onClick={() => { setShowLeaderboard(false); newGame(); }}>Play again</EcoButton>
          <EcoButton variant="ghost" onClick={onChangeMode}>Menu</EcoButton>
        </Box>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        height: '100%',
        bgcolor: '#FAF8EF',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        // Climate2048Game hides the global header during play, so the action
        // row sits flush at the top.
        px: 'clamp(12px, 2.5cqw, 28px)',
        py: 'clamp(10px, 2cqh, 22px)',
        overflow: 'hidden',
      }}
    >
      {/* HUD on top, then the play row (board + persistent fact stack) below.
          Wider cap than before so the side stack has room without crushing
          the board on tablet-sized stages. */}
      <Box sx={{ width: '100%', maxWidth: 820, flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', gap: 1.4 }}>
        <HUD
          title="Climate 2048"
          subtitle={subtitle}
          score={state.score}
          best={persistedBest}
          scoreDelta={scoreDelta}
          track={track}
        />
        <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end', flexShrink: 0 }}>
          <EcoButton size="small" onClick={newGame}>New Game</EcoButton>
          <EcoButton size="small" variant="ghost" onClick={onChangeMode}>Menu</EcoButton>
        </Box>

        {/* Play row — board on the left, persistent fact stack on the right.
            Putting facts in the empty corridor next to the board means players
            can re-read the tech they've unlocked without covering any tiles. */}
        <Box
          sx={{
            flex: 1,
            minHeight: 0,
            minWidth: 0,
            display: 'flex',
            flexDirection: 'row',
            gap: 'clamp(10px, 2cqmin, 18px)',
            alignItems: 'stretch',
          }}
        >
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
                    <EcoButton size="small" onClick={newGame}>New Game</EcoButton>
                    <EcoButton size="small" variant="ghost" onClick={onChangeMode}>Menu</EcoButton>
                  </Box>
                </Box>
              )}
            </Box>
          </Box>

          <FactStack unlocked={unlocked} />
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

interface FactStackProps {
  unlocked: Stage[];
  flipped?: boolean;
}

/**
 * Persistent side panel of tech facts. Each new tile value the player reaches
 * pushes that stage onto the stack (newest at the top). Facts stay readable
 * for the rest of the round, so a player who didn't catch the blurb when the
 * tile first appeared can scroll back to it. The `flipped` variant rotates
 * 180° for the player on the far side of a tabletop iPad in Challenge mode.
 */
export function FactStack({ unlocked, flipped }: FactStackProps) {
  const items = unlocked.slice().reverse();
  return (
    <Box
      sx={{
        flexShrink: 0,
        width: 'clamp(160px, 22cqw, 260px)',
        display: 'flex',
        flexDirection: 'column',
        minHeight: 0,
        transform: flipped ? 'rotate(180deg)' : 'none',
        transformOrigin: 'center',
      }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'baseline',
          justifyContent: 'space-between',
          gap: 1,
          mb: 'clamp(4px, 0.8cqh, 7px)',
          flexShrink: 0,
        }}
      >
        <Typography
          component="span"
          sx={{
            color: '#776E65',
            fontSize: 'clamp(0.6rem, 1.4cqh, 0.72rem)',
            fontWeight: 800,
            letterSpacing: '0.16em',
            textTransform: 'uppercase',
          }}
        >
          Tech unlocked
        </Typography>
        <Typography
          component="span"
          sx={{
            color: '#A39A8C',
            fontSize: 'clamp(0.6rem, 1.4cqh, 0.72rem)',
            fontWeight: 600,
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          {unlocked.length}
        </Typography>
      </Box>
      <Box
        sx={{
          flex: 1,
          minHeight: 0,
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: 'clamp(5px, 1cqh, 8px)',
          pr: 'clamp(2px, 0.6cqmin, 6px)',
        }}
      >
        {items.length === 0 ? (
          <Box
            sx={{
              border: '1px dashed #D7CDBE',
              borderRadius: 'clamp(8px, 1.6cqmin, 12px)',
              p: 'clamp(8px, 1.6cqmin, 12px)',
              color: '#A39A8C',
              fontSize: 'clamp(0.7rem, 1.5cqh, 0.78rem)',
              fontStyle: 'italic',
              lineHeight: 1.4,
              textAlign: 'center',
            }}
          >
            Reach a new tile to unlock its tech here.
          </Box>
        ) : (
          <AnimatePresence initial={false}>
            {items.map(stage => {
              const palette = paletteFor(stage.value);
              return (
                <motion.div
                  key={stage.value}
                  layout
                  initial={{ opacity: 0, y: -10, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
                >
                  <Box
                    sx={{
                      px: 'clamp(8px, 1.6cqmin, 12px)',
                      py: 'clamp(6px, 1.2cqh, 10px)',
                      borderRadius: 'clamp(8px, 1.6cqmin, 12px)',
                      background: '#FFFFFF',
                      border: '1px solid #E8DFD2',
                      borderLeft: `3px solid ${palette.bg}`,
                      boxShadow: '0 1px 2px rgba(118, 110, 101, 0.06)',
                    }}
                  >
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 'clamp(5px, 1cqmin, 8px)',
                        mb: 'clamp(2px, 0.5cqh, 4px)',
                      }}
                    >
                      <Box
                        component="span"
                        aria-hidden
                        sx={{
                          fontFamily: '"Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif',
                          fontSize: 'clamp(0.85rem, 1.9cqh, 1.05rem)',
                          lineHeight: 1,
                        }}
                      >
                        {stage.emoji}
                      </Box>
                      <Typography
                        component="span"
                        sx={{
                          color: '#776E65',
                          fontSize: 'clamp(0.72rem, 1.6cqh, 0.84rem)',
                          fontWeight: 800,
                          letterSpacing: '-0.005em',
                          lineHeight: 1.15,
                        }}
                      >
                        {stage.name}
                      </Typography>
                      <Typography
                        component="span"
                        sx={{
                          ml: 'auto',
                          color: '#A39A8C',
                          fontSize: 'clamp(0.6rem, 1.3cqh, 0.7rem)',
                          fontWeight: 700,
                          fontVariantNumeric: 'tabular-nums',
                          flexShrink: 0,
                        }}
                      >
                        {stage.value}
                      </Typography>
                    </Box>
                    <Typography
                      sx={{
                        color: '#5A5249',
                        fontSize: 'clamp(0.66rem, 1.45cqh, 0.76rem)',
                        fontWeight: 500,
                        lineHeight: 1.4,
                      }}
                    >
                      {stage.fact}
                    </Typography>
                  </Box>
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}
      </Box>
    </Box>
  );
}
