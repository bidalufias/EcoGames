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

// Fluid tokens — sized in container-query units against the card itself, so
// every element grows or shrinks with the card. clamp() keeps things legible
// on the smallest grid cell (~220×170) and stops them ballooning on huge
// displays. We use the minimum of cqh and cqw so the layout never blows out
// horizontally on landscape cards or vertically on portrait ones.
const FLUID = {
  pad: 'clamp(10px, 3cqmin, 22px)',
  rowGap: 'clamp(6px, 1.8cqmin, 14px)',
  headerGap: 'clamp(8px, 2.4cqmin, 16px)',
  iconPlate: 'clamp(44px, 18cqmin, 84px)',
  iconRadius: 'clamp(10px, 3cqmin, 18px)',
  iconFont: 'clamp(22px, 9cqmin, 44px)',
  topicPx: 'clamp(6px, 1.6cqmin, 10px)',
  topicPy: 'clamp(2px, 0.6cqmin, 4px)',
  topicFont: 'clamp(0.5rem, 1.5cqmin, 0.66rem)',
  titleFont: 'clamp(0.95rem, 4cqmin, 1.35rem)',
  inspiredFont: 'clamp(0.6rem, 1.7cqmin, 0.74rem)',
  descFont: 'clamp(0.74rem, 2.4cqmin, 0.92rem)',
  learnPx: 'clamp(8px, 2cqmin, 14px)',
  learnPy: 'clamp(5px, 1.4cqmin, 10px)',
  learnFont: 'clamp(0.7rem, 2.1cqmin, 0.85rem)',
  metaFont: 'clamp(0.62rem, 1.85cqmin, 0.78rem)',
  metaGap: 'clamp(6px, 1.6cqmin, 12px)',
  ctaPx: 'clamp(10px, 2.6cqmin, 18px)',
  ctaPy: 'clamp(6px, 1.8cqmin, 12px)',
  ctaRadius: 'clamp(8px, 1.8cqmin, 12px)',
  ctaFont: 'clamp(0.72rem, 2.1cqmin, 0.92rem)',
};

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
      style={{ height: '100%', display: 'flex', minHeight: 0, minWidth: 0 }}
    >
      <Box
        onClick={available ? () => navigate(`/games/${id}`) : undefined}
        sx={{
          flex: 1,
          minHeight: 0,
          minWidth: 0,
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          containerType: 'size',
          containerName: 'gametile',
          background: `linear-gradient(155deg, ${accent}26 0%, ${accent}10 38%, #FFFFFF 100%)`,
          border: `1px solid ${accent}38`,
          borderRadius: 'clamp(14px, 3cqmin, 22px)',
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
                  transform: 'translateY(-4px)',
                  boxShadow: `0 18px 40px ${accent}38, 0 2px 6px rgba(15,23,42,0.06)`,
                  borderColor: `${accent}66`,
                }
              : {},
          },
          '&:active': available
            ? { transform: 'scale(0.98)', boxShadow: `0 3px 10px ${accent}30` }
            : {},
        }}
      >
        {/* Decorative watermark */}
        <Box
          aria-hidden
          sx={{
            position: 'absolute',
            right: 'clamp(-22px, -2.5cqmin, -8px)',
            bottom: 'clamp(-22px, -2.5cqmin, -8px)',
            fontSize: 'clamp(80px, 28cqmin, 170px)',
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

        {/* Body — flex column anchored to top and bottom edges. The
            description flexes to take leftover space, so meta + CTA always
            sit at the bottom regardless of how tall the card is. */}
        <Box
          sx={{
            flex: 1,
            minHeight: 0,
            minWidth: 0,
            display: 'flex',
            flexDirection: 'column',
            padding: FLUID.pad,
            gap: FLUID.rowGap,
            position: 'relative',
            zIndex: 1,
          }}
        >
          {/* Header row: icon plate (left) + title block (right) */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: FLUID.headerGap,
              flexShrink: 0,
            }}
          >
            <Box
              sx={{
                width: FLUID.iconPlate,
                height: FLUID.iconPlate,
                borderRadius: FLUID.iconRadius,
                background: `linear-gradient(140deg, ${accent} 0%, ${accent}D0 100%)`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: `0 6px 18px ${accent}50, inset 0 -2px 6px rgba(0,0,0,0.12), inset 0 2px 4px rgba(255,255,255,0.25)`,
                flexShrink: 0,
              }}
            >
              <Typography
                sx={{
                  fontSize: FLUID.iconFont,
                  lineHeight: 1,
                  filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.15))',
                }}
              >
                {icon}
              </Typography>
            </Box>

            <Box sx={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 'clamp(2px, 0.6cqmin, 5px)' }}>
              <Box
                sx={{
                  alignSelf: 'flex-start',
                  background: '#FFFFFF',
                  color: accent,
                  border: `1px solid ${accent}40`,
                  borderRadius: '999px',
                  px: FLUID.topicPx,
                  py: FLUID.topicPy,
                  fontSize: FLUID.topicFont,
                  fontWeight: 800,
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                  lineHeight: 1,
                  boxShadow: `0 1px 3px ${accent}20`,
                  maxWidth: '100%',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {topic}
              </Box>
              <Typography
                sx={{
                  fontWeight: 800,
                  color: '#0F172A',
                  lineHeight: 1.1,
                  fontSize: FLUID.titleFont,
                  letterSpacing: '-0.02em',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {title}
              </Typography>
              <Typography
                sx={{
                  color: '#7A8A9E',
                  fontSize: FLUID.inspiredFont,
                  fontStyle: 'italic',
                  fontWeight: 500,
                  lineHeight: 1.2,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                inspired by {inspiredBy}
              </Typography>
            </Box>
          </Box>

          {/* Description — flexes to absorb extra vertical room. */}
          <Typography
            component="div"
            sx={{
              color: '#475569',
              lineHeight: 1.4,
              fontSize: FLUID.descFont,
              fontWeight: 500,
              flex: 1,
              minHeight: 0,
              display: '-webkit-box',
              WebkitLineClamp: 3,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {description}
          </Typography>

          {/* Learn box */}
          <Box
            sx={{
              background: `${accent}14`,
              border: `1px solid ${accent}2E`,
              borderRadius: 'clamp(8px, 1.6cqmin, 12px)',
              px: FLUID.learnPx,
              py: FLUID.learnPy,
              display: 'flex',
              alignItems: 'center',
              gap: 'clamp(5px, 1.2cqmin, 9px)',
              flexShrink: 0,
            }}
          >
            <Box sx={{ fontSize: 'clamp(0.85rem, 2.4cqmin, 1rem)', lineHeight: 1, flexShrink: 0 }}>📚</Box>
            <Typography
              component="div"
              sx={{
                color: '#1E293B',
                fontSize: FLUID.learnFont,
                fontWeight: 600,
                lineHeight: 1.3,
                minWidth: 0,
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
              }}
            >
              <Box component="span" sx={{ color: accent, fontWeight: 800 }}>Learn:</Box>{' '}
              {learn}
            </Typography>
          </Box>

          {/* Footer row anchored to the bottom: meta (left) + CTA (right) */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: FLUID.metaGap,
              flexShrink: 0,
            }}
          >
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: FLUID.metaGap,
                fontSize: FLUID.metaFont,
                color: '#64748B',
                fontWeight: 600,
                lineHeight: 1,
                minWidth: 0,
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 'clamp(2px, 0.6cqmin, 5px)' }}>
                <Box component="span" sx={{ fontSize: 'clamp(0.7rem, 2.1cqmin, 0.88rem)' }}>⚡</Box>
                {difficulty}
              </Box>
              <Box sx={{ width: '1px', height: '1em', background: '#CBD5E1' }} />
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 'clamp(2px, 0.6cqmin, 5px)' }}>
                <Box component="span" sx={{ fontSize: 'clamp(0.7rem, 2.1cqmin, 0.88rem)' }}>⏱</Box>
                {playTime}
              </Box>
            </Box>

            <Box
              sx={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 'clamp(4px, 1cqmin, 8px)',
                px: FLUID.ctaPx,
                py: FLUID.ctaPy,
                borderRadius: FLUID.ctaRadius,
                background: available
                  ? `linear-gradient(135deg, ${accent} 0%, ${accent}E6 100%)`
                  : '#E0E0E0',
                color: available ? '#FFFFFF' : '#9E9E9E',
                fontWeight: 800,
                fontSize: FLUID.ctaFont,
                letterSpacing: '0.04em',
                textTransform: 'uppercase',
                whiteSpace: 'nowrap',
                flexShrink: 0,
                boxShadow: available
                  ? `0 5px 14px ${accent}50, inset 0 1px 0 rgba(255,255,255,0.25)`
                  : 'none',
              }}
            >
              <Box component="span" sx={{ fontSize: '0.78em' }}>▶</Box>
              {available ? 'Play' : 'Soon'}
            </Box>
          </Box>
        </Box>
      </Box>
    </motion.div>
  );
}
