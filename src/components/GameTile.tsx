import type { KeyboardEvent } from 'react';
import { Box, Typography } from '@mui/material';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

export type TileTemplate = 'headline' | 'index' | 'object';

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
  template: TileTemplate;
  number: number;
  index?: number;
}

const PAD = 'clamp(14px, 3.5cqmin, 28px)';
const META_FONT = 'clamp(0.62rem, 1.85cqmin, 0.78rem)';
const META_GAP = 'clamp(6px, 1.6cqmin, 12px)';

function MetaLine({ difficulty, playTime, accent }: { difficulty: string; playTime: string; accent: string }) {
  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: META_GAP,
        fontSize: META_FONT,
        color: '#5B5247',
        fontWeight: 600,
        lineHeight: 1,
        minWidth: 0,
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 'clamp(2px, 0.6cqmin, 5px)', color: accent }}>
        <Box component="span" aria-hidden sx={{ fontSize: 'clamp(0.7rem, 2.1cqmin, 0.88rem)' }}>◆</Box>
        {difficulty}
      </Box>
      <Box sx={{ width: '1px', height: '0.9em', background: '#D7CFC0' }} />
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 'clamp(2px, 0.6cqmin, 5px)' }}>
        <Box component="span" aria-hidden sx={{ fontSize: 'clamp(0.7rem, 2.1cqmin, 0.88rem)' }}>⏱</Box>
        {playTime}
      </Box>
    </Box>
  );
}

function InspiredBy({ inspiredBy }: { inspiredBy: string }) {
  return (
    <Typography
      className="tile-inspired"
      sx={{
        position: 'absolute',
        top: 'clamp(8px, 2cqmin, 14px)',
        right: 'clamp(10px, 2.4cqmin, 16px)',
        fontSize: 'clamp(0.55rem, 1.5cqmin, 0.68rem)',
        color: '#9C8E78',
        fontStyle: 'italic',
        fontWeight: 500,
        letterSpacing: '0.02em',
        opacity: 0,
        transition: 'opacity 0.18s ease',
        pointerEvents: 'none',
      }}
    >
      after {inspiredBy}
    </Typography>
  );
}

