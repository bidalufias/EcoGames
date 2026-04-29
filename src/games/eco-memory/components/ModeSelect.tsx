import { useState } from 'react';
import { Box, Typography } from '@mui/material';
import { motion } from 'framer-motion';
import { DIFFICULTIES, CLIMATE_PAIRS, type Difficulty } from '../data';
import { ACCENT, ACCENT_RING, EMOJI_FONT, PAPER, PAPER_GRAIN } from '../theme';

export type Mode = 'solo' | 'versus';

export interface GameSettings {
  difficulty: Difficulty;
  studyMode: boolean;
}

interface ModeSelectProps {
  onPick: (mode: Mode, settings: GameSettings) => void;
}

const SETTINGS_KEY = 'eco-memory:settings';

interface PersistedSettings {
  difficulty: Difficulty;
  studyMode: boolean;
}

function loadSettings(): PersistedSettings {
  if (typeof window === 'undefined') return { difficulty: 'medium', studyMode: false };
  try {
    const raw = window.localStorage.getItem(SETTINGS_KEY);
    if (!raw) return { difficulty: 'medium', studyMode: false };
    const parsed = JSON.parse(raw) as Partial<PersistedSettings>;
    const difficulty: Difficulty =
      parsed.difficulty === 'easy' || parsed.difficulty === 'hard' ? parsed.difficulty : 'medium';
    return { difficulty, studyMode: !!parsed.studyMode };
  } catch {
    return { difficulty: 'medium', studyMode: false };
  }
}

function saveSettings(s: PersistedSettings) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(SETTINGS_KEY, JSON.stringify(s));
  } catch {
    // localStorage full or disabled — ignore.
  }
}

interface ModeCardProps {
  title: string;
  tagline: string;
  bullets: string[];
  emoji: string;
  index: number;
  onPick: () => void;
}

function ModeCard({ title, tagline, bullets, emoji, index, onPick }: ModeCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.34, delay: 0.1 + index * 0.06, ease: [0.16, 1, 0.3, 1] }}
      style={{ flex: 1, display: 'flex', minWidth: 0, minHeight: 0 }}
    >
      <Box
        role="button"
        tabIndex={0}
        aria-label={`${title}: ${tagline}`}
        onClick={onPick}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onPick();
          }
        }}
        sx={{
          flex: 1,
          minWidth: 0,
          minHeight: 0,
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          gap: 'clamp(5px, 1.1cqh, 9px)',
          padding: 'clamp(10px, 2.2cqh, 18px)',
          background: PAPER.surface,
          border: `1px solid ${ACCENT}33`,
          borderRadius: 'clamp(10px, 2.2cqmin, 16px)',
          cursor: 'pointer',
          touchAction: 'manipulation',
          WebkitTapHighlightColor: 'transparent',
          userSelect: 'none',
          boxShadow: '0 1px 2px rgba(31,27,20,0.04), 0 4px 14px rgba(31,27,20,0.05)',
          transition: 'transform 0.18s ease, box-shadow 0.28s ease, border-color 0.28s ease',
          '@media (hover: hover)': {
            '&:hover': {
              transform: 'translateY(-2px)',
              boxShadow: `0 2px 4px rgba(31,27,20,0.05), 0 10px 22px ${ACCENT}26`,
              borderColor: `${ACCENT}66`,
            },
          },
          '&:focus-visible': {
            outline: `3px solid ${ACCENT}`,
            outlineOffset: 3,
          },
          '&:active': { transform: 'scale(0.99)' },
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 'clamp(8px, 1.6cqmin, 12px)' }}>
          <Box
            aria-hidden
            sx={{
              width: 'clamp(32px, 6.5cqh, 46px)',
              height: 'clamp(32px, 6.5cqh, 46px)',
              flexShrink: 0,
              borderRadius: 'clamp(8px, 1.6cqmin, 12px)',
              background: `linear-gradient(160deg, ${ACCENT}1F 0%, ${ACCENT}10 100%)`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 'clamp(1rem, 3.2cqh, 1.45rem)',
              fontFamily: EMOJI_FONT,
              filter: `drop-shadow(0 2px 6px ${ACCENT}30)`,
            }}
          >
            {emoji}
          </Box>
          <Typography
            component="h2"
            sx={{
              m: 0,
              flex: 1,
              minWidth: 0,
              color: PAPER.ink,
              fontSize: 'clamp(1rem, 2.8cqh, 1.4rem)',
              fontWeight: 800,
              letterSpacing: '-0.025em',
              lineHeight: 1.05,
            }}
          >
            {title}
          </Typography>
          <Typography
            component="span"
            sx={{
              flexShrink: 0,
              color: ACCENT,
              fontSize: 'clamp(0.74rem, 1.8cqh, 0.9rem)',
              fontWeight: 800,
              letterSpacing: '0.02em',
            }}
          >
            Play <Box component="span" aria-hidden>→</Box>
          </Typography>
        </Box>

        <Typography
          sx={{
            color: PAPER.subInk,
            fontSize: 'clamp(0.72rem, 1.7cqh, 0.86rem)',
            fontWeight: 500,
            lineHeight: 1.35,
          }}
        >
          {tagline}
        </Typography>

        <Box
          component="ul"
          sx={{
            m: 0,
            pl: 0,
            listStyle: 'none',
            display: 'flex',
            flexDirection: 'column',
            gap: 'clamp(2px, 0.6cqh, 5px)',
            flex: 1,
            minHeight: 0,
            borderTop: `1px solid ${PAPER.hairline}`,
            pt: 'clamp(5px, 1cqh, 8px)',
          }}
        >
          {bullets.map(b => (
            <Box
              key={b}
              component="li"
              sx={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 'clamp(5px, 1.2cqmin, 8px)',
                color: PAPER.ink,
                fontSize: 'clamp(0.66rem, 1.5cqh, 0.78rem)',
                fontWeight: 500,
                lineHeight: 1.3,
              }}
            >
              <Box
                aria-hidden
                sx={{
                  flexShrink: 0,
                  width: 'clamp(3px, 0.6cqmin, 5px)',
                  height: 'clamp(3px, 0.6cqmin, 5px)',
                  borderRadius: '50%',
                  background: ACCENT,
                  mt: 'clamp(5px, 1.1cqh, 7px)',
                }}
              />
              <Box component="span" sx={{ minWidth: 0 }}>{b}</Box>
            </Box>
          ))}
        </Box>
      </Box>
    </motion.div>
  );
}

