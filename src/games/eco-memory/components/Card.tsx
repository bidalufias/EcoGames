import { Box } from '@mui/material';
import { motion } from 'framer-motion';
import type { CardDef, CardState } from '../engine';

interface CardProps {
  def: CardDef;
  state: CardState;
  onClick: () => void;
  disabled?: boolean;
}

// Emoji stack matches the Climate 2048 fix in 638e36f — on iOS Safari, relying
// on Inter to fall back to the system emoji font occasionally leaves the glyph
// unrendered (especially with CSS filters). Listing the colour-emoji fonts
// first guarantees a glyph.
const EMOJI_FONT = '"Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif';

/**
 * A flip-style memory card. The back and face are stacked in a 3D scene; the
 * inner wrapper rotates 180° on flip. We use container queries so the type
 * scales with the card's own width, not the viewport.
 */
export default function Card({ def, state, onClick, disabled }: CardProps) {
  const { flipped, matched } = state;
  const isOpen = flipped || matched;

  return (
    <Box
      onClick={() => {
        if (!disabled && !flipped && !matched) onClick();
      }}
      role="button"
      aria-label={isOpen ? `${def.label} — ${def.side}` : 'Hidden card'}
      aria-pressed={isOpen}
      tabIndex={disabled || matched ? -1 : 0}
      onKeyDown={e => {
        if ((e.key === 'Enter' || e.key === ' ') && !disabled && !flipped && !matched) {
          e.preventDefault();
          onClick();
        }
      }}
      sx={{
        position: 'relative',
        aspectRatio: '1 / 1',
        cursor: matched ? 'default' : disabled ? 'wait' : 'pointer',
        perspective: '1000px',
        containerType: 'inline-size',
        outline: 'none',
        '&:focus-visible > div': {
          boxShadow: '0 0 0 3px rgba(155, 89, 182, 0.45)',
          borderRadius: 8,
        },
      }}
    >
      <motion.div
        animate={{
          rotateY: isOpen ? 180 : 0,
          scale: matched ? 0.94 : 1,
        }}
        transition={{
          rotateY: { type: 'spring', stiffness: 260, damping: 24 },
          scale: { duration: 0.25 },
        }}
        style={{
          width: '100%',
          height: '100%',
          position: 'relative',
          transformStyle: 'preserve-3d',
        }}
      >
        {/* Back face — visible when rotateY = 0 */}
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            borderRadius: 2,
            backfaceVisibility: 'hidden',
            WebkitBackfaceVisibility: 'hidden',
            background: 'linear-gradient(135deg, #FFFFFF 0%, #F0F3F7 100%)',
            border: '2px solid #D0D7E0',
            boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
          }}
        >
          {/* Decorative pattern: tilted "?" with a soft brand gradient ring */}
          <Box
            sx={{
              position: 'absolute',
              inset: '12%',
              borderRadius: '50%',
              background: 'radial-gradient(circle at 30% 30%, rgba(155, 89, 182, 0.10), transparent 65%)',
            }}
          />
          <Box
            sx={{
              fontSize: 'clamp(1.4rem, 18cqi, 3rem)',
              fontWeight: 900,
              color: '#9B59B6',
              opacity: 0.55,
              fontFamily: EMOJI_FONT,
              transform: 'rotate(-8deg)',
            }}
          >
            ?
          </Box>
        </Box>

        {/* Front face — rotated 180° so it shows when the card is flipped */}
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            borderRadius: 2,
            backfaceVisibility: 'hidden',
            WebkitBackfaceVisibility: 'hidden',
            transform: 'rotateY(180deg)',
            background: matched ? `${def.color}12` : '#FFFFFF',
            border: `2px solid ${def.color}`,
            boxShadow: matched
              ? `0 0 0 1px ${def.color}30 inset, 0 2px 10px ${def.color}20`
              : `0 2px 10px ${def.color}25`,
            opacity: matched ? 0.78 : 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
            p: '6%',
            transition: 'opacity 0.25s, background 0.25s',
          }}
        >
          <Box
            sx={{
              fontSize: 'clamp(1.4rem, 28cqi, 3rem)',
              lineHeight: 1,
              fontFamily: EMOJI_FONT,
            }}
          >
            {def.emoji}
          </Box>
          <Box
            sx={{
              mt: '6%',
              fontSize: 'clamp(0.55rem, 8cqi, 0.85rem)',
              fontWeight: 800,
              color: def.color,
              textAlign: 'center',
              lineHeight: 1.15,
              maxWidth: '100%',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              letterSpacing: '0.02em',
            }}
          >
            {def.label}
          </Box>
        </Box>
      </motion.div>
    </Box>
  );
}
