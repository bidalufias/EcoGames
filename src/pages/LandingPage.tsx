import { Box, Typography, Grid } from '@mui/material';
import { motion } from 'framer-motion';
import ParticleBackground from '../components/ParticleBackground';
import GameTile from '../components/GameTile';
import { MGTC_GREEN, MGTC_BLUE } from '../theme/ecoTheme';

const games = [
  {
    id: 'climate-ninja',
    title: 'Climate Ninja',
    description: 'Slice through greenhouse gases! Learn the 7 GHGs threatening our planet.',
    icon: '⚔️',
    color: '#8BC53F',
    available: true,
    tags: ['Touch', 'Action'],
  },
  {
    id: 'carbon-crush',
    title: 'Carbon Crush',
    description: 'Match and phase out emission sources. Every match brings us closer to clean energy.',
    icon: '💎',
    color: '#007DC4',
    available: true,
    tags: ['Puzzle', 'Strategy'],
  },
  {
    id: 'recycle-rush',
    title: 'Recycle Rush',
    description: 'Sort waste at lightning speed. Learn what goes where before the landfill overflows!',
    icon: '📦',
    color: '#FF8C42',
    available: true,
    tags: ['Action', 'Arcade'],
  },
  {
    id: 'eco-memory',
    title: 'Eco Memory',
    description: 'Match greenhouse gases to their sources and effects.',
    icon: '🧠',
    color: '#9B59B6',
    available: true,
    tags: ['Puzzle', 'Brain Training'],
  },
  {
    id: 'green-defence',
    title: 'Green Defence',
    description: 'Deploy clean tech to stop pollution waves. Reach Net Zero by 2050!',
    icon: '🛡️',
    color: '#14CCAA',
    available: true,
    tags: ['Strategy', 'Tower Defence'],
  },
  {
    id: 'climate-2048',
    title: 'Climate 2048',
    description: 'Merge your way to Net Zero. Upgrade technologies from LED bulbs to smart cities.',
    icon: '🔢',
    color: '#FF6B35',
    available: true,
    tags: ['Puzzle', 'Brain Training'],
  },
];

export default function LandingPage() {
  return (
    <Box sx={{ position: 'relative', width: '100vw', height: '100vh', overflow: 'hidden', background: '#FAFBFC' }}>
      <ParticleBackground />

      <Box
        sx={{
          position: 'relative',
          zIndex: 1,
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          pt: 7, // space for fixed header
        }}
      >
        {/* Logo + Title area */}
        <Box sx={{ textAlign: 'center', py: { xs: 1, md: 2 }, flexShrink: 0 }}>
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2, mb: 0.5 }}>
              <Box
                component="img"
                src="/mgtc-logo.png"
                alt="MGTC"
                sx={{ height: { xs: 36, md: 48 }, width: 'auto' }}
              />
              <Typography
                sx={{
                  fontSize: { xs: '2rem', sm: '2.8rem', md: '3.5rem' },
                  fontWeight: 800,
                  letterSpacing: '-0.03em',
                  lineHeight: 1,
                  background: `linear-gradient(135deg, ${MGTC_GREEN} 0%, ${MGTC_BLUE} 100%)`,
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                EcoGames
              </Typography>
            </Box>
            <Typography
              sx={{
                color: '#5A6A7E',
                fontWeight: 500,
                fontSize: { xs: '0.85rem', sm: '1rem', md: '1.15rem' },
                letterSpacing: '0.02em',
              }}
            >
              Learn. Play. Save the Planet.
            </Typography>
          </motion.div>
        </Box>

        {/* Games Grid — fills remaining space */}
        <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', px: { xs: 2, md: 4 }, pb: 2 }}>
          <Box sx={{ width: '100%', maxWidth: 1200 }}>
            <Grid container spacing={{ xs: 1.5, sm: 2, md: 3 }}>
              {games.map((game, i) => (
                <Grid size={{ xs: 6, md: 4 }} key={game.id}>
                  <GameTile {...game} index={i} />
                </Grid>
              ))}
            </Grid>
          </Box>
        </Box>

        {/* Footer line */}
        <Box sx={{ textAlign: 'center', py: 1, flexShrink: 0 }}>
          <Typography sx={{ color: '#A0AABB', fontSize: '0.75rem', fontWeight: 400 }}>
            Built with 💚 by MGTC — Empowering Climate Education Through Play
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}
