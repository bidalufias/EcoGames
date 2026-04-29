import { Box, Typography } from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';

const GAME_TITLES: Record<string, string> = {
  'climate-ninja': 'Climate Ninja',
  'carbon-crush': 'Carbon Crush',
  'recycle-rush': 'Recycle Rush',
  'eco-memory': 'Eco Memory',
  'green-defence': 'Green Defence',
  'climate-2048': 'Climate 2048',
};

export default function BackToHome() {
  const navigate = useNavigate();
  const location = useLocation();
  const gameId = location.pathname.split('/').pop() || '';
  const title = GAME_TITLES[gameId] || 'Home';

  return (
    <Box
      component="button"
      type="button"
      onClick={() => navigate('/')}
      aria-label={`Back to EcoGames home from ${title}`}
      sx={{
        position: 'absolute',
        top: 'clamp(10px, 2.5cqh, 24px)',
        left: 'clamp(12px, 3cqw, 32px)',
        zIndex: 10001,
        minHeight: 44,
        minWidth: 44,
        px: 2,
        py: 1.25,
        borderRadius: '12px',
        background: 'rgba(255,255,255,0.92)',
        border: '1px solid rgba(15,23,42,0.08)',
        cursor: 'pointer',
        display: 'inline-flex',
        alignItems: 'center',
        gap: 0.75,
        boxShadow: '0 1px 3px rgba(15,23,42,0.08)',
        font: 'inherit',
        color: 'inherit',
        textAlign: 'left',
        '&:hover': {
          background: '#FFFFFF',
          boxShadow: '0 4px 12px rgba(15,23,42,0.1)',
        },
        '&:focus-visible': {
          outline: '2px solid #15803D',
          outlineOffset: 3,
        },
        transition: 'background 0.18s, box-shadow 0.18s',
      }}
    >
      <Typography sx={{ fontSize: 14, color: '#475569', fontWeight: 600, letterSpacing: '-0.01em' }}>
        ← {title}
      </Typography>
    </Box>
  );
}
