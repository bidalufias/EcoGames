import { Box, Typography, Grid } from '@mui/material';
import { motion } from 'framer-motion';
import type { GameMode } from '../types';
import EcoButton from '../../../components/EcoButton';

interface Props {
  onSelectMode: (mode: GameMode, speed: number) => void;
}

const modes: { mode: GameMode; icon: string; title: string; desc: string }[] = [
  { mode: '1p', icon: '👤', title: 'Solo Mission', desc: 'Slash GHGs solo and beat your high score' },
  { mode: '2p', icon: '👥', title: 'Versus (2P)', desc: 'Face-to-face split screen duel' },
  { mode: '4p', icon: '👥👥', title: 'Battle Royale (4P)', desc: '4-player quadrant chaos' },
  { mode: 'champion', icon: '👑', title: 'Champion', desc: 'Winner stays, challengers queue' },
];

const speeds = [0.5, 0.75, 1, 1.25, 1.5];

export default function StartScreen({ onSelectMode }: Props) {
  return (
    <Box sx={{
      minHeight: '100%', bgcolor: '#FAFBFC', color: '#1A2332',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      px: 3, py: 4,
    }}>
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <Typography variant="h4" align="center" sx={{
          background: 'linear-gradient(135deg, #8BC53F, #007DC4)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          fontWeight: 800, mb: 1,
        }}>
          🥷 Climate Ninja
        </Typography>
        <Typography align="center" sx={{ color: '#5A6A7E', mb: 4 }}>
          Slice through greenhouse gases!
        </Typography>
      </motion.div>

      <Typography variant="h6" sx={{ mb: 2 }}>Select Mission</Typography>
      <Grid container spacing={2} sx={{ maxWidth: 800, mb: 4 }}>
        {modes.map((m, i) => (
          <Grid size={{ xs: 12, sm: 6 }} key={m.mode}>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
              <Box onClick={() => onSelectMode(m.mode, 1)} sx={{
                p: 3, borderRadius: 3, cursor: 'pointer', textAlign: 'center',
                background: '#FFFFFF', backdropFilter: 'blur(16px)',
                border: '1px solid rgba(13,155,74,0.15)',
                transition: 'all 0.3s',
                '&:hover': {
                  borderColor: '#8BC53F', boxShadow: '0 0 30px rgba(13,155,74,0.2)',
                  transform: 'scale(1.02)',
                },
              }}>
                <Typography sx={{ fontSize: 48, mb: 1 }}>{m.icon}</Typography>
                <Typography variant="h6" sx={{ fontWeight: 700 }}>{m.title}</Typography>
                <Typography variant="body2" sx={{ color: '#5A6A7E' }}>{m.desc}</Typography>
              </Box>
            </motion.div>
          </Grid>
        ))}
      </Grid>

      <Typography variant="body2" sx={{ color: '#5A6A7E', mb: 1 }}>Speed (quick select)</Typography>
      <Box sx={{ display: 'flex', gap: 1, mb: 4 }}>
        {speeds.map(s => (
          <EcoButton key={s} variant="secondary" size="small" onClick={() => onSelectMode('1p', s)}>
            {s}x
          </EcoButton>
        ))}
      </Box>
    </Box>
  );
}