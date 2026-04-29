import { useState } from 'react';
import { Box, Typography } from '@mui/material';
import { motion } from 'framer-motion';
import EcoButton from '../../../components/EcoButton';

interface Props {
  championName: string;
  streak: number;
  onSubmit: (name: string) => void;
}

export default function ChallengerNameEntry({ championName, streak, onSubmit }: Props) {
  const [name, setName] = useState('');

  return (
    <Box sx={{
      minHeight: '100%', bgcolor: '#FAFBFC', color: '#1A2332',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      px: 3,
    }}>
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <Typography variant="h4" align="center" sx={{ fontWeight: 800, mb: 2 }}>
          ⚔️ New Challenger Approaching!
        </Typography>
        <Box sx={{ textAlign: 'center', mb: 3 }}>
          <Typography sx={{ color: '#FFD700' }}>
            👑 Champion: {championName} (Streak: {streak})
          </Typography>
        </Box>
      </motion.div>

      <Box sx={{
        p: 3, borderRadius: 3, minWidth: 280, textAlign: 'center',
        background: '#FFFFFF', backdropFilter: 'blur(16px)',
        border: '1px solid rgba(27,142,191,0.3)',
      }}>
        <input
          value={name}
          onChange={e => setName(e.target.value.slice(0, 20))}
          placeholder="Your name"
          maxLength={20}
          style={{
            textAlign: 'center', color: '#1A2332', background: 'transparent',
            border: 'none', borderBottom: '2px solid #007DC466',
            fontSize: 20, padding: '8px 12px', outline: 'none', width: '100%',
            fontFamily: 'inherit',
          }}
        />
        <Box sx={{ mt: 3 }}>
          <EcoButton onClick={() => name.trim() && onSubmit(name.trim())} disabled={!name.trim()}>
            Challenge! ⚔️
          </EcoButton>
        </Box>
      </Box>
    </Box>
  );
}
