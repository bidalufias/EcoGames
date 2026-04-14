import { useEffect, useState, useCallback } from 'react';
import { Box, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Fade } from '@mui/material';
import { fetchLeaderboard, supabase } from '../lib/supabase';
import type { LeaderboardEntry } from '../lib/supabase';

interface LeaderboardPanelProps {
  gameId: string;
  playerName?: string;
}

const medals = ['🥇', '🥈', '🥉'];

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

  if (!supabase) {
    return (
      <Box
        sx={{
          p: 3,
          textAlign: 'center',
          background: 'rgba(17, 34, 64, 0.5)',
          borderRadius: '16px',
          border: '1px solid rgba(13, 155, 74, 0.1)',
        }}
      >
        <Typography sx={{ fontSize: '2rem', mb: 1 }}>🌐</Typography>
        <Typography variant="body2" color="text.secondary">
          Leaderboard available when online
        </Typography>
      </Box>
    );
  }

  if (loading && entries.length === 0) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography color="text.secondary">Loading leaderboard...</Typography>
      </Box>
    );
  }

  if (entries.length === 0) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography color="text.secondary">No scores yet. Be the first!</Typography>
      </Box>
    );
  }

  return (
    <Fade in>
      <TableContainer
        sx={{
          background: 'rgba(17, 34, 64, 0.5)',
          borderRadius: '16px',
          border: '1px solid rgba(13, 155, 74, 0.1)',
          overflow: 'hidden',
        }}
      >
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell sx={{ color: 'text.secondary', fontWeight: 600, borderBottom: '1px solid rgba(13, 155, 74, 0.15)' }}>Rank</TableCell>
              <TableCell sx={{ color: 'text.secondary', fontWeight: 600, borderBottom: '1px solid rgba(13, 155, 74, 0.15)' }}>Player</TableCell>
              <TableCell align="right" sx={{ color: 'text.secondary', fontWeight: 600, borderBottom: '1px solid rgba(13, 155, 74, 0.15)' }}>Score</TableCell>
              <TableCell align="right" sx={{ color: 'text.secondary', fontWeight: 600, borderBottom: '1px solid rgba(13, 155, 74, 0.15)' }}>Date</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {entries.map((entry, i) => {
              const isHighlighted = playerName && entry.player_name === playerName;
              return (
                <TableRow
                  key={entry.id || i}
                  sx={{
                    background: isHighlighted ? 'rgba(13, 155, 74, 0.1)' : 'transparent',
                    '&:hover': { background: 'rgba(13, 155, 74, 0.05)' },
                    transition: 'background 0.2s',
                  }}
                >
                  <TableCell sx={{ borderBottom: '1px solid rgba(13, 155, 74, 0.08)' }}>
                    <Typography sx={{ fontWeight: 700, fontSize: '1.1rem' }}>
                      {i < 3 ? medals[i] : `#${i + 1}`}
                    </Typography>
                  </TableCell>
                  <TableCell
                    sx={{
                      borderBottom: '1px solid rgba(13, 155, 74, 0.08)',
                      fontWeight: isHighlighted ? 700 : 400,
                      color: isHighlighted ? '#14CC66' : 'text.primary',
                    }}
                  >
                    {entry.player_name}
                  </TableCell>
                  <TableCell align="right" sx={{ borderBottom: '1px solid rgba(13, 155, 74, 0.08)', fontWeight: 600, color: '#14CC66' }}>
                    {entry.score.toLocaleString()}
                  </TableCell>
                  <TableCell align="right" sx={{ borderBottom: '1px solid rgba(13, 155, 74, 0.08)', color: 'text.secondary', fontSize: '0.85rem' }}>
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
