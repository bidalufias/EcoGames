import { useState } from 'react';
import { Box, Typography } from '@mui/material';
import { motion } from 'framer-motion';
import EcoButton from '../../../components/EcoButton';
import { DIFFICULTIES, GHG_PAIRS, type Difficulty } from '../data';

export type Mode = 'solo' | 'versus';

export interface GameSettings {
  difficulty: Difficulty;
  studyMode: boolean;
}

interface ModeSelectProps {
  onPick: (mode: Mode, settings: GameSettings) => void;
}

interface ModeCardProps {
  title: string;
  tagline: string;
  emoji: string;
  accent: string;
  bullets: string[];
  onPick: () => void;
}

const EMOJI_FONT = '"Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif';
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

function ModeCard({ title, tagline, emoji, accent, bullets, onPick }: ModeCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      style={{ flex: 1, display: 'flex', minWidth: 0 }}
    >
      <Box
        onClick={onPick}
        sx={{
          flex: 1,
          cursor: 'pointer',
          background: '#FFFFFF',
          border: `2px solid ${accent}33`,
          borderRadius: 4,
          p: 3,
          display: 'flex',
          flexDirection: 'column',
          gap: 1.5,
          boxShadow: '0 8px 28px rgba(15,23,42,0.06)',
          transition: 'border-color 0.2s, box-shadow 0.2s',
          '&:hover': {
            borderColor: accent,
            boxShadow: `0 12px 36px ${accent}33`,
          },
        }}
      >
        <Box
          sx={{
            width: 56,
            height: 56,
            borderRadius: 3,
            background: `${accent}1A`,
            color: accent,
            fontSize: '1.9rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: EMOJI_FONT,
          }}
        >
          {emoji}
        </Box>
        <Typography sx={{ fontSize: '1.3rem', fontWeight: 800, color: '#1A2332', lineHeight: 1.1 }}>
          {title}
        </Typography>
        <Typography sx={{ color: '#5A6A7E', fontSize: '0.92rem', lineHeight: 1.45 }}>
          {tagline}
        </Typography>
        <Box component="ul" sx={{ pl: 2.4, m: 0, mt: 0.5 }}>
          {bullets.map(b => (
            <Typography
              key={b}
              component="li"
              sx={{ color: '#475569', fontSize: '0.85rem', lineHeight: 1.5, mb: 0.25 }}
            >
              {b}
            </Typography>
          ))}
        </Box>
        <Box sx={{ mt: 'auto', pt: 1 }}>
          <EcoButton onClick={onPick}>Choose →</EcoButton>
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
      onClick={onSelect}
      aria-pressed={selected}
      sx={{
        flex: 1,
        minWidth: 110,
        cursor: 'pointer',
        background: selected ? '#9B59B6' : '#FFFFFF',
        color: selected ? '#FFFFFF' : '#1A2332',
        border: `2px solid ${selected ? '#9B59B6' : '#E1E6ED'}`,
        borderRadius: 2,
        px: 1.5,
        py: 1,
        textAlign: 'left',
        transition: 'background 0.15s, border-color 0.15s, color 0.15s',
        '&:hover': !selected ? { borderColor: '#9B59B6AA' } : {},
        '&:focus-visible': {
          outline: '2px solid #9B59B6',
          outlineOffset: 2,
        },
      }}
    >
      <Typography
        sx={{
          fontSize: '0.95rem',
          fontWeight: 800,
          fontFamily: EMOJI_FONT,
          lineHeight: 1.1,
          mb: 0.2,
        }}
      >
        {def.emoji} {def.label}
      </Typography>
      <Typography
        sx={{
          fontSize: '0.7rem',
          letterSpacing: '0.06em',
          opacity: 0.8,
          textTransform: 'uppercase',
          fontWeight: 700,
        }}
      >
        {def.description}
      </Typography>
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

  const visiblePairs = GHG_PAIRS.slice(0, DIFFICULTIES[difficulty].pairCount);

  return (
    <Box
      sx={{
        minHeight: '100%',
        bgcolor: '#FAFBFC',
        color: '#1A2332',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        px: 3,
        py: 5,
        gap: 3,
      }}
    >
      <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }}>
        <Typography
          variant="h3"
          sx={{
            background: 'linear-gradient(135deg, #9B59B6, #007DC4)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            fontWeight: 800,
            fontFamily: `Inter, ${EMOJI_FONT}`,
          }}
          align="center"
        >
          🧠 Eco Memory
        </Typography>
        <Typography sx={{ color: '#5A6A7E', mt: 1, maxWidth: 540, textAlign: 'center' }}>
          Match greenhouse gases to their sources. Pick a difficulty and a mode to start.
        </Typography>
      </motion.div>

      {/* Difficulty + study mode row */}
      <Box sx={{ width: '100%', maxWidth: 820, display: 'flex', flexDirection: 'column', gap: 1.2 }}>
        <Typography
          sx={{ fontSize: '0.7rem', letterSpacing: '0.12em', fontWeight: 800, color: '#5A6A7E', textTransform: 'uppercase' }}
        >
          Difficulty
        </Typography>
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          {(['easy', 'medium', 'hard'] as const).map(d => (
            <DifficultyPill
              key={d}
              difficulty={d}
              selected={difficulty === d}
              onSelect={() => setDifficulty(d)}
            />
          ))}
        </Box>

        <Box
          component="button"
          onClick={() => setStudyMode(s => !s)}
          aria-pressed={studyMode}
          sx={{
            mt: 1,
            display: 'flex',
            alignItems: 'center',
            gap: 1.2,
            background: studyMode ? '#0D9B4A12' : '#FFFFFF',
            border: `2px solid ${studyMode ? '#0D9B4A' : '#E1E6ED'}`,
            borderRadius: 2,
            px: 1.5,
            py: 1,
            cursor: 'pointer',
            textAlign: 'left',
            transition: 'background 0.15s, border-color 0.15s',
            '&:hover': !studyMode ? { borderColor: '#0D9B4AAA' } : {},
            '&:focus-visible': {
              outline: '2px solid #0D9B4A',
              outlineOffset: 2,
            },
          }}
        >
          <Box
            sx={{
              width: 22,
              height: 22,
              borderRadius: '6px',
              background: studyMode ? '#0D9B4A' : '#FFFFFF',
              border: `2px solid ${studyMode ? '#0D9B4A' : '#C8D0DA'}`,
              color: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '0.85rem',
              fontWeight: 900,
              flexShrink: 0,
            }}
          >
            {studyMode ? '✓' : ''}
          </Box>
          <Box sx={{ minWidth: 0 }}>
            <Typography sx={{ fontSize: '0.95rem', fontWeight: 800, color: '#1A2332', lineHeight: 1.15 }}>
              📖 Study mode
            </Typography>
            <Typography sx={{ fontSize: '0.78rem', color: '#5A6A7E', lineHeight: 1.3 }}>
              Reveal every card for a few seconds before play starts.
            </Typography>
          </Box>
        </Box>
      </Box>

      <Box
        sx={{
          width: '100%',
          maxWidth: 820,
          display: 'flex',
          gap: 3,
          alignItems: 'stretch',
          flexWrap: 'wrap',
        }}
      >
        <ModeCard
          title="Solo"
          tagline="Play at your own pace and chase a personal best."
          emoji="🎯"
          accent="#9B59B6"
          bullets={[
            'One player, no timer',
            'Streak bonuses for consecutive matches',
            'Submit your score to the global leaderboard',
          ]}
          onPick={() => handlePick('solo')}
        />
        <ModeCard
          title="Versus"
          tagline="Two players, one board — perfect for a tabletop iPad."
          emoji="⚔️"
          accent="#0EA5E9"
          bullets={[
            'Take turns flipping pairs',
            'Match → keep your turn · Miss → opponent goes',
            'Most pairs at the end wins',
          ]}
          onPick={() => handlePick('versus')}
        />
      </Box>

      {/* Pairs preview reflects the current difficulty */}
      <Box sx={{ maxWidth: 820, width: '100%' }}>
        <Typography sx={{ color: '#5A6A7E', mb: 1, textAlign: 'center', fontSize: 13 }}>
          Pairs you'll match ({visiblePairs.length}):
        </Typography>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, justifyContent: 'center' }}>
          {visiblePairs.map(p => (
            <Box
              key={p.label}
              sx={{
                px: 1.2,
                py: 0.4,
                borderRadius: 2,
                background: `${p.color}10`,
                border: `1px solid ${p.color}30`,
                fontSize: 13,
                fontFamily: EMOJI_FONT,
              }}
            >
              {p.emoji} {p.label} ↔ {p.sourceEmoji} {p.source}
            </Box>
          ))}
        </Box>
      </Box>
    </Box>
  );
}
