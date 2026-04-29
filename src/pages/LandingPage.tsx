import { Box, Typography } from '@mui/material';
import { motion } from 'framer-motion';
import GameTile, { type TileTemplate } from '../components/GameTile';
import EcoHeader from '../components/EcoHeader';

interface GameDef {
  id: string;
  title: string;
  inspiredBy: string;
  topic: string;
  description: string;
  learn: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  playTime: string;
  icon: string;
  accent: string;
  available: boolean;
  template: TileTemplate;
}

// Grid order: A, B, C, B, C, A. The pattern places the two same-template
// tiles diagonally so no two adjacent cells share a template.
const games: GameDef[] = [
  {
    id: 'climate-ninja',
    title: 'Climate Ninja',
    inspiredBy: 'Fruit Ninja',
    topic: 'Greenhouse Gases',
    description: 'Slice through the seven greenhouse gases warming our planet.',
    learn: 'Tell apart CO₂, methane, and the other gases driving climate change',
    difficulty: 'Easy',
    playTime: '3 min',
    icon: '🥷',
    accent: '#16A34A',
    available: true,
    template: 'headline',
  },
  {
    id: 'recycle-rush',
    title: 'Recycle Rush',
    inspiredBy: 'Diner Dash',
    topic: 'Waste & Recycling',
    description: 'Sort the bins before customers walk away.',
    learn: 'Where recyclables, compost, hazardous, and e-waste actually belong',
    difficulty: 'Easy',
    playTime: '4 min',
    icon: '♻️',
    accent: '#C2410C',
    available: true,
    template: 'index',
  },
  {
    id: 'eco-memory',
    title: 'Eco Memory',
    inspiredBy: 'Memory Match',
    topic: 'Climate Knowledge',
    description: 'Pair greenhouse gases with their real-world sources.',
    learn: 'Where each greenhouse gas comes from in everyday life',
    difficulty: 'Easy',
    playTime: '3 min',
    icon: '🧠',
    accent: '#6D28D9',
    available: true,
    template: 'object',
  },
  {
    id: 'green-defence',
    title: 'Green Defence',
    inspiredBy: 'Plants vs. Zombies',
    topic: 'Net Zero',
    description: 'Deploy clean tech to halt waves of pollution.',
    learn: 'How solar, wind, EVs, and carbon capture cut emissions',
    difficulty: 'Medium',
    playTime: '6 min',
    icon: '🛡️',
    accent: '#0F766E',
    available: true,
    template: 'index',
  },
  {
    id: 'climate-2048',
    title: 'Climate 2048',
    inspiredBy: '2048',
    topic: 'Climate Tech',
    description: 'Merge a tech stack from a single component up to a Net-Zero deployment.',
    learn: 'How a clean technology scales from wafer to grid-connected farm',
    difficulty: 'Hard',
    playTime: '5 min',
    icon: '🔢',
    accent: '#B91C1C',
    available: true,
    template: 'object',
  },
  {
    id: 'carbon-crush',
    title: 'Carbon Crush',
    inspiredBy: 'Candy Crush',
    topic: 'Clean Energy',
    description: 'Match polluting tech to phase it out for clean alternatives.',
    learn: 'How renewables like solar and wind are replacing fossil fuels',
    difficulty: 'Medium',
    playTime: '5 min',
    icon: '💎',
    accent: '#1D4ED8',
    available: true,
    template: 'headline',
  },
];

// Inline grain SVG: a deterministic noise pattern, ~1 kB. Adds the paper
// feel without shipping a separate asset request.
const PAPER_GRAIN =
  "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='220' height='220'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 0.13  0 0 0 0 0.10  0 0 0 0 0.06  0 0 0 0.06 0'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>\")";

export default function LandingPage() {
  return (
    <Box
      sx={{
        height: '100%',
        width: '100%',
        overflow: 'hidden',
        background: '#FAF7F0',
        backgroundImage: PAPER_GRAIN,
        backgroundRepeat: 'repeat',
        backgroundSize: '220px 220px',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
      }}
    >
      <a href="#games" className="skip-link">Skip to games</a>

      {/* Portrait orientation guard. */}
      <Box
        sx={{
          display: 'none',
          '@media (orientation: portrait) and (max-width: 1024px)': {
            display: 'flex',
            position: 'fixed',
            inset: 0,
            background: '#1F1B14',
            color: '#FAF7F0',
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
        <Box sx={{ fontSize: '4rem' }} aria-hidden>🔄</Box>
        <Typography sx={{ fontSize: '1.4rem', fontWeight: 700 }}>Please rotate your device</Typography>
        <Typography sx={{ color: '#C5BBA9', fontSize: '0.95rem', maxWidth: 320 }}>
          EcoGames is designed for landscape mode, so the games can fit the screen.
        </Typography>
      </Box>

      <Box component="header" sx={{ position: 'relative', zIndex: 2, flexShrink: 0 }}>
        <EcoHeader tagline="" />
      </Box>

      {/* Hero */}
      <Box
        component="section"
        aria-labelledby="hero-heading"
        sx={{
          position: 'relative',
          zIndex: 1,
          flexShrink: 0,
          textAlign: 'center',
          px: 3,
          pt: 'clamp(10px, 2.4cqh, 28px)',
          pb: 'clamp(4px, 1cqh, 14px)',
        }}
      >
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        >
          <Typography
            id="hero-heading"
            component="h1"
            sx={{
              m: 0,
              fontSize: 'clamp(1.4rem, 4.2cqh, 2.8rem)',
              fontWeight: 900,
              lineHeight: 0.98,
              letterSpacing: '-0.04em',
              color: '#1F1B14',
            }}
          >
            Six little games.{' '}
            <Box component="span" sx={{ fontWeight: 500, fontStyle: 'italic', color: '#15803D' }}>
              One warming planet.
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
              mt: 'clamp(4px, 0.8cqh, 10px)',
              color: '#5B5247',
              fontSize: 'clamp(0.72rem, 1.5cqh, 0.98rem)',
              fontWeight: 500,
              letterSpacing: '0.005em',
              maxWidth: 640,
              mx: 'auto',
            }}
          >
            Pick a game, play a round, learn something about the climate you didn{'’'}t know before.
          </Typography>
        </motion.div>
      </Box>

      {/* Games Grid */}
      <Box
        component="main"
        id="games"
        aria-label="Climate games"
        sx={{
          position: 'relative',
          zIndex: 1,
          flex: 1,
          minHeight: 0,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'stretch',
          px: 'clamp(12px, 2.5cqw, 36px)',
          py: 'clamp(8px, 1.6cqh, 22px)',
        }}
      >
        <Box
          sx={{
            width: '100%',
            maxWidth: 1320,
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gridTemplateRows: 'repeat(2, 1fr)',
            gap: 'clamp(10px, 1.6cqh, 22px)',
            minHeight: 0,
          }}
        >
          {games.map((game, i) => (
            <GameTile key={game.id} {...game} number={i + 1} index={i} />
          ))}
        </Box>
      </Box>

      {/* Footer */}
      <Box
        component="footer"
        sx={{
          position: 'relative',
          zIndex: 1,
          textAlign: 'center',
          py: 1,
          flexShrink: 0,
          borderTop: '1px solid #E8DFCB',
          background: 'rgba(250, 247, 240, 0.85)',
        }}
      >
        <Typography
          sx={{
            color: '#7A6F5C',
            fontSize: '0.72rem',
            fontWeight: 600,
            letterSpacing: '0.06em',
          }}
        >
          MGTC · Empowering climate education through play
        </Typography>
      </Box>
    </Box>
  );
}
