import { Box, Typography, Container } from '@mui/material';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import EcoButton from '../components/EcoButton';

const gameNames: Record<string, string> = {
  'climate-ninja': 'Climate Ninja 🥷',
  'carbon-crush': 'Carbon Crush 💎',
  'recycle-rush': 'Recycle Rush 📦',
  'eco-memory': 'Eco Memory 🧠',
  'green-defence': 'Green Defence 🛡️',
  'climate-2048': 'Climate 2048 🔢',
};

export default function GamePage() {
  const { gameId } = useParams<{ gameId: string }>();
  const navigate = useNavigate();
  const gameName = gameNames[gameId || ''] || 'Unknown Game';

  return (
    <Box
      className="game-screen-stack"
      sx={{
        height: '100%',
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        px: 'clamp(16px, 4cqw, 32px)',
        py: 'clamp(72px, 8cqh, 120px)',
        overflow: 'hidden',
      }}
    >
      <Container maxWidth="sm" sx={{ textAlign: 'center', px: 0 }}>
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <Typography sx={{ fontSize: 'clamp(2.5rem, 8cqmin, 4rem)', mb: 2 }} aria-hidden>🎮</Typography>
          <Typography
            component="h1"
            sx={{
              fontWeight: 800,
              mb: 2,
              fontSize: 'clamp(1.5rem, 5cqmin, 2.4rem)',
              lineHeight: 1.1,
              letterSpacing: '-0.02em',
              color: '#1F1B14',
              wordBreak: 'break-word',
            }}
          >
            {gameName}
          </Typography>
          <Typography
            sx={{
              color: '#5B5247',
              mb: 4,
              lineHeight: 1.6,
              fontSize: 'clamp(0.95rem, 2.4cqmin, 1.1rem)',
              maxWidth: 480,
              mx: 'auto',
            }}
          >
            This game is coming soon. We're working on bringing you the next round.
          </Typography>
          <EcoButton variant="primary" size="large" onClick={() => navigate('/')}>
            ← Back to Games
          </EcoButton>
        </motion.div>
      </Container>
    </Box>
  );
}
