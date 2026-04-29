import { useState } from 'react';
import { Box, Typography } from '@mui/material';
import { motion } from 'framer-motion';
import { PLAYER_COLORS } from '../Renderer';
import EcoButton from '../../../components/EcoButton';

interface Props {
  playerCount: number;
  onSubmit: (names: string[]) => void;
}

export default function NameEntryScreen({ playerCount, onSubmit }: Props) {
  const [names, setNames] = useState<string[]>(Array(playerCount).fill(''));

  const handleChange = (i: number, val: string) => {
    const next = [...names];
    next[i] = val.slice(0, 20);
    setNames(next);
  };

  const canStart = names.every(n => n.trim().length > 0);

  return (
    <Box sx={{
      minHeight: '100%', bgcolor: '#FAFBFC', color: '#1A2332',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      px: 3, py: 4,
    }}>
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <Typography variant="h4" align="center" sx={{ fontWeight: 700, mb: 4 }}>
          Enter Your Names
        </Typography>
      </motion.div>

      <Box sx={{ display: 'flex', gap: 4, flexWrap: 'wrap', justifyContent: 'center', mb: 4 }}>
        {names.map((name, i) => (
          <motion.div key={i} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.15 }}>
            <Box sx={{
              p: 3, borderRadius: 3, minWidth: 220, textAlign: 'center',
              background: '#FFFFFF', backdropFilter: 'blur(16px)',
              border: `1px solid ${PLAYER_COLORS[i]}44`,
              ...(playerCount === 2 && i === 1 ? { transform: 'rotate(180deg)' } : {}),
            }}>
              <Typography sx={{ color: PLAYER_COLORS[i], fontWeight: 700, mb: 2,
                ...(playerCount === 2 && i === 1 ? { transform: 'rotate(180deg)' } : {}),
              }}>
                Player {i + 1}
              </Typography>
              <input
                value={name}
                onChange={e => handleChange(i, e.target.value)}
                placeholder={`Player ${i + 1}`}
                maxLength={20}
                style={{
                  textAlign: 'center', color: '#1A2332', background: 'transparent',
                  border: 'none', borderBottom: `2px solid ${PLAYER_COLORS[i]}66`,
                  fontSize: 18, padding: '8px 12px', outline: 'none', fontFamily: 'inherit',
                  ...(playerCount === 2 && i === 1 ? { transform: 'rotate(180deg)' } : {}),
                }}
              />
            </Box>
          </motion.div>
        ))}
      </Box>

      <EcoButton onClick={() => onSubmit(names)} disabled={!canStart} size="large">
        Begin Mission 🎯
      </EcoButton>
    </Box>
  );
}
