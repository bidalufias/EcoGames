import { Box } from '@mui/material';

export default function MgtcLogo() {
  return (
    <Box
      component="img"
      src="/mgtc-logo.png"
      alt="MGTC"
      sx={{
        position: 'absolute',
        top: 'clamp(10px, 2.5cqh, 24px)',
        right: 'clamp(12px, 3cqw, 32px)',
        height: 'clamp(22px, 5cqh, 36px)',
        width: 'auto',
        zIndex: 9999,
        opacity: 0.85,
        transition: 'opacity 0.2s',
        '&:hover': { opacity: 1 },
      }}
    />
  );
}
