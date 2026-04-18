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
      initial={{ opacity: 0, y: 16, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.35, delay: index * 0.06, ease: 'easeOut' }}
      style={{ height: '100%' }}
    >
      <Box
        onClick={available ? () => navigate(`/games/${id}`) : undefined}
        sx={{
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          background: `linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.03) 100%)`,
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: '16px',
          overflow: 'hidden',
          cursor: available ? 'pointer' : 'default',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          '&:hover': available ? {
            transform: 'translateY(-4px) scale(1.02)',
            boxShadow: `0 12px 40px ${color}30, 0 0 60px ${color}10`,
            border: `1px solid ${color}50`,
            background: `linear-gradient(135deg, ${color}15 0%, rgba(255,255,255,0.06) 100%)`,
          } : {},
        }}
      >
        {/* Glow accent top */}
        <Box sx={{
          height: 2,
          background: `linear-gradient(90deg, transparent 0%, ${color} 50%, transparent 100%)`,
          opacity: 0.7,
        }} />

        <Box sx={{ p: { xs: 1.5, sm: 2, md: 2.5 }, flex: 1, display: 'flex', flexDirection: 'column' }}>
          {/* Icon — large, prominent */}
          <Box sx={{
            width: { xs: 48, sm: 56, md: 64 },
            height: { xs: 48, sm: 56, md: 64 },
            borderRadius: '14px',
            background: `${color}18`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: `0 0 20px ${color}15`,
            mb: 1.5,
          }}>
            <Typography sx={{
              fontSize: { xs: '28px', sm: '32px', md: '36px' },
              lineHeight: 1,
              filter: `drop-shadow(0 0 8px ${color}40)`,
            }}>
              {icon}
            </Typography>
          </Box>

          {/* Title */}
          <Typography sx={{
            fontWeight: 700, color: '#FFFFFF', lineHeight: 1.2,
            fontSize: { xs: '0.9rem', sm: '1rem', md: '1.1rem' },
            letterSpacing: '-0.01em',
            mb: 0.5,
          }}>
            {title}
          </Typography>

          {/* Tags */}
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 1 }}>
            {tags.map((tag) => (
              <Chip
                key={tag}
                label={tag}
                size="small"
                sx={{
                  background: `${color}15`,
                  color: color,
                  border: `1px solid ${color}25`,
                  fontWeight: 600,
                  fontSize: { xs: '0.6rem', md: '0.65rem' },
                  height: 20,
                  '& .MuiChip-label': { px: 0.8 },
                }}
              />
            ))}
          </Box>

          {/* Description */}
          <Typography sx={{
            color: 'rgba(255,255,255,0.5)', lineHeight: 1.5, flex: 1,
            fontSize: { xs: '0.72rem', sm: '0.78rem', md: '0.82rem' },
            mb: 1.5,
          }}>
            {description}
          </Typography>

          {/* Play CTA */}
          <Box sx={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            py: { xs: 0.7, md: 0.9 }, borderRadius: '10px',
            background: available ? `linear-gradient(135deg, ${color} 0%, ${color}CC 100%)` : 'rgba(255,255,255,0.05)',
            color: available ? '#FFFFFF' : 'rgba(255,255,255,0.2)',
            fontWeight: 700, fontSize: { xs: '0.72rem', md: '0.82rem' },
            letterSpacing: '0.02em',
            transition: 'all 0.2s',
            boxShadow: available ? `0 4px 15px ${color}40` : 'none',
          }}>
            {available ? '▶  Play Now' : 'Coming Soon'}
          </Box>
        </Box>
      </Box>
    </motion.div>
  );
}
