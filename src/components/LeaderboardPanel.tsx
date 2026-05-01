import { useEffect, useState, useCallback } from 'react';
import { Box, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Fade } from '@mui/material';
import { fetchLeaderboard, supabase } from '../lib/supabase';
import type { LeaderboardEntry } from '../lib/supabase';

interface LeaderboardPanelProps {
  gameId: string;
  playerName?: string;
}

const medals = ['🥇', '🥈', '🥉'];

const PAPER = {
  surface: '#FFFCF5',
  ink: '#1F1B14',
  meta: '#7A6F5C',
  hairline: '#ECE3D0',
  hairlineSoft: '#F2EAD7',
  accent: '#15803D',
  accentSoft: 'rgba(21, 128, 61, 0.08)',
};

export default function LeaderboardPanel({ gameId, playerName }: LeaderboardPanelProps) {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const data = await fetchLeaderboard(gameId, 10);
    setEntries(data);
    setLoading(false);
  }, [gameId]);

  useEffect(() => {
    load();
    const interval = setInterval(load, 30000);
    return () => clearInterval(interval);
  }, [load]);

  const shellSx = {
    background: PAPER.surface,
    borderRadius: '14px',
    border: `1px solid ${PAPER.hairline}`,
    overflow: 'hidden',
    boxShadow: '0 1px 2px rgba(31,27,20,0.04), 0 4px 14px rgba(31,27,20,0.04)',
  } as const;

  if (!supabase) {
    return (
      <Box sx={{ ...shellSx, p: 3, textAlign: 'center' }}>
        <Typography sx={{ fontSize: '1.6rem', mb: 1 }} aria-hidden>🌐</Typography>
        <Typography sx={{ color: PAPER.meta, fontWeight: 500 }}>
          Leaderboard available when online
        </Typography>
      </Box>
    );
  }

  if (loading && entries.length === 0) {
    return (
      <Box sx={{ ...shellSx, p: 3, textAlign: 'center' }}>
        <Typography sx={{ color: PAPER.meta }}>Loading leaderboard…</Typography>
      </Box>
    );
  }

  if (entries.length === 0) {
    return (
      <Box sx={{ ...shellSx, p: 3, textAlign: 'center' }}>
        <Typography sx={{ color: PAPER.meta }}>No scores yet. Be the first.</Typography>
      </Box>
    );
  }

  const headSx = {
    color: PAPER.meta,
    fontWeight: 800,
    fontSize: '0.7rem',
    letterSpacing: '0.14em',
    textTransform: 'uppercase' as const,
    borderBottom: `1px solid ${PAPER.hairline}`,
    py: 1.25,
  };
  const cellSx = {
    borderBottom: `1px solid ${PAPER.hairlineSoft}`,
    py: 1.25,
  };

  return (
    <Fade in>
      <TableContainer sx={shellSx}>
        <Table size="small" sx={{ minWidth: 'unset' }}>
          <TableHead>
            <TableRow>
              <TableCell sx={headSx}>Rank</TableCell>
              <TableCell sx={headSx}>Player</TableCell>
              <TableCell align="right" sx={headSx}>Score</TableCell>
              <TableCell
                align="right"
                sx={{ ...headSx, display: { xs: 'none', sm: 'table-cell' } }}
              >
                Date
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {entries.map((entry, i) => {
              const isHighlighted = !!playerName && entry.player_name === playerName;
              return (
                <TableRow
                  key={entry.id || i}
                  sx={{
                    background: isHighlighted ? PAPER.accentSoft : 'transparent',
                    '@media (hover: hover)': {
                      '&:hover': { background: 'rgba(31,27,20,0.03)' },
                    },
                    transition: 'background 0.18s ease-out',
                  }}
                >
                  <TableCell sx={cellSx}>
                    <Typography
                      component="span"
                      sx={{
                        fontWeight: 800,
                        fontSize: i < 3 ? '1.15rem' : '0.95rem',
                        color: PAPER.ink,
                        fontVariantNumeric: 'tabular-nums',
                      }}
                    >
                      {i < 3 ? medals[i] : `#${i + 1}`}
                    </Typography>
                  </TableCell>
                  <TableCell
                    sx={{
                      ...cellSx,
                      fontWeight: isHighlighted ? 800 : 600,
                      color: isHighlighted ? PAPER.accent : PAPER.ink,
                      maxWidth: 0,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {entry.player_name}
                  </TableCell>
                  <TableCell
                    align="right"
                    sx={{
                      ...cellSx,
                      fontWeight: 800,
                      color: PAPER.accent,
                      fontVariantNumeric: 'tabular-nums',
                    }}
                  >
                    {entry.score.toLocaleString()}
                  </TableCell>
                  <TableCell
                    align="right"
                    sx={{
                      ...cellSx,
                      color: PAPER.meta,
                      fontSize: '0.8rem',
                      fontVariantNumeric: 'tabular-nums',
                      display: { xs: 'none', sm: 'table-cell' },
                    }}
                  >
                    {entry.created_at ? new Date(entry.created_at).toLocaleDateString() : '—'}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
    </Fade>
  );
}
