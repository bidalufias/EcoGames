import { Box, Typography } from '@mui/material';
import { motion } from 'framer-motion';

interface PlayerHUDProps {
  label: string;
  emoji: string;
  accent: string;
  matches: number;
  score: number;
  isActive: boolean;
  /** When true the entire panel is rotated 180° so a player on the far side
   *  of a tabletop iPad reads it right-side up. */
  flipped?: boolean;
}

const EMOJI_FONT = '"Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif';

/**
 * One-row player panel: identity chip on the left, score + matches on the
 * right, a glowing "Your turn" pulse when active. Two of these stack around
 * the shared board in Versus mode (top one rotated for the second player).
 */
export default function PlayerHUD({
  label,
  emoji,
  accent,
  matches,
  score,
  isActive,
  flipped,
}: PlayerHUDProps) {
  return (
    <Box
      sx={{
        width: '100%',
        transform: flipped ? 'rotate(180deg)' : 'none',
        transformOrigin: 'center',
      }}
    >
      <motion.div
        animate={{
          boxShadow: isActive
            ? [`0 0 0 0px ${accent}55`, `0 0 0 6px ${accent}11`, `0 0 0 0px ${accent}55`]
            : '0 1px 2px rgba(0,0,0,0.04)',
        }}
        transition={
          isActive
            ? { duration: 1.6, repeat: Infinity, ease: 'easeInOut' }
            : { duration: 0.2 }
        }
        style={{ borderRadius: 12 }}
      >
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1.2,
            px: 1.5,
            py: 0.9,
            borderRadius: 2,
            background: '#FFFFFF',
            border: `2px solid ${isActive ? accent : '#E1E6ED'}`,
            transition: 'border-color 0.2s, opacity 0.2s',
            opacity: isActive ? 1 : 0.7,
          }}
        >
          <Box
            sx={{
              width: 38,
              height: 38,
              borderRadius: '50%',
              background: `${accent}1A`,
              color: accent,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.2rem',
              flexShrink: 0,
              fontFamily: EMOJI_FONT,
            }}
          >
            {emoji}
          </Box>
          <Box sx={{ minWidth: 0, flex: 1 }}>
            <Typography
              sx={{
                fontSize: '0.7rem',
                fontWeight: 800,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                color: accent,
                lineHeight: 1.1,
              }}
            >
              {label}
              {isActive && (
                <Box
                  component="span"
                  sx={{ ml: 0.8, color: '#1A2332', opacity: 0.55, letterSpacing: '0.08em' }}
                >
                  · your turn
                </Box>
              )}
            </Typography>
            <Typography
              sx={{
                fontSize: '0.95rem',
                fontWeight: 800,
                lineHeight: 1.15,
                color: '#1A2332',
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              {matches} pairs · {score.toLocaleString()} pts
            </Typography>
          </Box>
        </Box>
      </motion.div>
    </Box>
  );
}
