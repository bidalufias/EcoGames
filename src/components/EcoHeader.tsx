import { Box, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MGTC_GREEN, MGTC_BLUE } from '../theme/ecoTheme';

export default function EcoHeader() {
  const navigate = useNavigate();

  return (
    <motion.div
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
    >
      <Box
        onClick={() => navigate('/')}
        sx={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 1000,
          px: { xs: 2, sm: 4 },
          py: 1.5,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'rgba(255, 255, 255, 0.92)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderBottom: '1px solid #E8EDF2',
          cursor: 'pointer',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box
            component="img"
            src="/mgtc-logo.png"
            alt="MGTC"
            sx={{ height: 32, width: 'auto' }}
          />
          <Typography
            sx={{
              fontSize: { xs: '1.1rem', sm: '1.3rem' },
              fontWeight: 800,
              background: `linear-gradient(135deg, ${MGTC_GREEN}, ${MGTC_BLUE})`,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              letterSpacing: '-0.02em',
            }}
          >
            EcoGames
          </Typography>
        </Box>
      </Box>
    </motion.div>
  );
}