interface DifficultyPillProps {
  difficulty: Difficulty;
  selected: boolean;
  onSelect: () => void;
}

function DifficultyPill({ difficulty, selected, onSelect }: DifficultyPillProps) {
  const def = DIFFICULTIES[difficulty];
  return (
    <Box
      component="button"
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      sx={{
        cursor: 'pointer',
        background: selected ? ACCENT : PAPER.surface,
        color: selected ? '#FFFFFF' : PAPER.ink,
        border: `1px solid ${selected ? ACCENT : PAPER.hairline}`,
        borderRadius: 999,
        px: 'clamp(10px, 2cqmin, 16px)',
        py: 'clamp(6px, 1.2cqh, 9px)',
        fontFamily: 'inherit',
        fontSize: 'clamp(0.72rem, 1.7cqh, 0.85rem)',
        fontWeight: 700,
        letterSpacing: '0.02em',
        display: 'inline-flex',
        alignItems: 'center',
        gap: 'clamp(4px, 0.9cqmin, 7px)',
        transition: 'background 0.15s, border-color 0.15s, color 0.15s',
        '&:hover': !selected ? { borderColor: ACCENT_RING, background: '#FFFFFF' } : {},
        '&:focus-visible': {
          outline: `2px solid ${ACCENT}`,
          outlineOffset: 2,
        },
      }}
    >
      <Box component="span" sx={{ fontFamily: EMOJI_FONT, lineHeight: 1 }}>{def.emoji}</Box>
      {def.label}
      <Box
        component="span"
        sx={{
          opacity: selected ? 0.85 : 0.55,
          fontWeight: 600,
          fontSize: '0.85em',
          letterSpacing: 0,
        }}
      >
        · {def.pairCount} pairs
      </Box>
    </Box>
  );
}

