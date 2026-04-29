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
      onClick={() => navigate('/')}
      sx={{
        position: 'absolute',
        top: 'clamp(10px, 2.5cqh, 24px)',
        left: 'clamp(12px, 3cqw, 32px)',
        zIndex: 10001,
        px: 2,
        py: 0.8,
        borderRadius: '10px',
        background: 'rgba(255,255,255,0.9)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        border: '1px solid rgba(0,0,0,0.06)',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: 0.75,
        boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
        '&:hover': {
          background: 'rgba(255,255,255,0.98)',
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
        },
        transition: 'all 0.2s',
      }}
    >
      <Typography sx={{ fontSize: 14, color: '#64748B', fontWeight: 600, letterSpacing: '-0.01em' }}>
        ← {title}
      </Typography>
    </Box>
  );
}
