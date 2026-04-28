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
        <Box sx={{ px: 2.25, pt: 2, display: 'flex', justifyContent: 'flex-end', position: 'relative', zIndex: 1 }}>
          <Box
            sx={{
              background: '#FFFFFF',
              color: accent,
              border: `1px solid ${accent}40`,
              borderRadius: '999px',
              px: 1.4,
              py: 0.45,
              fontSize: '0.62rem',
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
            px: { xs: 1.75, md: 2.5 },
            pb: { xs: 1.75, md: 2.25 },
            pt: 1,
            position: 'relative',
            zIndex: 1,
          }}
        >
          {/* Icon plate */}
          <Box
            sx={{
              width: { xs: 68, md: 84 },
              height: { xs: 68, md: 84 },
              borderRadius: '22px',
              background: `linear-gradient(140deg, ${accent} 0%, ${accent}D0 100%)`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: `0 10px 28px ${accent}55, inset 0 -3px 8px rgba(0,0,0,0.12), inset 0 2px 4px rgba(255,255,255,0.25)`,
              flexShrink: 0,
              mb: 1.2,
            }}
          >
            <Typography sx={{ fontSize: { xs: 36, md: 44 }, lineHeight: 1, filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.15))' }}>
              {icon}
            </Typography>
          </Box>

          {/* Title */}
          <Typography
            sx={{
              fontWeight: 800,
              color: '#0F172A',
              lineHeight: 1.1,
              fontSize: { xs: '1.1rem', md: '1.32rem' },
              letterSpacing: '-0.02em',
            }}
          >
            {title}
          </Typography>

          {/* Inspired by */}
          <Typography
            sx={{
              mt: 0.3,
              color: '#7A8A9E',
              fontSize: { xs: '0.7rem', md: '0.74rem' },
              fontStyle: 'italic',
              fontWeight: 500,
            }}
          >
            inspired by {inspiredBy}
          </Typography>

          {/* Description */}
          <Typography
            sx={{
              mt: 1,
              color: '#475569',
              lineHeight: 1.45,
              fontSize: { xs: '0.78rem', md: '0.84rem' },
              fontWeight: 500,
            }}
          >
            {description}
          </Typography>

          {/* What you'll learn */}
          <Box
            sx={{
              mt: 1.1,
              alignSelf: 'stretch',
              background: `${accent}12`,
              border: `1px solid ${accent}28`,
              borderRadius: '10px',
              px: 1.25,
              py: 0.7,
              display: 'flex',
              alignItems: 'center',
              gap: 0.6,
              textAlign: 'left',
            }}
          >
            <Box sx={{ fontSize: '0.85rem', lineHeight: 1, flexShrink: 0 }}>📚</Box>
            <Typography
              sx={{
                color: '#1E293B',
                fontSize: { xs: '0.7rem', md: '0.74rem' },
                fontWeight: 600,
                lineHeight: 1.3,
              }}
            >
              <Box component="span" sx={{ color: accent, fontWeight: 800 }}>Learn:</Box>{' '}
              {learn}
            </Typography>
          </Box>

          {/* Meta row */}
          <Box
            sx={{
              mt: 0.85,
              alignSelf: 'stretch',
              display: 'flex',
              justifyContent: 'center',
              gap: 1.25,
              fontSize: { xs: '0.68rem', md: '0.72rem' },
              color: '#64748B',
              fontWeight: 600,
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.4 }}>
              <Box component="span" sx={{ fontSize: '0.85rem' }}>⚡</Box>
              {difficulty}
            </Box>
            <Box sx={{ width: '1px', background: '#CBD5E1' }} />
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.4 }}>
              <Box component="span" sx={{ fontSize: '0.85rem' }}>⏱</Box>
              {playTime}
            </Box>
          </Box>

          <Box sx={{ flex: 1, minHeight: 6 }} />

          {/* Play CTA */}
          <Box
            sx={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 0.6,
              py: { xs: 1.1, md: 1.3 },
              borderRadius: '14px',
              background: available
                ? `linear-gradient(135deg, ${accent} 0%, ${accent}E6 100%)`
                : '#E0E0E0',
              color: available ? '#FFFFFF' : '#9E9E9E',
              fontWeight: 800,
              fontSize: { xs: '0.88rem', md: '0.96rem' },
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
              flexShrink: 0,
              boxShadow: available ? `0 6px 16px ${accent}55, inset 0 1px 0 rgba(255,255,255,0.25)` : 'none',
            }}
          >
            <Box component="span" sx={{ fontSize: '0.85em' }}>▶</Box>
            {available ? 'Play Now' : 'Coming Soon'}
          </Box>
        </Box>
      </Box>
    </motion.div>
  );
}
