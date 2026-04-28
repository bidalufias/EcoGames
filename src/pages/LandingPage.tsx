import { Box, Typography } from '@mui/material';
import { motion } from 'framer-motion';
import GameTile from '../components/GameTile';
import EcoHeader from '../components/EcoHeader';
import ParticleBackground from '../components/ParticleBackground';
import { MGTC_GREEN, MGTC_BLUE } from '../theme/ecoTheme';

const games = [
  {
    id: 'climate-ninja',
    title: 'Climate Ninja',
    inspiredBy: 'Fruit Ninja',
    topic: 'Greenhouse Gases',
    description: 'Slice through the 7 greenhouse gases warming our planet.',
    learn: 'CO₂, CH₄, N₂O, F-gases & more',
    difficulty: 'Easy' as const,
    playTime: '3 min',
    icon: '🥷',
    accent: '#16A34A',
    available: true,
  },
  {
    id: 'carbon-crush',
    title: 'Carbon Crush',
    inspiredBy: 'Candy Crush',
    topic: 'Clean Energy',
    description: 'Match polluting tech to phase it out for clean alternatives.',
    learn: 'Fossil fuels → renewables',
    difficulty: 'Medium' as const,
    playTime: '5 min',
    icon: '💎',
    accent: '#2563EB',
    available: true,
  },
  {
    id: 'recycle-rush',
    title: 'Recycle Rush',
    inspiredBy: 'Diner Dash',
    topic: 'Waste & Recycling',
    description: 'Sort waste to the right bin before customers walk away.',
    learn: 'Recycle, compost, hazardous, e-waste',
    difficulty: 'Easy' as const,
    playTime: '4 min',
    icon: '♻️',
    accent: '#EA580C',
    available: true,
  },
  {
    id: 'eco-memory',
    title: 'Eco Memory',
    inspiredBy: 'Memory Match',
    topic: 'Climate Knowledge',
    description: 'Pair greenhouse gases with their real-world sources.',
    learn: 'Where emissions come from',
    difficulty: 'Easy' as const,
    playTime: '3 min',
    icon: '🧠',
    accent: '#7C3AED',
    available: true,
  },
  {
    id: 'green-defence',
    title: 'Green Defence',
    inspiredBy: 'Plants vs. Zombies',
    topic: 'Net Zero',
    description: 'Deploy clean tech to halt waves of pollution.',
    learn: 'Solar, wind, EVs, carbon capture',
    difficulty: 'Medium' as const,
    playTime: '6 min',
    icon: '🛡️',
    accent: '#0D9488',
    available: true,
  },
  {
    id: 'climate-2048',
    title: 'Climate 2048',
    inspiredBy: '2048',
    topic: 'Climate Tech',
    description: 'Merge climate solutions from LED bulbs to Net Zero cities.',
    learn: 'The journey to Net Zero by 2050',
    difficulty: 'Hard' as const,
    playTime: '5 min',
    icon: '🔢',
    accent: '#DC2626',
    available: true,
  },
];

export default function LandingPage() {
  return (
    <Box
      sx={{
        height: '100dvh',
        width: '100vw',
        overflow: 'hidden',
        background:
          'radial-gradient(circle at 20% 0%, #DCFCE7 0%, transparent 45%), radial-gradient(circle at 100% 100%, #DBEAFE 0%, transparent 50%), linear-gradient(180deg, #F8FAFC 0%, #F1F5F9 100%)',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
      }}
    >
      <ParticleBackground />

      {/* Portrait orientation guard */}
      <Box
        sx={{
          display: 'none',
          '@media (orientation: portrait) and (max-width: 1024px)': {
            display: 'flex',
            position: 'fixed',
            inset: 0,
            background: '#0F172A',
            color: '#FFFFFF',
            zIndex: 99999,
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'column',
            gap: 2,
            textAlign: 'center',
            px: 4,
          },
        }}
      >
        <Box sx={{ fontSize: '4rem' }}>🔄</Box>
        <Typography sx={{ fontSize: '1.4rem', fontWeight: 700 }}>Please rotate your device</Typography>
        <Typography sx={{ color: '#94A3B8', fontSize: '0.95rem', maxWidth: 320 }}>
          EcoGames is designed for landscape mode for the best touchscreen experience.
        </Typography>
      </Box>

      <Box sx={{ position: 'relative', zIndex: 2, flexShrink: 0 }}>
        <EcoHeader tagline="" />
      </Box>

      {/* Hero */}
      <Box
        sx={{
          position: 'relative',
          zIndex: 1,
          flexShrink: 0,
          textAlign: 'center',
          px: 3,
          pt: 'clamp(8px, 2vh, 24px)',
          pb: 'clamp(2px, 0.8vh, 10px)',
        }}
      >
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        >
          <Typography
            sx={{
              fontSize: 'clamp(1.3rem, 3.8vh, 2.4rem)',
              fontWeight: 900,
              lineHeight: 1,
              letterSpacing: '-0.035em',
              color: '#0F172A',
            }}
          >
            Play. Learn.{' '}
            <Box
              component="span"
              sx={{
                background: `linear-gradient(135deg, ${MGTC_GREEN} 0%, ${MGTC_BLUE} 100%)`,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              Save the Planet.
            </Box>
          </Typography>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.12, ease: 'easeOut' }}
        >
          <Typography
            sx={{
              mt: 'clamp(2px, 0.6vh, 8px)',
              color: '#475569',
              fontSize: 'clamp(0.7rem, 1.4vh, 0.95rem)',
              fontWeight: 500,
              letterSpacing: '0.01em',
            }}
          >
            Six classic games reimagined for climate education ·{' '}
            <Box component="span" sx={{ color: MGTC_GREEN, fontWeight: 700 }}>
              tap any game to start
            </Box>
          </Typography>
        </motion.div>
      </Box>

      {/* Games Grid */}
      <Box
        sx={{
          position: 'relative',
          zIndex: 1,
          flex: 1,
          minHeight: 0,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'stretch',
          px: 'clamp(12px, 2.5vw, 36px)',
          py: 'clamp(8px, 1.6vh, 22px)',
        }}
      >
        <Box
          sx={{
            width: '100%',
            maxWidth: 1320,
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gridTemplateRows: 'repeat(2, 1fr)',
            gap: 'clamp(10px, 1.6vh, 22px)',
            minHeight: 0,
          }}
        >
          {games.map((game, i) => (
            <GameTile key={game.id} {...game} index={i} />
          ))}
        </Box>
      </Box>

      {/* Footer */}
      <Box
        sx={{
          position: 'relative',
          zIndex: 1,
          textAlign: 'center',
          py: 0.9,
          flexShrink: 0,
          borderTop: '1px solid rgba(15,23,42,0.06)',
          background: 'rgba(255,255,255,0.5)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
        }}
      >
        <Typography
          sx={{
            color: '#64748B',
            fontSize: '0.72rem',
            fontWeight: 600,
            letterSpacing: '0.05em',
          }}
        >
          MGTC · Empowering Climate Education Through Play
        </Typography>
      </Box>
    </Box>
  );
}
