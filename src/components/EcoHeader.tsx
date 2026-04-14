import { Box, Typography } from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';

export default function EcoHeader() {
  const navigate = useNavigate();
  const location = useLocation();
  void location.pathname;

  return (
    <motion.div
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
    >
      <Box
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
          background: 'rgba(10, 22, 40, 0.8)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(13, 155, 74, 0.1)',
        }}
      >
        <Box
          onClick={() => navigate('/')}
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            cursor: 'pointer',
            '&:hover': { '& .logo-text': { color: '#14CC66' } },
            transition: 'color 0.3s',
          }}
        >
          <Typography
            className="logo-text"
            sx={{
              fontSize: { xs: '1.2rem', sm: '1.5rem' },
              fontWeight: 800,
              background: 'linear-gradient(135deg, #0D9B4A, #1B8EBF)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              letterSpacing: '-0.02em',
            }}
          >
            🌱 EcoGames
          </Typography>
        </Box>

        <Typography
          sx={{
            fontSize: { xs: '0.75rem', sm: '0.85rem' },
            color: 'text.secondary',
            fontWeight: 500,
            opacity: 0.7,
          }}
        >
          by MGTC
        </Typography>
      </Box>
    </motion.div>
  );
}