export default function ModeSelect({ onPick }: ModeSelectProps) {
  const initial = loadSettings();
  const [difficulty, setDifficulty] = useState<Difficulty>(initial.difficulty);
  const [studyMode, setStudyMode] = useState<boolean>(initial.studyMode);

  const handlePick = (mode: Mode) => {
    saveSettings({ difficulty, studyMode });
    onPick(mode, { difficulty, studyMode });
  };

  const visiblePairs = CLIMATE_PAIRS.slice(0, DIFFICULTIES[difficulty].pairCount);

  return (
    <Box
      sx={{
        height: '100%',
        width: '100%',
        background: PAPER.bg,
        backgroundImage: PAPER_GRAIN,
        backgroundRepeat: 'repeat',
        backgroundSize: '220px 220px',
        color: PAPER.ink,
        display: 'flex',
        flexDirection: 'column',
        // Leave clear space at top for absolutely-positioned BackToHome (left)
        // and MgtcLogo (right) provided by App.tsx.
        pt: 'clamp(46px, 9cqh, 74px)',
        pb: 'clamp(12px, 2.4cqh, 22px)',
        px: 'clamp(16px, 3.5cqw, 44px)',
        gap: 'clamp(10px, 2cqh, 18px)',
        overflow: 'hidden',
      }}
    >
      {/* Title block */}
      <Box sx={{ textAlign: 'center', flexShrink: 0 }}>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
        >
          <Typography
            component="span"
            sx={{
              display: 'inline-block',
              color: ACCENT,
              fontSize: 'clamp(0.6rem, 1.4cqh, 0.72rem)',
              fontWeight: 800,
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              mb: 'clamp(4px, 0.9cqh, 8px)',
            }}
          >
            Climate Knowledge · A Memory Match
          </Typography>
          <Typography
            component="h1"
            sx={{
              m: 0,
              fontSize: 'clamp(1.4rem, 4.2cqh, 2.6rem)',
              fontWeight: 900,
              lineHeight: 1,
              letterSpacing: '-0.035em',
              color: PAPER.ink,
            }}
          >
            Eco Memory
          </Typography>
          <Typography
            sx={{
              mt: 'clamp(4px, 0.9cqh, 8px)',
              color: PAPER.subInk,
              fontSize: 'clamp(0.78rem, 1.7cqh, 0.95rem)',
              fontWeight: 500,
              maxWidth: 560,
              mx: 'auto',
              lineHeight: 1.35,
            }}
          >
            Match each climate concept to its real-world example, and unlock a plain-English explanation with every pair.
          </Typography>
        </motion.div>
      </Box>

      {/* Settings strip: difficulty pills + study toggle */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.06, ease: 'easeOut' }}
        style={{ flexShrink: 0 }}
      >
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 'clamp(8px, 2cqmin, 18px)',
            flexWrap: 'wrap',
          }}
        >
          <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 'clamp(6px, 1.2cqmin, 10px)' }}>
            <Typography
              component="span"
              sx={{
                color: PAPER.meta,
                fontSize: 'clamp(0.6rem, 1.4cqh, 0.7rem)',
                fontWeight: 800,
                letterSpacing: '0.16em',
                textTransform: 'uppercase',
              }}
            >
              Difficulty
            </Typography>
            <Box sx={{ display: 'inline-flex', gap: 'clamp(5px, 1cqmin, 8px)', flexWrap: 'wrap' }}>
              {(['easy', 'medium', 'hard'] as const).map(d => (
                <DifficultyPill
                  key={d}
                  difficulty={d}
                  selected={difficulty === d}
                  onSelect={() => setDifficulty(d)}
                />
              ))}
            </Box>
          </Box>

          <Box
            component="button"
            type="button"
            onClick={() => setStudyMode(s => !s)}
            aria-pressed={studyMode}
            sx={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 'clamp(6px, 1.3cqmin, 10px)',
              cursor: 'pointer',
              fontFamily: 'inherit',
              background: studyMode ? `${ACCENT}10` : PAPER.surface,
              border: `1px solid ${studyMode ? ACCENT : PAPER.hairline}`,
              borderRadius: 999,
              px: 'clamp(10px, 2cqmin, 14px)',
              py: 'clamp(6px, 1.2cqh, 9px)',
              transition: 'background 0.15s, border-color 0.15s',
              '&:hover': !studyMode ? { borderColor: ACCENT_RING } : {},
              '&:focus-visible': {
                outline: `2px solid ${ACCENT}`,
                outlineOffset: 2,
              },
            }}
          >
            <Box
              aria-hidden
              sx={{
                width: 'clamp(14px, 2.6cqmin, 18px)',
                height: 'clamp(14px, 2.6cqmin, 18px)',
                flexShrink: 0,
                borderRadius: '4px',
                background: studyMode ? ACCENT : PAPER.surface,
                border: `1.5px solid ${studyMode ? ACCENT : PAPER.faded}`,
                color: '#FFFFFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.75em',
                fontWeight: 900,
              }}
            >
              {studyMode ? '✓' : ''}
            </Box>
            <Typography
              component="span"
              sx={{
                color: PAPER.ink,
                fontSize: 'clamp(0.72rem, 1.7cqh, 0.85rem)',
                fontWeight: 700,
              }}
            >
              Study mode
            </Typography>
            <Typography
              component="span"
              sx={{
                color: PAPER.meta,
                fontSize: 'clamp(0.66rem, 1.5cqh, 0.78rem)',
                fontWeight: 500,
                fontStyle: 'italic',
              }}
            >
              reveal all first
            </Typography>
          </Box>
        </Box>
      </motion.div>

      {/* Two-column main: stacked mode picks on the left, the bigger
          glossary spread on the right. The picks are nav; the glossary is
          the educational content, so it gets the room. */}
      <Box
        sx={{
          flex: 1,
          minHeight: 0,
          display: 'grid',
          gridTemplateColumns: 'minmax(220px, 28%) 1fr',
          gap: 'clamp(12px, 2.4cqmin, 22px)',
          alignItems: 'stretch',
        }}
      >
        {/* Left column — mode picks, stacked. */}
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            gap: 'clamp(8px, 1.6cqh, 14px)',
            minHeight: 0,
          }}
        >
          <ModeCard
            title="Solo"
            tagline="Play at your own pace and chase a personal best."
            emoji="🎯"
            index={0}
            bullets={[
              'One player, no timer',
              'Streak bonuses for matches in a row',
              'Submit your score to the leaderboard',
            ]}
            onPick={() => handlePick('solo')}
          />
          <ModeCard
            title="Versus"
            tagline="Two players, one board — perfect for a tabletop iPad."
            emoji="⚔️"
            index={1}
            bullets={[
              'Take turns flipping pairs',
              'Match → keep the turn · Miss → opponent goes',
              'Most pairs at the end wins the round',
            ]}
            onPick={() => handlePick('versus')}
          />
        </Box>

        {/* Right column — glossary, the main educational content. */}
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            gap: 'clamp(6px, 1.2cqh, 10px)',
            minHeight: 0,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1, flexShrink: 0 }}>
            <Typography
              component="span"
              sx={{
                color: ACCENT,
                fontSize: 'clamp(0.6rem, 1.4cqh, 0.72rem)',
                fontWeight: 800,
                letterSpacing: '0.16em',
                textTransform: 'uppercase',
              }}
            >
              What you'll learn
            </Typography>
            <Typography
              component="span"
              sx={{
                color: PAPER.meta,
                fontSize: 'clamp(0.6rem, 1.4cqh, 0.72rem)',
                fontWeight: 600,
                fontStyle: 'italic',
              }}
            >
              · {visiblePairs.length} pairs · plain-English explanations
            </Typography>
          </Box>
          <Box
            sx={{
              flex: 1,
              minHeight: 0,
              overflowY: 'auto',
              display: 'grid',
              gridTemplateColumns: `repeat(auto-fit, minmax(clamp(180px, 16cqw, 240px), 1fr))`,
              gap: 'clamp(6px, 1.2cqmin, 10px)',
              pr: 'clamp(2px, 0.6cqmin, 6px)',
              alignContent: 'start',
            }}
          >
            {visiblePairs.map(p => (
              <Box
                key={p.label}
                sx={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 'clamp(8px, 1.4cqmin, 11px)',
                  px: 'clamp(8px, 1.4cqmin, 11px)',
                  py: 'clamp(6px, 1.1cqh, 9px)',
                  background: PAPER.surface,
                  border: `1px solid ${p.color}28`,
                  borderLeft: `3px solid ${p.color}`,
                  borderRadius: 'clamp(6px, 1.2cqmin, 10px)',
                  minWidth: 0,
                }}
              >
                <Box
                  aria-hidden
                  sx={{
                    fontSize: 'clamp(1rem, 2.2cqh, 1.25rem)',
                    fontFamily: EMOJI_FONT,
                    flexShrink: 0,
                    lineHeight: 1.1,
                  }}
                >
                  {p.emoji}
                </Box>
                <Box sx={{ minWidth: 0 }}>
                  <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 'clamp(4px, 0.8cqmin, 7px)', flexWrap: 'wrap' }}>
                    <Typography
                      component="span"
                      sx={{
                        color: p.color,
                        fontSize: 'clamp(0.78rem, 1.7cqh, 0.9rem)',
                        fontWeight: 800,
                        letterSpacing: '-0.005em',
                        lineHeight: 1.1,
                      }}
                    >
                      {p.label}
                    </Typography>
                    <Typography
                      component="span"
                      sx={{
                        color: PAPER.meta,
                        fontSize: 'clamp(0.62rem, 1.35cqh, 0.72rem)',
                        fontWeight: 600,
                        fontFamily: EMOJI_FONT,
                        lineHeight: 1.1,
                      }}
                    >
                      ↔ {p.sourceEmoji} {p.source}
                    </Typography>
                  </Box>
                  <Typography
                    sx={{
                      mt: 'clamp(2px, 0.4cqh, 4px)',
                      color: PAPER.subInk,
                      fontSize: 'clamp(0.66rem, 1.45cqh, 0.76rem)',
                      fontWeight: 500,
                      lineHeight: 1.4,
                    }}
                  >
                    {p.fact}
                  </Typography>
                </Box>
              </Box>
            ))}
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