function HeadlineTile(props: GameTileProps) {
  const { title, description, learn, difficulty, playTime, icon, accent, inspiredBy } = props;
  return (
    <Box sx={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden' }}>
      <Box
        aria-hidden
        sx={{
          position: 'absolute',
          top: 'clamp(-30px, -6cqmin, -10px)',
          right: 'clamp(-22px, -3cqmin, -6px)',
          fontSize: 'clamp(110px, 38cqmin, 220px)',
          lineHeight: 1,
          filter: `drop-shadow(0 6px 14px ${accent}33)`,
          transform: 'rotate(-8deg)',
          pointerEvents: 'none',
          userSelect: 'none',
        }}
      >
        {icon}
      </Box>

      <Box
        sx={{
          position: 'relative',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          padding: PAD,
          gap: 'clamp(8px, 2cqmin, 16px)',
        }}
      >
        <Typography
          component="span"
          sx={{
            display: 'inline-block',
            alignSelf: 'flex-start',
            color: accent,
            fontSize: 'clamp(0.55rem, 1.6cqmin, 0.7rem)',
            fontWeight: 800,
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            lineHeight: 1,
          }}
        >
          {props.topic}
        </Typography>

        <Typography
          component="h3"
          sx={{
            m: 0,
            fontWeight: 900,
            color: '#1F1B14',
            lineHeight: 0.95,
            fontSize: 'clamp(1.5rem, 6.5cqmin, 2.6rem)',
            letterSpacing: '-0.035em',
            maxWidth: '70%',
          }}
        >
          {title}
        </Typography>

        <Typography
          component="div"
          sx={{
            color: '#3F3A2F',
            fontSize: 'clamp(0.78rem, 2.4cqmin, 0.95rem)',
            fontWeight: 500,
            lineHeight: 1.4,
            flex: 1,
            minHeight: 0,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            maxWidth: '90%',
          }}
        >
          {description}
        </Typography>

        <Box
          sx={{
            position: 'relative',
            paddingLeft: 'clamp(10px, 2.4cqmin, 16px)',
            borderLeft: `2px solid ${accent}`,
          }}
        >
          <Typography
            component="div"
            sx={{
              fontSize: 'clamp(0.7rem, 2.1cqmin, 0.85rem)',
              fontWeight: 600,
              color: accent,
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
              lineHeight: 1.1,
              mb: 'clamp(2px, 0.5cqmin, 4px)',
            }}
          >
            You{'’'}ll learn
          </Typography>
          <Typography
            component="div"
            sx={{
              color: '#1F1B14',
              fontSize: 'clamp(0.74rem, 2.2cqmin, 0.88rem)',
              fontWeight: 600,
              lineHeight: 1.35,
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {learn}
          </Typography>
        </Box>

        <Box sx={{ flexShrink: 0, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: META_GAP }}>
          <MetaLine difficulty={difficulty} playTime={playTime} accent={accent} />
          <Typography
            component="span"
            sx={{
              fontSize: 'clamp(0.72rem, 2.1cqmin, 0.92rem)',
              fontWeight: 700,
              color: accent,
              letterSpacing: '0.02em',
            }}
          >
            Play →
          </Typography>
        </Box>
      </Box>
      <InspiredBy inspiredBy={inspiredBy} />
    </Box>
  );
}

function IndexTile(props: GameTileProps) {
  const { number, title, description, learn, difficulty, playTime, accent, inspiredBy } = props;
  return (
    <Box sx={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden' }}>
      <Box
        sx={{
          position: 'relative',
          height: '100%',
          display: 'grid',
          gridTemplateColumns: 'auto 1fr',
          columnGap: 'clamp(12px, 3cqmin, 22px)',
          padding: PAD,
        }}
      >
        <Typography
          aria-hidden
          component="span"
          sx={{
            color: accent,
            fontSize: 'clamp(2.4rem, 12cqmin, 5rem)',
            fontWeight: 900,
            lineHeight: 0.8,
            letterSpacing: '-0.06em',
            fontFeatureSettings: '"tnum" 1, "lnum" 1',
            opacity: 0.92,
          }}
        >
          {String(number).padStart(2, '0')}
        </Typography>

        <Box sx={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
          <Typography
            component="span"
            sx={{
              color: '#7A6F5C',
              fontSize: 'clamp(0.55rem, 1.6cqmin, 0.7rem)',
              fontWeight: 700,
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              lineHeight: 1,
              mb: 'clamp(4px, 1cqmin, 8px)',
            }}
          >
            {props.topic}
          </Typography>

          <Typography
            component="h3"
            sx={{
              m: 0,
              fontWeight: 800,
              color: '#1F1B14',
              lineHeight: 1.05,
              fontSize: 'clamp(1.05rem, 4.4cqmin, 1.7rem)',
              letterSpacing: '-0.02em',
              mb: 'clamp(4px, 1cqmin, 8px)',
            }}
          >
            {title}
          </Typography>

          <Typography
            component="div"
            sx={{
              color: '#3F3A2F',
              fontSize: 'clamp(0.74rem, 2.3cqmin, 0.92rem)',
              fontWeight: 500,
              lineHeight: 1.45,
              display: '-webkit-box',
              WebkitLineClamp: 3,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              flex: 1,
              minHeight: 0,
              mb: 'clamp(8px, 2cqmin, 14px)',
            }}
          >
            {description}{' '}
            <Box component="span" sx={{ color: accent, fontWeight: 700 }}>
              {learn}.
            </Box>
          </Typography>

          <Box
            sx={{
              borderTop: '1px solid #E2D9C7',
              pt: 'clamp(6px, 1.5cqmin, 10px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: META_GAP,
            }}
          >
            <MetaLine difficulty={difficulty} playTime={playTime} accent={accent} />
            <Typography
              component="span"
              sx={{
                fontSize: 'clamp(0.72rem, 2.1cqmin, 0.92rem)',
                fontWeight: 700,
                color: accent,
                letterSpacing: '0.02em',
              }}
            >
              Play →
            </Typography>
          </Box>
        </Box>
      </Box>
      <InspiredBy inspiredBy={inspiredBy} />
    </Box>
  );
}

function ObjectTile(props: GameTileProps) {
  const { title, description, learn, difficulty, playTime, icon, accent, inspiredBy } = props;
  return (
    <Box sx={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden' }}>
      <Box
        aria-hidden
        sx={{
          position: 'absolute',
          inset: 0,
          background: `linear-gradient(180deg, ${accent}1F 0%, ${accent}0A 38%, transparent 38.1%)`,
          pointerEvents: 'none',
        }}
      />
      <Box
        aria-hidden
        sx={{
          position: 'absolute',
          top: 'clamp(8%, 9cqmin, 14%)',
          left: '50%',
          transform: 'translateX(-50%)',
          fontSize: 'clamp(48px, 18cqmin, 96px)',
          lineHeight: 1,
          filter: `drop-shadow(0 8px 14px ${accent}38)`,
          pointerEvents: 'none',
          userSelect: 'none',
        }}
      >
        {icon}
      </Box>

      <Box
        sx={{
          position: 'relative',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          padding: PAD,
          paddingTop: 'clamp(40%, 42cqmin, 46%)',
          gap: 'clamp(6px, 1.5cqmin, 10px)',
          textAlign: 'center',
        }}
      >
        <Typography
          component="span"
          sx={{
            color: accent,
            fontSize: 'clamp(0.55rem, 1.6cqmin, 0.7rem)',
            fontWeight: 800,
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            lineHeight: 1,
          }}
        >
          {props.topic}
        </Typography>

        <Typography
          component="h3"
          sx={{
            m: 0,
            fontWeight: 800,
            color: '#1F1B14',
            lineHeight: 1.05,
            fontSize: 'clamp(1.05rem, 4.4cqmin, 1.7rem)',
            letterSpacing: '-0.02em',
          }}
        >
          {title}
        </Typography>

        <Typography
          component="div"
          sx={{
            color: '#3F3A2F',
            fontSize: 'clamp(0.74rem, 2.3cqmin, 0.92rem)',
            fontWeight: 500,
            lineHeight: 1.4,
            flex: 1,
            minHeight: 0,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {description} <Box component="span" sx={{ color: accent, fontWeight: 700 }}>{learn}.</Box>
        </Typography>

        <Box
          sx={{
            mt: 'auto',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-end',
            gap: META_GAP,
            textAlign: 'left',
          }}
        >
          <MetaLine difficulty={difficulty} playTime={playTime} accent={accent} />
          <Typography
            component="span"
            sx={{
              fontSize: 'clamp(0.72rem, 2.1cqmin, 0.92rem)',
              fontWeight: 700,
              color: accent,
              letterSpacing: '0.02em',
            }}
          >
            Play →
          </Typography>
        </Box>
      </Box>
      <InspiredBy inspiredBy={inspiredBy} />
    </Box>
  );
}

export default function GameTile(props: GameTileProps) {
  const { id, title, description, accent, available, template, index = 0 } = props;
  const navigate = useNavigate();

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.36, delay: index * 0.06, ease: [0.16, 1, 0.3, 1] }}
      style={{ height: '100%', display: 'flex', minHeight: 0, minWidth: 0 }}
    >
      <Box
        role="button"
        tabIndex={available ? 0 : -1}
        aria-disabled={!available}
        aria-label={`Play ${title}: ${description}`}
        onClick={available ? () => navigate(`/games/${id}`) : undefined}
        onKeyDown={
          available
            ? (e: KeyboardEvent) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  navigate(`/games/${id}`);
                }
              }
            : undefined
        }
        sx={{
          flex: 1,
          minHeight: 0,
          minWidth: 0,
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          containerType: 'size',
          containerName: 'gametile',
          background: '#FFFCF5',
          border: `1px solid ${accent}26`,
          borderRadius: 'clamp(14px, 3cqmin, 22px)',
          overflow: 'hidden',
          cursor: available ? 'pointer' : 'not-allowed',
          touchAction: 'manipulation',
          WebkitTapHighlightColor: 'transparent',
          userSelect: 'none',
          boxShadow: '0 1px 2px rgba(31,27,20,0.04), 0 6px 18px rgba(31,27,20,0.05)',
          transition: 'transform 0.18s ease, box-shadow 0.28s ease, border-color 0.28s ease',
          '@media (hover: hover)': {
            '&:hover': available
              ? {
                  transform: 'translateY(-3px)',
                  boxShadow: `0 2px 4px rgba(31,27,20,0.06), 0 14px 28px ${accent}26`,
                  borderColor: `${accent}66`,
                  '& .tile-inspired': { opacity: 1 },
                }
              : {},
          },
          '&:focus-visible': {
            outline: `3px solid ${accent}`,
            outlineOffset: 3,
            '& .tile-inspired': { opacity: 1 },
          },
          '&:active': available ? { transform: 'scale(0.985)' } : {},
          opacity: available ? 1 : 0.6,
        }}
      >
        {template === 'headline' && <HeadlineTile {...props} />}
        {template === 'index' && <IndexTile {...props} />}
        {template === 'object' && <ObjectTile {...props} />}
      </Box>
    </motion.div>
  );
}
