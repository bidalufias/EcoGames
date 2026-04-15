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
        position: 'fixed', top: 10, left: 10, zIndex: 1001,
        px: 2, py: 0.8, borderRadius: 2,
        background: 'rgba(255,255,255,0.88)', backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        border: '1px solid #E8EDF2', cursor: 'pointer',
        display: 'flex', alignItems: 'center', gap: 0.75,
        boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
        '&:hover': { background: 'rgba(255,255,255,0.96)', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' },
        transition: 'all 0.2s',
      }}
    >
      <Typography sx={{ fontSize: 15, color: '#5A6A7E', fontWeight: 600 }}>← {title}</Typography>
    </Box>
  );
}
