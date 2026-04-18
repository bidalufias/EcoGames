import { Box, Typography, Grid } from '@mui/material';
import { motion } from 'framer-motion';
import GameTile from '../components/GameTile';

const games = [
  {
    id: 'climate-ninja',
    title: 'Climate Ninja',
    description: 'Slice through greenhouse gases and learn the 7 GHGs threatening our planet.',
    icon: '⚔️',
    color: '#4CAF50',
    available: true,
    tags: ['Touch', 'Action'],
  },
  {
    id: 'carbon-crush',
    title: 'Carbon Crush',
    description: 'Match and phase out emission sources. Every match brings us closer to clean energy.',
    icon: '💎',
    color: '#2196F3',
    available: true,
    tags: ['Puzzle', 'Strategy'],
  },
  {
    id: 'recycle-rush',
    title: 'Recycle Rush',
    description: 'Sort waste at lightning speed. Learn what goes where before the landfill overflows.',
    icon: '♻️',
    color: '#FF9800',
    available: true,
    tags: ['Action', 'Arcade'],
  },
  {
    id: 'eco-memory',
    title: 'Eco Memory',
    description: 'Match greenhouse gases to their sources and discover their environmental effects.',
    icon: '🧠',
    color: '#7C4DFF',
    available: true,
    tags: ['Puzzle', 'Brain Training'],
  },
  {
    id: 'green-defence',
    title: 'Green Defence',
    description: 'Deploy clean technology to stop pollution waves. Reach Net Zero by 2050!',
    icon: '🛡️',
    color: '#00BFA5',
    available: true,
    tags: ['Strategy', 'Tower Defence'],
  },
  {
    id: 'climate-2048',
    title: 'Climate 2048',
    description: 'Merge your way to Net Zero. Upgrade technologies from LED bulbs to smart cities.',
    icon: '🔢',
    color: '#FF5722',
    available: true,
    tags: ['Puzzle', 'Brain Training'],
  },
];

const fadeUp = {
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0 },
};

export default function LandingPage() {
  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: '#FFFFFF',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Hero */}
      <Box
        sx={{
          textAlign: 'center',
          pt: { xs: 8, md: 12 },
          pb: { xs: 4, md: 6 },
          px: 2,
        }}
      >
        <motion.div {...fadeUp} transition={{ duration: 0.5, ease: 'easeOut' }}>
          <Typography
            sx={{
              fontSize: { xs: '2.5rem', sm: '3.5rem', md: '4.5rem' },
              fontWeight: 800,
              letterSpacing: '-0.04em',
              lineHeight: 1.1,
              color: '#0F172A',
            }}
          >
            EcoGames
          </Typography>
        </motion.div>

        <motion.div {...fadeUp} transition={{ duration: 0.5, delay: 0.1, ease: 'easeOut' }}>
          <Typography
            sx={{
              mt: { xs: 1.5, md: 2 },
              color: '#64748B',
              fontWeight: 400,
              fontSize: { xs: '1rem', sm: '1.2rem', md: '1.35rem' },
              letterSpacing: '0.01em',
              maxWidth: 480,
              mx: 'auto',
              lineHeight: 1.5,
            }}
          >
            Learn, play, and save the planet through interactive climate education games.
          </Typography>
        </motion.div>
      </Box>

      {/* Games Grid */}
      <Box
        sx={{
          flex: 1,
          display: 'flex',
          justifyContent: 'center',
          px: { xs: 3, sm: 4, md: 6 },
          pb: { xs: 4, md: 6 },
        }}
      >
        <Box sx={{ width: '100%', maxWidth: 1100 }}>
          <Grid container spacing={{ xs: 2, sm: 3 }}>
            {games.map((game, i) => (
              <Grid size={{ xs: 6, md: 4 }} key={game.id}>
                <GameTile {...game} index={i} />
              </Grid>
            ))}
          </Grid>
        </Box>
      </Box>

      {/* Footer */}
      <Box sx={{ textAlign: 'center', py: 3, px: 2 }}>
        <Typography
          sx={{
            color: '#CBD5E1',
            fontSize: '0.8rem',
            fontWeight: 500,
            letterSpacing: '0.02em',
          }}
        >
          MGTC — Empowering Climate Education Through Play
        </Typography>
      </Box>
    </Box>
  );
}
