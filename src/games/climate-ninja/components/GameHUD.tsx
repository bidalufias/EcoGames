import { Box, Typography } from '@mui/material';
import type { PlayerState, ZoneConfig } from '../types';
import { PLAYER_COLORS } from '../Renderer';

interface Props {
  players: PlayerState[];
  zones: ZoneConfig[];
  combos: number[];
  powerups: string[][];
  frenzy: boolean[];
}

export default function GameHUD({ players, zones, combos, powerups, frenzy }: Props) {
  return (
    <>
      {players.map((player, i) => {
        if (!player.isAlive) return null;
        const zone = zones[i];
        if (!zone) return null;
        const color = PLAYER_COLORS[i] || '#8BC53F';
        const combo = combos[i] ?? 0;
        const pu = powerups[i] ?? [];
        const isFrenzy = frenzy[i] ?? false;

        return (
          <Box key={i} sx={{
            position: 'absolute',
            left: `${(zone.x / 1280) * 100}%`,
            top: `${(zone.y / 720) * 100}%`,
            width: `${(zone.width / 1280) * 100}%`,
            p: 1.5,
            pointerEvents: 'none',
            display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
          }}>
            {/* Score + Combo */}
            <Box sx={{
              background: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(8px)',
              borderRadius: 2, px: 2, py: 1,
              border: `1px solid ${color}44`,
            }}>
              <Typography sx={{ fontWeight: 800, fontSize: 22, color, lineHeight: 1 }}>
                {player.score.toLocaleString()}
              </Typography>
              {combo > 1 && (
                <Typography sx={{ fontSize: 14, color: '#FFD700', fontWeight: 700 }}>
                  x{combo} COMBO
                </Typography>
              )}
            </Box>

            {/* Lives */}
            <Box sx={{
              background: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(8px)',
              borderRadius: 2, px: 1.5, py: 0.8,
              border: '1px solid #E8EDF2',
              display: 'flex', gap: 0.5,
            }}>
              {Array.from({ length: player.lives }).map((_, li) => (
                <Typography key={li} sx={{ fontSize: 16 }}>🌍</Typography>
              ))}
            </Box>

            {/* Powerups + Frenzy */}
            <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', maxWidth: 120 }}>
              {isFrenzy && (
                <Box sx={{
                  px: 1, py: 0.3, borderRadius: 1, fontSize: 11, fontWeight: 700,
                  background: 'rgba(255,71,87,0.3)', color: '#FF4757',
                  border: '1px solid rgba(255,71,87,0.4)',
                }}>
                  🔥 CARBON SPIKE
                </Box>
              )}
              {pu.includes('slowmo') && (
                <Box sx={{
                  px: 1, py: 0.3, borderRadius: 1, fontSize: 11, fontWeight: 700,
                  background: 'rgba(64,196,255,0.2)', color: '#40c4ff',
                }}>
                  ⏳
                </Box>
              )}
              {pu.includes('doublepoints') && (
                <Box sx={{
                  px: 1, py: 0.3, borderRadius: 1, fontSize: 11, fontWeight: 700,
                  background: 'rgba(255,215,0,0.2)', color: '#FFD700',
                }}>
                  ✨ 2x
                </Box>
              )}
              {player.shieldActive && (
                <Box sx={{
                  px: 1, py: 0.3, borderRadius: 1, fontSize: 11, fontWeight: 700,
                  background: 'rgba(68,138,255,0.2)', color: '#448aff',
                }}>
                  🛡️
                </Box>
              )}
            </Box>
          </Box>
        );
      })}
    </>
  );
}
