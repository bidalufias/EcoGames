import { Box, Typography } from '@mui/material';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

interface GameTileProps {
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
  index?: number;
}

export default function GameTile({
  id,
  title,
  inspiredBy,
  topic,
  description,
  learn,
  difficulty,
  playTime,
  icon,
  accent,
  available,
  index = 0,
}: GameTileProps) {
  const navigate = useNavigate();

  return (
    <motion.div
      initial={{ opacity: 0, y: 16, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.36, delay: index * 0.06, ease: [0.16, 1, 0.3, 1] }}
      style={{ height: '100%', display: 'flex', minHeight: 0 }}
    >
      <Box
        onClick={available ? () => navigate(`/games/${id}`) : undefined}
        sx={{
          flex: 1,
          minHeight: 0,
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          background: `linear-gradient(155deg, ${accent}26 0%, ${accent}10 38%, #FFFFFF 100%)`,
          border: `1px solid ${accent}38`,
          borderRadius: '24px',
          overflow: 'hidden',
          cursor: available ? 'pointer' : 'default',
          touchAction: 'manipulation',
          WebkitTapHighlightColor: 'transparent',
          userSelect: 'none',
          boxShadow: `0 6px 24px ${accent}1F, 0 1px 2px rgba(15,23,42,0.04)`,
          transition: 'transform 0.18s ease, box-shadow 0.28s ease, border-color 0.28s ease',
          '@media (hover: hover)': {
            '&:hover': available
              ? {
                  transform: 'translateY(-5px)',
                  boxShadow: `0 18px 40px ${accent}38, 0 2px 6px rgba(15,23,42,0.06)`,
                  borderColor: `${accent}66`,
                }
              : {},
          },
          '&:active': available
            ? { transform: 'scale(0.975)', boxShadow: `0 3px 10px ${accent}30` }
            : {},
        }}
      >
        {/* Decorative watermark icon (corner) */}
        <Box
          aria-hidden
          sx={{
            position: 'absolute',
            right: -18,
            top: -10,
            fontSize: 140,
            opacity: 0.07,
            color: accent,
            pointerEvents: 'none',
            transform: 'rotate(-12deg)',
            lineHeight: 1,
            userSelect: 'none',
          }}
        >
          {icon}
        </Box>

        {/* Topic chip */}
        <Box sx={{ px: 2, pt: 1.4, display: 'flex', justifyContent: 'flex-end', position: 'relative', zIndex: 1 }}>
          <Box
            sx={{
              background: '#FFFFFF',
              color: accent,
              border: `1px solid ${accent}40`,
              borderRadius: '999px',
              px: 1.2,
              py: 0.35,
              fontSize: '0.6rem',
              fontWeight: 800,
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              lineHeight: 1,
              boxShadow: `0 1px 3px ${accent}20`,
            }}
          >
            {topic}
          </Box>
        </Box>

        {/* Body */}
        <Box
          sx={{
            flex: 1,
            minHeight: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center',
            px: { xs: 1.5, md: 2 },
            pb: { xs: 1.25, md: 1.5 },
            pt: 0.4,
            position: 'relative',
            zIndex: 1,
          }}
        >
          {/* Icon plate */}
          <Box
            sx={{
              width: { xs: 56, md: 66 },
              height: { xs: 56, md: 66 },
              borderRadius: '18px',
              background: `linear-gradient(140deg, ${accent} 0%, ${accent}D0 100%)`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: `0 8px 22px ${accent}50, inset 0 -3px 8px rgba(0,0,0,0.12), inset 0 2px 4px rgba(255,255,255,0.25)`,
              flexShrink: 0,
              mb: 0.6,
            }}
          >
            <Typography sx={{ fontSize: { xs: 30, md: 36 }, lineHeight: 1, filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.15))' }}>
              {icon}
            </Typography>
          </Box>

          {/* Title */}
          <Typography
            sx={{
              fontWeight: 800,
              color: '#0F172A',
              lineHeight: 1.1,
              fontSize: { xs: '0.98rem', md: '1.15rem' },
              letterSpacing: '-0.02em',
            }}
          >
            {title}
          </Typography>

          {/* Inspired by */}
          <Typography
            sx={{
              mt: 0.15,
              color: '#7A8A9E',
              fontSize: { xs: '0.65rem', md: '0.7rem' },
              fontStyle: 'italic',
              fontWeight: 500,
              lineHeight: 1.2,
            }}
          >
            inspired by {inspiredBy}
          </Typography>

          {/* Description */}
          <Typography
            sx={{
              mt: 0.55,
              color: '#475569',
              lineHeight: 1.35,
              fontSize: { xs: '0.72rem', md: '0.78rem' },
              fontWeight: 500,
            }}
          >
            {description}
          </Typography>

          {/* Spacer pushes the rest to the bottom when there's room */}
          <Box sx={{ flex: 1, minHeight: 4 }} />

          {/* What you'll learn */}
          <Box
            sx={{
              alignSelf: 'stretch',
              background: `${accent}14`,
              border: `1px solid ${accent}2E`,
              borderRadius: '10px',
              px: 1.1,
              py: 0.45,
              display: 'flex',
              alignItems: 'center',
              gap: 0.55,
              textAlign: 'left',
              flexShrink: 0,
            }}
          >
            <Box sx={{ fontSize: '0.8rem', lineHeight: 1, flexShrink: 0 }}>📚</Box>
            <Typography
              sx={{
                color: '#1E293B',
                fontSize: { xs: '0.66rem', md: '0.7rem' },
                fontWeight: 600,
                lineHeight: 1.25,
              }}
            >
              <Box component="span" sx={{ color: accent, fontWeight: 800 }}>Learn:</Box>{' '}
              {learn}
            </Typography>
          </Box>

          {/* Meta row */}
          <Box
            sx={{
              mt: 0.5,
              alignSelf: 'stretch',
              display: 'flex',
              justifyContent: 'center',
              gap: 1,
              fontSize: { xs: '0.64rem', md: '0.68rem' },
              color: '#64748B',
              fontWeight: 600,
              lineHeight: 1,
              flexShrink: 0,
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.35 }}>
              <Box component="span" sx={{ fontSize: '0.78rem' }}>⚡</Box>
              {difficulty}
            </Box>
            <Box sx={{ width: '1px', background: '#CBD5E1' }} />
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.35 }}>
              <Box component="span" sx={{ fontSize: '0.78rem' }}>⏱</Box>
              {playTime}
            </Box>
          </Box>

          {/* Play CTA */}
          <Box
            sx={{
              mt: 0.85,
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 0.5,
              py: { xs: 0.85, md: 1 },
              borderRadius: '12px',
              background: available
                ? `linear-gradient(135deg, ${accent} 0%, ${accent}E6 100%)`
                : '#E0E0E0',
              color: available ? '#FFFFFF' : '#9E9E9E',
              fontWeight: 800,
              fontSize: { xs: '0.78rem', md: '0.86rem' },
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
              flexShrink: 0,
              boxShadow: available ? `0 5px 14px ${accent}50, inset 0 1px 0 rgba(255,255,255,0.25)` : 'none',
            }}
          >
            <Box component="span" sx={{ fontSize: '0.78em' }}>▶</Box>
            {available ? 'Play Now' : 'Coming Soon'}
          </Box>
        </Box>
      </Box>
    </motion.div>
  );
}
