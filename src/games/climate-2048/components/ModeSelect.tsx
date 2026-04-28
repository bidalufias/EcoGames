import { Box, Typography } from '@mui/material';
import { motion } from 'framer-motion';
import EcoButton from '../../../components/EcoButton';

export type Mode = 'solo' | 'challenge';

interface ModeSelectProps {
  onPick: (mode: Mode) => void;
  onBack?: () => void;
}

interface ModeCardProps {
  mode: Mode;
  title: string;
  tagline: string;
  emoji: string;
  accent: string;
  bullets: string[];
  onPick: () => void;
}

function ModeCard({ title, tagline, emoji, accent, bullets, onPick }: ModeCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      style={{ flex: 1, display: 'flex', minWidth: 0 }}
    >
      <Box
        onClick={onPick}
        sx={{
          flex: 1,
          cursor: 'pointer',
          background: '#FFFFFF',
          border: `2px solid ${accent}33`,
          borderRadius: 4,
          p: 3,
          display: 'flex',
          flexDirection: 'column',
          gap: 1.5,
          boxShadow: '0 8px 28px rgba(15,23,42,0.06)',
          transition: 'border-color 0.2s, box-shadow 0.2s',
          '&:hover': {
            borderColor: accent,
            boxShadow: `0 12px 36px ${accent}33`,
          },
        }}
      >
        <Box
          sx={{
            width: 60,
            height: 60,
            borderRadius: 3,
            background: `${accent}1A`,
            color: accent,
            fontSize: '2rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {emoji}
        </Box>
        <Typography sx={{ fontSize: '1.35rem', fontWeight: 800, color: '#1A2332', lineHeight: 1.1 }}>
          {title}
        </Typography>
        <Typography sx={{ color: '#5A6A7E', fontSize: '0.92rem', lineHeight: 1.45 }}>
          {tagline}
        </Typography>
        <Box component="ul" sx={{ pl: 2.4, m: 0, mt: 0.5 }}>
          {bullets.map(b => (
            <Typography
              key={b}
              component="li"
              sx={{ color: '#475569', fontSize: '0.85rem', lineHeight: 1.5, mb: 0.25 }}
            >
              {b}
            </Typography>
          ))}
        </Box>
        <Box sx={{ mt: 'auto', pt: 1 }}>
          <EcoButton onClick={onPick}>Choose →</EcoButton>
        </Box>
      </Box>
    </motion.div>
  );
}

export default function ModeSelect({ onPick, onBack }: ModeSelectProps) {
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
      <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }}>
        <Typography
          sx={{
            fontSize: 'clamp(1.8rem, 4vh, 2.6rem)',
            fontWeight: 900,
            color: '#776E65',
            textAlign: 'center',
            letterSpacing: '-0.02em',
            lineHeight: 1,
          }}
        >
          Climate 2048
        </Typography>
        <Typography
          sx={{
            mt: 1,
            color: '#776E65',
            opacity: 0.8,
            fontSize: '0.95rem',
            textAlign: 'center',
            maxWidth: 520,
          }}
        >
          Pick how you want to play. Both modes use the classic 2048 rules — merge tiles to climb the tech tree.
        </Typography>
      </motion.div>

      <Box
        sx={{
          mt: 4,
          width: '100%',
          maxWidth: 820,
          display: 'flex',
          gap: 3,
          alignItems: 'stretch',
        }}
      >
        <ModeCard
          mode="solo"
          title="Solo"
          tagline="Play the classic 2048 — at your own pace."
          emoji="🎯"
          accent="#F59E0B"
          bullets={[
            'One board, no timer',
            'Reach Net Zero (4096) to win',
            'Submit your score to the global leaderboard',
          ]}
          onPick={() => onPick('solo')}
        />
        <ModeCard
          mode="challenge"
          title="Challenge"
          tagline="Two players, split-screen race."
          emoji="⚔️"
          accent="#0EA5E9"
          bullets={[
            'Two boards side-by-side on one screen',
            'First to reach the target tile wins',
            'Player 1: WASD · Player 2: Arrow keys',
          ]}
          onPick={() => onPick('challenge')}
        />
      </Box>

      {onBack && (
        <Box sx={{ mt: 4 }}>
          <EcoButton variant="ghost" onClick={onBack}>← Back</EcoButton>
        </Box>
      )}
    </Box>
  );
}
