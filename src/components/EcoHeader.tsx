import { Box, Typography } from '@mui/material';
import { motion } from 'framer-motion';

interface EcoHeaderProps {
  tagline?: string;
}

export default function EcoHeader({ tagline = 'Six classic games, one climate mission.' }: EcoHeaderProps) {
  return (
    <motion.div
      initial={{ y: -12, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
    >
      <Box
        sx={{
          height: 56,
          px: { xs: 2, sm: 3, md: 4 },
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'rgba(255,255,255,0.82)',
          backdropFilter: 'blur(18px)',
          WebkitBackdropFilter: 'blur(18px)',
          borderBottom: '1px solid #E8EDF2',
          userSelect: 'none',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box
            component="img"
            src="/mgtc-logo.png"
            alt="MGTC"
            sx={{ height: 30, width: 'auto', display: 'block' }}
          />
          <Box sx={{ width: '1px', height: 24, background: '#E2E8F0' }} />
          <Typography
            sx={{
              fontSize: { xs: '1.05rem', md: '1.2rem' },
              fontWeight: 800,
              color: '#15803D',
              letterSpacing: '-0.02em',
              lineHeight: 1,
            }}
          >
            EcoGames
          </Typography>
        </Box>

        {tagline && (
          <Typography
            sx={{
              display: { xs: 'none', sm: 'block' },
              color: '#64748B',
              fontSize: { sm: '0.75rem', md: '0.82rem' },
              fontWeight: 500,
              letterSpacing: '0.02em',
            }}
          >
            {tagline}
          </Typography>
        )}
      </Box>
    </motion.div>
  );
}
