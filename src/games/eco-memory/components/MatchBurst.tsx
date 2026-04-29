import { Box } from '@mui/material';
import { motion } from 'framer-motion';

interface MatchBurstProps {
  /** Position as % of the parent positioning context (the board wrapper). */
  x: number;
  y: number;
  points: number;
  color: string;
  onDone: () => void;
}

/**
 * Floating "+125" popup that drifts up from the centroid of a matched pair.
 * Mirrors the HUD's score-delta flyaway but anchored to the board so the player
 * feels the points earned at the location where they earned them.
 */
export default function MatchBurst({ x, y, points, color, onDone }: MatchBurstProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 0, scale: 0.6 }}
      animate={{ opacity: [0, 1, 1, 0], y: -56, scale: [0.6, 1.15, 1, 0.95] }}
      transition={{ duration: 0.95, times: [0, 0.2, 0.7, 1], ease: 'easeOut' }}
      onAnimationComplete={onDone}
      style={{
        position: 'absolute',
        left: `${x}%`,
        top: `${y}%`,
        transform: 'translate(-50%, -50%)',
        pointerEvents: 'none',
        zIndex: 25,
      }}
    >
      <Box
        sx={{
          px: 1.2,
          py: 0.4,
          borderRadius: 999,
          background: '#FFFFFF',
          border: `2px solid ${color}`,
          color,
          fontSize: 'clamp(0.95rem, 3.4cqw, 1.4rem)',
          fontWeight: 900,
          boxShadow: `0 4px 14px ${color}44`,
          fontVariantNumeric: 'tabular-nums',
          letterSpacing: '0.02em',
        }}
      >
        +{points}
      </Box>
    </motion.div>
  );
}
