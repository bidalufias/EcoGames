import { Box, Typography, Chip } from '@mui/material';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

interface GameTileProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  color: string;
  available: boolean;
  tags: string[];
  index?: number;
}

export default function GameTile({ id, title, description, icon, color, available, tags, index = 0 }: GameTileProps) {
  const navigate = useNavigate();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.07, ease: 'easeOut' }}
      style={{ height: '100%' }}
    >
      <Box
        onClick={available ? () => navigate(`/games/${id}`) : undefined}
        sx={{
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          background: '#FFFFFF',
          border: '1px solid #F1F5F9',
          borderRadius: '16px',
          overflow: 'hidden',
          cursor: available ? 'pointer' : 'default',
          transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
          boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
          '&:hover': available ? {
            boxShadow: `0 8px 30px ${color}18, 0 2px 8px rgba(0,0,0,0.06)`,
            transform: 'translateY(-2px)',
            borderColor: `${color}40`,
          } : {},
        }}
      >
        {/* Color accent top bar */}
        <Box
          sx={{
            height: 3,
            background: color,
          }}
        />

        <Box sx={{ p: { xs: 2.5, md: 3 }, flex: 1, display: 'flex', flexDirection: 'column' }}>
          {/* Icon circle */}
          <Box
            sx={{
              width: { xs: 52, md: 60 },
              height: { xs: 52, md: 60 },
              borderRadius: '14px',
              background: `${color}10`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mb: 2,
            }}
          >
            <Typography sx={{ fontSize: { xs: '28px', md: '32px' }, lineHeight: 1 }}>
              {icon}
            </Typography>
          </Box>

          {/* Title */}
          <Typography
            sx={{
              fontWeight: 700,
              mb: 0.5,
              color: '#0F172A',
              fontSize: { xs: '1.05rem', md: '1.15rem' },
              letterSpacing: '-0.01em',
            }}
          >
            {title}
          </Typography>

          {/* Description */}
          <Typography
            sx={{
              color: '#64748B',
              mb: 2,
              lineHeight: 1.55,
              fontSize: { xs: '0.82rem', md: '0.88rem' },
              flex: 1,
            }}
          >
            {description}
          </Typography>

          {/* Tags */}
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 2 }}>
            {tags.map((tag) => (
              <Chip
                key={tag}
                label={tag}
                size="small"
                sx={{
                  background: '#F8FAFC',
                  color: '#64748B',
                  border: '1px solid #E2E8F0',
                  fontWeight: 500,
                  fontSize: '0.7rem',
                  height: 22,
                  '& .MuiChip-label': { px: 1 },
                }}
              />
            ))}
          </Box>

          {/* Play CTA */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 0.5,
              py: 1,
              borderRadius: '10px',
              background: available ? color : '#F1F5F9',
              color: available ? '#FFFFFF' : '#94A3B8',
              fontWeight: 600,
              fontSize: '0.85rem',
              transition: 'all 0.2s',
            }}
          >
            {available ? 'Play Now' : 'Coming Soon'}
          </Box>
        </Box>
      </Box>
    </motion.div>
  );
}
