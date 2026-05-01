import { Box, Typography, Grid, Chip } from '@mui/material';
import { motion } from 'framer-motion';
import { GREENHOUSE_GASES, CLEAN_TECH } from './data';
import EcoButton from '../../components/EcoButton';

interface Props {
  onStart: () => void;
}

const cardVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.08, duration: 0.4 },
  }),
};

export default function IntroScreen({ onStart }: Props) {
  return (
    <Box className="game-screen-stack" sx={{
      height: '100%', bgcolor: '#FAFBFC', color: '#1A2332',
      overflowY: 'auto', px: { xs: 2, md: 4 }, py: 4,
      // Portrait phones: leave space at the bottom for the sticky
      // Start CTA so the last GHG card isn't covered.
      '@media (orientation: portrait) and (max-width: 1024px)': {
        pb: '88px',
      },
    }}>
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <Typography variant="h3" component="h1" align="center" sx={{
          color: '#15803D',
          fontWeight: 800, mb: 1,
          '@media (orientation: portrait) and (max-width: 1024px)': {
            fontSize: '1.7rem',
          },
        }}>
          🥷 Climate Ninja
        </Typography>
        <Typography variant="h5" align="center" sx={{
          color: '#5A6A7E', mb: 4,
          '@media (orientation: portrait) and (max-width: 1024px)': {
            fontSize: '0.95rem', mb: 2,
          },
        }}>
          Know Your Enemy: The 7 Greenhouse Gases
        </Typography>
      </motion.div>

      <Box sx={{ maxWidth: 1200, mx: 'auto' }}>
        <Grid container spacing={2}>
          {GREENHOUSE_GASES.map((gas, i) => (
            <Grid size={{ xs: 12, sm: 6, md: 4 }} key={gas.id}>
              <motion.div custom={i} variants={cardVariants} initial="hidden" animate="visible">
                <Box sx={{
                  p: 2.5, borderRadius: 3,
                  background: '#FFFFFF',
                  border: `1px solid ${gas.color}25`,
                  boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
                  '&:hover': { borderColor: `${gas.color}55`, boxShadow: `0 4px 12px ${gas.color}15` },
                  transition: 'all 0.3s',
                }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
                    <Typography sx={{ fontSize: 42 }}>{gas.emoji}</Typography>
                    <Box>
                      <Typography variant="subtitle1" sx={{ fontWeight: 700, color: gas.color }}>
                        {gas.name}
                      </Typography>
                      <Typography variant="h6" sx={{ fontFamily: 'monospace', color: '#1A2332' }}>
                        {gas.formula}
                      </Typography>
                    </Box>
                    <Chip label={`+${gas.points}`} size="small" sx={{
                      ml: 'auto', bgcolor: `${gas.color}15`, color: gas.color, fontWeight: 700,
                    }} />
                  </Box>
                  <Typography variant="body2" sx={{ color: '#5A6A7E', mb: 0.5 }}>
                    <strong>Source:</strong> {gas.source}
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#8BC53F', fontStyle: 'italic' }}>
                    💡 {gas.fact}
                  </Typography>
                </Box>
              </motion.div>
            </Grid>
          ))}
        </Grid>
      </Box>

      <Box sx={{ maxWidth: 1200, mx: 'auto', mt: 5 }}>
        <Typography variant="h5" align="center" sx={{ mb: 3, color: '#8BC53F' }}>
          🛡️ Protect the Clean Tech — Don't Slash These!
        </Typography>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 1.5 }}>
          {CLEAN_TECH.map((item) => (
            <Box key={item.id} sx={{
              px: 2, py: 1, borderRadius: 2,
              background: '#8BC53F10', border: '1px solid #8BC53F25',
              display: 'flex', alignItems: 'center', gap: 1,
            }}>
              <Typography sx={{ fontSize: 24 }}>{item.emoji}</Typography>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>{item.name}</Typography>
            </Box>
          ))}
        </Box>
      </Box>

      <Box sx={{
        textAlign: 'center', mt: 5, mb: 4,
        '@media (orientation: portrait) and (max-width: 1024px)': {
          // Portrait: hide the inline CTA; the sticky bottom bar carries
          // it instead so it's always reachable while scanning the cards.
          display: 'none',
        },
      }}>
        <Typography variant="body1" sx={{ color: '#5A6A7E', mb: 3 }}>
          Swipe the <Box component="strong" sx={{ color: '#E74C3C' }}>greenhouse gases</Box>!
          Avoid the <Box component="strong" sx={{ color: '#8BC53F' }}>clean tech</Box>! ⚠️
        </Typography>
        <EcoButton onClick={onStart} size="large">
          Start Mission 🚀
        </EcoButton>
      </Box>

      {/* Sticky bottom CTA on portrait phones: the 7 GHG cards push the
          inline Start button below the fold by ~1700px, so pin a copy of
          it to the bottom of the viewport so the player can always tap
          'Start Mission' without scrolling. */}
      <Box sx={{
        display: 'none',
        '@media (orientation: portrait) and (max-width: 1024px)': {
          display: 'flex',
          position: 'fixed',
          left: 0,
          right: 0,
          bottom: 0,
          padding: '10px 16px calc(10px + env(safe-area-inset-bottom, 0px))',
          background: 'rgba(250, 251, 252, 0.94)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          borderTop: '1px solid #E8EDF2',
          justifyContent: 'center',
          zIndex: 50,
        },
      }}>
        <EcoButton onClick={onStart} size="large">
          Start Mission 🚀
        </EcoButton>
      </Box>
    </Box>
  );
}
