import { Box, Typography } from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';

interface StatBoxProps {
  label: string;
  value: string | number;
  delta?: number;
  highlight?: boolean;
  accent?: string;
}

/**
 * A single stat tile, modelled on Climate 2048's `ScoreBox`: small uppercase
 * label, large tabular-numeric value, optional flyaway delta. Kept compact so
 * three or four can sit on one row above the board.
 */
function StatBox({ label, value, delta, highlight, accent }: StatBoxProps) {
  return (
    <Box
      sx={{
        position: 'relative',
        flex: 1,
        minWidth: 70,
        background: highlight ? '#9B59B6' : '#FFFFFF',
        color: highlight ? '#FFFFFF' : '#1A2332',
        border: highlight ? 'none' : '1px solid #E1E6ED',
        borderRadius: 2,
        px: 1.5,
        py: 0.7,
        textAlign: 'center',
        boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
      }}
    >
      <Typography
        sx={{
          fontSize: '0.6rem',
          fontWeight: 800,
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          opacity: 0.78,
          lineHeight: 1.1,
          color: accent ?? 'inherit',
        }}
      >
        {label}
      </Typography>
      <Typography
        sx={{
          fontSize: '1.2rem',
          fontWeight: 800,
          lineHeight: 1.1,
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        {value}
      </Typography>
      <AnimatePresence>
        {delta !== undefined && delta !== 0 ? (
          <motion.div
            key={`${value}-${delta}`}
            initial={{ opacity: 1, y: 0 }}
            animate={{ opacity: 0, y: -28 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8 }}
            style={{
              position: 'absolute',
              top: 6,
              right: 8,
              color: delta > 0 ? (highlight ? '#FFFFFF' : '#0D9B4A') : '#E74C3C',
              fontWeight: 800,
              fontSize: '0.9rem',
              pointerEvents: 'none',
            }}
          >
            {delta > 0 ? `+${delta}` : delta}
          </motion.div>
        ) : null}
      </AnimatePresence>
    </Box>
  );
}

interface HUDProps {
  score: number;
  best: number;
  moves: number;
  matches: number;
  totalPairs: number;
  streak: number;
  scoreDelta?: number;
}

export default function HUD({ score, best, moves, matches, totalPairs, streak, scoreDelta }: HUDProps) {
  return (
    <Box
      sx={{
        display: 'flex',
        gap: 1,
        width: '100%',
        flexWrap: 'wrap',
      }}
    >
      <StatBox label="Score" value={score.toLocaleString()} delta={scoreDelta} highlight />
      <StatBox label="Best" value={best.toLocaleString()} />
      <StatBox label="Moves" value={moves} />
      <StatBox label="Pairs" value={`${matches}/${totalPairs}`} accent="#9B59B6" />
      {streak >= 2 && <StatBox label="Streak" value={`×${streak}`} accent="#F39C12" />}
    </Box>
  );
}
