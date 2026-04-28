import { Box } from '@mui/material';
import { useCallback, useRef } from 'react';
import type { BoardState, Direction } from '../engine';
import type { TechTrack } from '../data';
import Tile from './Tile';

interface BoardProps {
  state: BoardState;
  track: TechTrack;
  onMove?: (dir: Direction) => void;
  /** Set a px maxWidth/maxHeight if you want to clamp the board size. */
  maxSize?: number;
  /** Disable input (e.g. on game-over overlay). */
  disabled?: boolean;
  /** When the board is being viewed rotated 180° (e.g. by the player on the
   *  far side of a tabletop), invert both swipe axes so a swipe in their
   *  perceived direction sends the right command to the engine. */
  invertGestures?: boolean;
}

const GAP_PCT = 1.6; // percent gap on each side of a tile within its cell

export default function Board({ state, track, onMove, maxSize, disabled, invertGestures }: BoardProps) {
  const touchStart = useRef<{ x: number; y: number } | null>(null);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  }, []);

  const handleTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      if (disabled || !onMove || !touchStart.current) return;
      let dx = e.changedTouches[0].clientX - touchStart.current.x;
      let dy = e.changedTouches[0].clientY - touchStart.current.y;
      touchStart.current = null;
      if (Math.max(Math.abs(dx), Math.abs(dy)) < 24) return;
      if (invertGestures) { dx = -dx; dy = -dy; }
      if (Math.abs(dx) > Math.abs(dy)) onMove(dx > 0 ? 'right' : 'left');
      else onMove(dy > 0 ? 'down' : 'up');
    },
    [onMove, disabled, invertGestures],
  );

  const cellPct = 100 / state.size;

  return (
    <Box
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      sx={{
        position: 'relative',
        width: '100%',
        aspectRatio: '1 / 1',
        // Cap to both the parent's width AND its height so the board shrinks
        // to fit short viewports (e.g. iPad landscape) instead of overflowing.
        maxWidth: maxSize ? `min(${maxSize}px, 100%)` : '100%',
        maxHeight: maxSize ? `min(${maxSize}px, 100%)` : '100%',
        background: '#BBADA0',
        borderRadius: '8px',
        padding: '1.6%',
        boxSizing: 'border-box',
        touchAction: 'none',
        userSelect: 'none',
        containerType: 'inline-size',
        overflow: 'hidden',
      }}
    >
      {/* Inner positioning surface — tiles are positioned via % of this box */}
      <Box sx={{ position: 'relative', width: '100%', height: '100%' }}>
        {/* Empty cell grid */}
        {Array.from({ length: state.size }).map((_, r) =>
          Array.from({ length: state.size }).map((_, c) => (
            <Box
              key={`empty-${r}-${c}`}
              sx={{
                position: 'absolute',
                top: `${r * cellPct + GAP_PCT}%`,
                left: `${c * cellPct + GAP_PCT}%`,
                width: `${cellPct - GAP_PCT * 2}%`,
                height: `${cellPct - GAP_PCT * 2}%`,
                background: '#CDC1B4',
                borderRadius: '6px',
              }}
            />
          )),
        )}

        {/* Active tiles, keyed by stable id so framer-motion can tween moves */}
        {state.tiles.map(tile => (
          <Tile key={tile.id} tile={tile} size={state.size} track={track} gapPct={GAP_PCT} />
        ))}
      </Box>
    </Box>
  );
}
