import { Box, Typography } from '@mui/material';
import { motion } from 'framer-motion';
import EcoButton from '../../../components/EcoButton';

interface Props {
  onResume: () => void;
  onQuit: () => void;
}

export default function PauseMenu({ onResume, onQuit }: Props) {
  return (
    <Box sx={{
      position: 'fixed', inset: 0, zIndex: 100,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'rgba(250,251,252,0.92)', backdropFilter: 'blur(8px)',
    }}>
      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
        <Box sx={{
          p: 5, borderRadius: 3, textAlign: 'center',
          background: '#FFFFFF', backdropFilter: 'blur(16px)',
          border: '1px solid rgba(13,155,74,0.2)',
        }}>
          <Typography variant="h4" sx={{ fontWeight: 800, mb: 4 }}>
            ⏸️ Mission Paused
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <EcoButton onClick={onResume}>Resume</EcoButton>
            <EcoButton onClick={onQuit} variant="ghost">Quit</EcoButton>
          </Box>
        </Box>
      </motion.div>
    </Box>
  );
}
