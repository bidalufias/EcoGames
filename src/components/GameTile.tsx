import { Box, Typography, Chip } from '@mui/material';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import EcoCard from './EcoCard';

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
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.08, ease: 'easeOut' }}
      style={{ height: '100%' }}
    >
      <EcoCard hoverable onClick={available ? () => navigate(`/games/${id}`) : undefined}>
        {/* Color accent top bar */}
        <Box
          sx={{
            height: 4,
            background: `linear-gradient(90deg, ${color}, ${color}88)`,
          }}
        />

        <Box sx={{ p: { xs: 2.5, md: 3 }, textAlign: 'center' }}>
          {/* Icon */}
          <Typography
            sx={{
              fontSize: { xs: '48px', md: '56px' },
              lineHeight: 1,
              mb: 1,
              filter: `drop-shadow(0 2px 8px ${color}30)`,
            }}
          >
            {icon}
          </Typography>

          {/* Title */}
          <Typography
            variant="h5"
            sx={{
              fontWeight: 700,
              mb: 0.75,
              color: '#1A2332',
              fontSize: { xs: '1.1rem', md: '1.25rem' },
            }}
          >
            {title}
          </Typography>

          {/* Description */}
          <Typography
            variant="body2"
            sx={{
              color: '#5A6A7E',
              mb: 2,
              lineHeight: 1.5,
              fontSize: { xs: '0.85rem', md: '0.9rem' },
              minHeight: 40,
            }}
          >
            {description}
          </Typography>

          {/* Tags */}
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75, justifyContent: 'center' }}>
            {tags.map((tag) => (
              <Chip
                key={tag}
                label={tag}
                size="small"
                sx={{
                  background: `${color}12`,
                  color: color,
                  border: `1px solid ${color}25`,
                  fontWeight: 500,
                  fontSize: '0.7rem',
                  height: 24,
                  '& .MuiChip-label': { px: 1 },
                }}
              />
            ))}
          </Box>

          {/* Play CTA */}
          <Box
            sx={{
              mt: 2,
              py: 1,
              px: 3,
              borderRadius: '10px',
              background: available ? `linear-gradient(135deg, ${color}15, ${color}08)` : 'transparent',
              color: available ? color : '#A0AABB',
              fontWeight: 600,
              fontSize: '0.95rem',
              border: available ? `1px solid ${color}25` : '1px solid #D0D8E2',
            }}
          >
            {available ? '▶ Play Now' : 'Coming Soon'}
          </Box>
        </Box>
      </EcoCard>
    </motion.div>
  );
}
