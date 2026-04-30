import { Box, Typography } from '@mui/material';
import { motion } from 'framer-motion';
import EcoButton from '../../../components/EcoButton';
import type { TechTrack } from '../data';
import { stageFor } from '../data';

interface GameOverModalProps {
  open: boolean;
  won: boolean;
  bestValue: number;
  score: number;
  track: TechTrack;
  onNewGame: () => void;
  onKeepGoing?: () => void;
  onLeaderboard?: () => void;
  onChangeMode?: () => void;
  /** Custom title override (e.g. "Player 1 wins!") */
  titleOverride?: string;
}

export default function GameOverModal({
  open,
  won,
  bestValue,
  score,
  track,
  onNewGame,
  onKeepGoing,
  onLeaderboard,
  onChangeMode,
  titleOverride,
}: GameOverModalProps) {
  if (!open) return null;
  const stage = stageFor(track, bestValue);
  const title = titleOverride ?? (won ? 'Net Zero achieved!' : 'Game over');

  return (
    <Box
      sx={{
        position: 'absolute',
        inset: 0,
        background: won ? 'rgba(237, 194, 46, 0.5)' : 'rgba(238, 228, 218, 0.73)',
        backdropFilter: 'blur(2px)',
        WebkitBackdropFilter: 'blur(2px)',
        borderRadius: 'inherit',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 30,
        textAlign: 'center',
        px: 2,
      }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.28, ease: 'easeOut' }}
      >
        <Typography
          sx={{
            fontSize: 'clamp(1.4rem, 4cqi, 2.2rem)',
            fontWeight: 900,
            color: won ? '#F9F6F2' : '#776E65',
            lineHeight: 1.05,
            textShadow: won ? '0 1px 2px rgba(0,0,0,0.18)' : 'none',
          }}
        >
          {title}
        </Typography>
        <Typography
          sx={{
            mt: 1,
            color: won ? '#F9F6F2' : '#776E65',
            fontSize: '0.95rem',
            opacity: 0.9,
          }}
        >
          Score: <Box component="span" sx={{ fontWeight: 800 }}>{score.toLocaleString()}</Box>
          {' · '}
          Best tech: <Box component="span" sx={{ fontWeight: 800 }}>{stage.emoji} {stage.name}</Box>
        </Typography>

        <Box
          sx={{
            mt: 2.4,
            display: 'flex',
            flexWrap: 'wrap',
            gap: 1.2,
            justifyContent: 'center',
          }}
        >
          {won && onKeepGoing && (
            <EcoButton onClick={onKeepGoing}>Keep going</EcoButton>
          )}
          <EcoButton onClick={onNewGame} variant={won ? 'secondary' : 'primary'}>
            New Game
          </EcoButton>
          {onLeaderboard && (
            <EcoButton variant="secondary" onClick={onLeaderboard}>🏆 Leaderboard</EcoButton>
          )}
          {onChangeMode && (
            <EcoButton variant="ghost" onClick={onChangeMode}>Menu</EcoButton>
          )}
        </Box>
      </motion.div>
    </Box>
  );
}
