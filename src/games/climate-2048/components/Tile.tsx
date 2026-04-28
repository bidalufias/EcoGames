import { Box } from '@mui/material';
import { motion } from 'framer-motion';
import type { Tile as TileType } from '../engine';
import { paletteFor, stageFor, type TechTrack } from '../data';

interface TileProps {
  tile: TileType;
  size: number; // grid size (e.g. 4)
  track: TechTrack;
  gapPct: number; // % of cell that is gap on each side
}

// Tiles are positioned via top/left percentages of the board, so they scale
// with whatever size the board is rendered at. framer-motion's animate prop on
// a stable React key gives us free slide tweens.
export default function Tile({ tile, size, track, gapPct }: TileProps) {
  const cellPct = 100 / size;
  const innerPct = cellPct - gapPct * 2;
  const palette = paletteFor(tile.value);
  const stage = stageFor(track, tile.value);

  return (
    <motion.div
      initial={{
        scale: tile.isNew ? 0 : 1,
      }}
      animate={{
        top: `${tile.row * cellPct + gapPct}%`,
        left: `${tile.col * cellPct + gapPct}%`,
        scale: tile.isMerged ? [1, 1.12, 1] : 1,
      }}
      transition={{
        top: { type: 'tween', duration: 0.14, ease: 'easeOut' },
        left: { type: 'tween', duration: 0.14, ease: 'easeOut' },
        scale: tile.isMerged
          ? { duration: 0.22, times: [0, 0.5, 1] }
          : tile.isNew
            ? { type: 'spring', stiffness: 360, damping: 22, delay: 0.08 }
            : { duration: 0 },
      }}
      style={{
        position: 'absolute',
        width: `${innerPct}%`,
        height: `${innerPct}%`,
        zIndex: tile.isMerged ? 20 : 10,
      }}
    >
      <Box
        sx={{
          width: '100%',
          height: '100%',
          borderRadius: '6px',
          background: palette.bg,
          color: palette.fg,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          boxShadow: '0 1px 2px rgba(0,0,0,0.08)',
          overflow: 'hidden',
        }}
      >
        {/* Corner number — always visible so the value is unambiguous */}
        <Box
          sx={{
            position: 'absolute',
            top: '6%',
            left: '8%',
            fontSize: 'clamp(0.6rem, 1.6cqi, 0.85rem)',
            fontWeight: 800,
            letterSpacing: '0.02em',
            opacity: 0.78,
            lineHeight: 1,
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          {tile.value}
        </Box>

        {/* Center emoji. Explicit emoji font stack first — on iOS Safari,
            relying on auto-fallback from Inter occasionally leaves the glyph
            unrendered, especially when CSS filters are in play. */}
        <Box
          sx={{
            fontSize: 'clamp(1.6rem, 7cqi, 3.2rem)',
            lineHeight: 1,
            mt: '4%',
            fontFamily: '"Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif',
          }}
        >
          {stage.emoji}
        </Box>

        {/* Stage name */}
        <Box
          sx={{
            mt: '4%',
            px: '6%',
            fontSize: 'clamp(0.45rem, 1.5cqi, 0.78rem)',
            fontWeight: 800,
            letterSpacing: '0.04em',
            textTransform: 'uppercase',
            textAlign: 'center',
            lineHeight: 1.1,
            opacity: 0.92,
          }}
        >
          {stage.name}
        </Box>
      </Box>
    </motion.div>
  );
}
