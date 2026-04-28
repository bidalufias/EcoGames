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
      sx={{
        minHeight: '100dvh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        pt: 10,
      }}
    >
      <Container maxWidth="sm" sx={{ textAlign: 'center' }}>
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <Typography sx={{ fontSize: '4rem', mb: 2 }}>🎮</Typography>
          <Typography variant="h3" sx={{ fontWeight: 800, mb: 2 }}>
            {gameName}
          </Typography>
          <Typography
            variant="h6"
            sx={{ color: 'text.secondary', mb: 4, lineHeight: 1.7 }}
          >
            This game is coming soon! We're working hard to bring you an amazing experience.
          </Typography>
          <EcoButton variant="primary" size="large" onClick={() => navigate('/')}>
            ← Back to Games
          </EcoButton>
        </motion.div>
      </Container>
    </Box>
  );
}
