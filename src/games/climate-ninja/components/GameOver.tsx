import { Box, Typography } from '@mui/material';
import { motion } from 'framer-motion';
import type { PlayerState } from '../types';
import { PLAYER_COLORS } from '../Renderer';
import EcoButton from '../../../components/EcoButton';

interface Props {
  players: PlayerState[];
  playerNames: string[];
  onPlayAgain: () => void;
  onViewLeaderboard: () => void;
}

export default function GameOver({ players, playerNames, onPlayAgain, onViewLeaderboard }: Props) {
  const sorted = [...players].sort((a, b) => b.score - a.score);
  const winner = sorted[0];

  return (
    <Box className="game-screen-stack" sx={{
      minHeight: '100%', bgcolor: '#FAFBFC', color: '#1A2332',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      px: 3, py: 4,
    }}>
      <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5 }}>
        <Typography variant="h3" align="center" sx={{ fontWeight: 800, mb: 1 }}>
          {players.length > 1 ? '🏆 Mission Complete' : 'Mission Over'}
        </Typography>
        {winner && (
          <Typography variant="h5" align="center" sx={{ color: '#FFD700', mb: 4 }}>
            {players.length > 1 ? `${playerNames[winner.id] || `Player ${winner.id + 1}`} wins!` : `Score: ${winner.score.toLocaleString()}`}
          </Typography>
        )}
      </motion.div>

      <Box sx={{
        width: '100%', maxWidth: 500, borderRadius: 3, overflow: 'hidden',
        background: '#FFFFFF',
        border: '1px solid rgba(13,155,74,0.15)',
      }}>
        <Box sx={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1fr) 72px 56px 56px',
          gap: 1,
          px: { xs: 1.5, sm: 2 }, py: 1.5,
          borderBottom: '1px solid #E8EDF2',
          fontSize: { xs: '0.72rem', sm: '0.8rem' },
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
        }}>
          <Typography sx={{ fontWeight: 800, color: '#5A6A7E', fontSize: 'inherit' }}>Player</Typography>
          <Typography sx={{ textAlign: 'right', fontWeight: 800, color: '#5A6A7E', fontSize: 'inherit' }}>Score</Typography>
          <Typography sx={{ textAlign: 'right', fontWeight: 800, color: '#5A6A7E', fontSize: 'inherit' }}>Sliced</Typography>
          <Typography sx={{ textAlign: 'right', fontWeight: 800, color: '#5A6A7E', fontSize: 'inherit' }}>Combo</Typography>
        </Box>
        {sorted.map((p, idx) => (
          <Box key={p.id} sx={{
            display: 'grid',
            gridTemplateColumns: 'minmax(0, 1fr) 72px 56px 56px',
            gap: 1,
            px: { xs: 1.5, sm: 2 }, py: 1.5,
            alignItems: 'center',
            background: p === winner ? 'rgba(13,155,74,0.1)' : 'transparent',
          }}>
            <Typography sx={{
              fontWeight: 700,
              color: PLAYER_COLORS[p.id] || '#1A2332',
              minWidth: 0,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}>
              {idx === 0 ? '🏆 ' : ''}{playerNames[p.id] || `Player ${p.id + 1}`}
            </Typography>
            <Typography sx={{ textAlign: 'right', fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>
              {p.score.toLocaleString()}
            </Typography>
            <Typography sx={{ textAlign: 'right', color: '#5A6A7E', fontVariantNumeric: 'tabular-nums' }}>
              {p.itemsSliced}
            </Typography>
            <Typography sx={{ textAlign: 'right', color: '#5A6A7E', fontVariantNumeric: 'tabular-nums' }}>
              {p.maxCombo}×
            </Typography>
          </Box>
        ))}
      </Box>

      <Box sx={{ display: 'flex', gap: 2, mt: 4, flexWrap: 'wrap', justifyContent: 'center' }}>
        <EcoButton onClick={onPlayAgain}>↻ Play Again</EcoButton>
        <EcoButton onClick={onViewLeaderboard} variant="secondary">Leaderboard</EcoButton>
      </Box>
    </Box>
  );
}
