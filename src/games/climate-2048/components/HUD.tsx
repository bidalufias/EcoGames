import { Box, Typography } from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import type { TechTrack } from '../data';

interface ScoreBoxProps {
  label: string;
  value: number;
  delta?: number;
  highlight?: boolean;
}

function ScoreBox({ label, value, delta, highlight }: ScoreBoxProps) {
  return (
    <Box
      sx={{
        position: 'relative',
        background: highlight ? '#776E65' : '#BBADA0',
        color: '#FFFFFF',
        borderRadius: '6px',
        px: 1.5,
        py: 0.6,
        minWidth: 76,
        textAlign: 'center',
        boxShadow: '0 1px 2px rgba(0,0,0,0.06)',
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
        }}
      >
        {label}
      </Typography>
      <Typography
        sx={{
          fontSize: '1.25rem',
          fontWeight: 800,
          lineHeight: 1.1,
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        {value.toLocaleString()}
      </Typography>
      <AnimatePresence>
        {delta && delta > 0 ? (
          <motion.div
            key={`${value}-${delta}`}
            initial={{ opacity: 1, y: 0 }}
            animate={{ opacity: 0, y: -28 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.7 }}
            style={{
              position: 'absolute',
              top: 6,
              right: 8,
              color: '#776E65',
              fontWeight: 800,
              fontSize: '0.95rem',
              pointerEvents: 'none',
            }}
          >
            +{delta}
          </motion.div>
        ) : null}
      </AnimatePresence>
    </Box>
  );
}

interface HUDProps {
  title: string;
  subtitle: string;
  score: number;
  best: number;
  scoreDelta?: number;
  track: TechTrack;
  compact?: boolean;
}

export default function HUD({ title, subtitle, score, best, scoreDelta, track, compact }: HUDProps) {
  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        gap: 2,
        width: '100%',
        flexWrap: 'wrap',
      }}
    >
      <Box sx={{ minWidth: 0 }}>
        <Typography
          sx={{
            fontSize: compact ? '1.6rem' : '2.2rem',
            fontWeight: 900,
            lineHeight: 1,
            color: '#776E65',
            letterSpacing: '-0.02em',
          }}
        >
          {title}
        </Typography>
        <Typography
          sx={{
            mt: 0.4,
            fontSize: compact ? '0.7rem' : '0.82rem',
            color: '#776E65',
            opacity: 0.85,
            lineHeight: 1.3,
          }}
        >
          {subtitle}
        </Typography>
        <Box
          sx={{
            mt: 0.6,
            display: 'inline-flex',
            alignItems: 'center',
            gap: 0.6,
            px: 1,
            py: 0.25,
            borderRadius: '999px',
            background: `${track.accent}1F`,
            color: track.accent,
            fontSize: '0.7rem',
            fontWeight: 800,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
          }}
        >
          <Box component="span">{track.emoji}</Box>
          {track.short}
        </Box>
      </Box>

      <Box sx={{ display: 'flex', gap: 1 }}>
        <ScoreBox label="Score" value={score} delta={scoreDelta} highlight />
        <ScoreBox label="Best" value={best} />
      </Box>
    </Box>
  );
}
