import { Box, Typography } from '@mui/material';
import { motion } from 'framer-motion';
import EcoButton from '../../../components/EcoButton';
import { TECH_TRACKS, type TechTrack } from '../data';

interface TechSelectProps {
  onPick: (track: TechTrack) => void;
  onBack: () => void;
  modeLabel: string;
}

function TechCard({ track, onPick }: { track: TechTrack; onPick: () => void }) {
  const disabled = !track.available;
  return (
    <motion.div
      whileHover={!disabled ? { y: -4 } : undefined}
      style={{ flex: 1, display: 'flex', minWidth: 0 }}
    >
      <Box
        onClick={!disabled ? onPick : undefined}
        sx={{
          flex: 1,
          cursor: disabled ? 'not-allowed' : 'pointer',
          background: '#FFFFFF',
          border: `2px solid ${disabled ? '#E2E8F0' : `${track.accent}33`}`,
          borderRadius: 4,
          p: 2.5,
          opacity: disabled ? 0.55 : 1,
          display: 'flex',
          flexDirection: 'column',
          gap: 1,
          boxShadow: disabled ? 'none' : '0 6px 20px rgba(15,23,42,0.06)',
          position: 'relative',
          transition: 'border-color 0.2s, box-shadow 0.2s',
          '&:hover': !disabled
            ? { borderColor: track.accent, boxShadow: `0 10px 28px ${track.accent}33` }
            : {},
        }}
      >
        {disabled && (
          <Box
            sx={{
              position: 'absolute',
              top: 10,
              right: 10,
              fontSize: '0.62rem',
              fontWeight: 800,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              color: '#94A3B8',
              background: '#F1F5F9',
              border: '1px solid #E2E8F0',
              borderRadius: '999px',
              px: 1,
              py: 0.3,
            }}
          >
            Coming soon
          </Box>
        )}
        <Box
          sx={{
            width: 54,
            height: 54,
            borderRadius: 2.5,
            background: `${track.accent}1A`,
            color: track.accent,
            fontSize: '1.7rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {track.emoji}
        </Box>
        <Typography sx={{ fontSize: '1.15rem', fontWeight: 800, color: '#1A2332', lineHeight: 1.1 }}>
          {track.name}
        </Typography>
        <Typography sx={{ color: '#5A6A7E', fontSize: '0.85rem', lineHeight: 1.45 }}>
          {track.description}
        </Typography>
      </Box>
    </motion.div>
  );
}

export default function TechSelect({ onPick, onBack, modeLabel }: TechSelectProps) {
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
      <Typography
        sx={{
          fontSize: '0.78rem',
          fontWeight: 800,
          letterSpacing: '0.18em',
          textTransform: 'uppercase',
          color: '#A39A8C',
        }}
      >
        {modeLabel} · pick a technology
      </Typography>
      <Typography
        sx={{
          mt: 0.5,
          fontSize: 'clamp(1.6rem, 3.6vh, 2.3rem)',
          fontWeight: 900,
          color: '#776E65',
          textAlign: 'center',
          lineHeight: 1,
        }}
      >
        Choose your climate tech
      </Typography>
      <Typography
        sx={{
          mt: 1.2,
          color: '#776E65',
          opacity: 0.78,
          fontSize: '0.92rem',
          textAlign: 'center',
          maxWidth: 560,
        }}
      >
        Each track has 12 stages — from a single component to a Net-Zero deployment. Solar is ready to play; the others are coming soon.
      </Typography>

      <Box
        sx={{
          mt: 3.5,
          width: '100%',
          maxWidth: 1080,
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: 2.5,
        }}
      >
        {TECH_TRACKS.map(t => (
          <TechCard key={t.id} track={t} onPick={() => onPick(t)} />
        ))}
      </Box>

      <Box sx={{ mt: 4 }}>
        <EcoButton variant="ghost" onClick={onBack}>← Back</EcoButton>
      </Box>
    </Box>
  );
}
