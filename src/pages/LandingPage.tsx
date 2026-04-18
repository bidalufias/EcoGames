import { Box, Typography } from '@mui/material';
import { motion } from 'framer-motion';
import GameTile from '../components/GameTile';

const games = [
  {
    id: 'climate-ninja',
    title: 'Climate Ninja',
    description: 'Slice through greenhouse gases! Learn the 7 GHGs threatening our planet.',
    icon: '🥷',
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
    description: 'Sort waste at lightning speed. Learn what goes where before the landfill overflows!',
    icon: '📦',
    color: '#FF9800',
    available: true,
    tags: ['Action', 'Arcade'],
  },
  {
    id: 'eco-memory',
    title: 'Eco Memory',
    description: 'Test your climate knowledge. Match greenhouse gases to their sources and effects.',
    icon: '🧠',
    color: '#7C4DFF',
    available: true,
    tags: ['Puzzle', 'Brain Training'],
  },
  {
    id: 'green-defence',
    title: 'Green Defence',
    description: 'Deploy clean tech to stop pollution waves. Reach Net Zero by 2050!',
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
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
};

export default function LandingPage() {
  return (
    <Box
      sx={{
        minHeight: '100vh',
        width: '100vw',
        overflow: 'auto',
        background: 'linear-gradient(160deg, #0F172A 0%, #1a2744 40%, #0d3320 100%)',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
      }}
    >
      {/* Animated background orbs */}
      <Box sx={{ position: 'fixed', inset: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: 0 }}>
        <Box sx={{
          position: 'absolute', top: '-15%', left: '-10%', width: '50vw', height: '50vw',
          borderRadius: '50%', background: 'radial-gradient(circle, rgba(76,175,80,0.12) 0%, transparent 70%)',
          animation: 'float1 12s ease-in-out infinite',
        }} />
        <Box sx={{
          position: 'absolute', bottom: '-20%', right: '-10%', width: '45vw', height: '45vw',
          borderRadius: '50%', background: 'radial-gradient(circle, rgba(33,150,243,0.10) 0%, transparent 70%)',
          animation: 'float2 14s ease-in-out infinite',
        }} />
        <Box sx={{
          position: 'absolute', top: '30%', right: '20%', width: '30vw', height: '30vw',
          borderRadius: '50%', background: 'radial-gradient(circle, rgba(255,152,0,0.06) 0%, transparent 70%)',
          animation: 'float3 10s ease-in-out infinite',
        }} />
      </Box>

      {/* Header */}
      <Box sx={{ textAlign: 'center', pt: { xs: 3, sm: 4, md: 5 }, pb: { xs: 1, sm: 2 }, px: 2, flexShrink: 0, position: 'relative', zIndex: 1 }}>
        <motion.div {...fadeUp} transition={{ duration: 0.5, ease: 'easeOut' }}>
          <Typography sx={{
            fontSize: { xs: '2rem', sm: '2.8rem', md: '3.5rem' },
            fontWeight: 900,
            letterSpacing: '-0.04em',
            lineHeight: 1,
            background: 'linear-gradient(135deg, #81C784 0%, #4CAF50 30%, #2196F3 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}>
            EcoGames
          </Typography>
        </motion.div>
        <motion.div {...fadeUp} transition={{ duration: 0.4, delay: 0.1 }}>
          <Typography sx={{
            mt: 0.5, color: 'rgba(255,255,255,0.5)', fontWeight: 400,
            fontSize: { xs: '0.75rem', sm: '0.9rem' }, letterSpacing: '0.03em',
          }}>
            Play. Learn. Save the Planet.
          </Typography>
        </motion.div>
      </Box>

      {/* Games Grid — responsive, fills width */}
      <Box sx={{
        flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'flex-start',
        px: { xs: 2, sm: 3, md: 5 }, py: { xs: 1, sm: 2 }, position: 'relative', zIndex: 1,
      }}>
        <Box sx={{
          width: '100%', maxWidth: 1200,
          display: 'grid',
          gridTemplateColumns: {
            xs: 'repeat(2, 1fr)',
            sm: 'repeat(3, 1fr)',
            lg: 'repeat(3, 1fr)',
          },
          gap: { xs: 1.5, sm: 2, md: 2.5 },
        }}>
          {games.map((game, i) => (
            <GameTile key={game.id} {...game} index={i} />
          ))}
        </Box>
      </Box>

      {/* Footer */}
      <Box sx={{ textAlign: 'center', py: { xs: 1.5, sm: 2 }, flexShrink: 0, position: 'relative', zIndex: 1 }}>
        <Typography sx={{ color: 'rgba(255,255,255,0.2)', fontSize: '0.7rem', fontWeight: 500, letterSpacing: '0.04em' }}>
          MGTC — Empowering Climate Education Through Play
        </Typography>
      </Box>
    </Box>
  );
}
