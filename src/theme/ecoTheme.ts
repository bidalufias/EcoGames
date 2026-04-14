import { createTheme } from '@mui/material/styles';

export const ecoTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: { main: '#0D9B4A', light: '#14CC66', dark: '#0A7A39' },
    secondary: { main: '#1B8EBF', light: '#23B5E8', dark: '#156F96' },
    background: { default: '#0A1628', paper: '#112240' },
    text: { primary: '#E6F1FF', secondary: '#8892B0' },
    error: { main: '#FF4757' },
    success: { main: '#0D9B4A' },
    warning: { main: '#FFB800' },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: { fontWeight: 800, letterSpacing: '-0.02em' },
    h2: { fontWeight: 700, letterSpacing: '-0.01em' },
    h3: { fontWeight: 700 },
    h4: { fontWeight: 600 },
    h5: { fontWeight: 600 },
    h6: { fontWeight: 600 },
  },
  shape: { borderRadius: 16 },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          textTransform: 'none',
          fontWeight: 600,
          padding: '10px 24px',
        },
      },
      variants: [
        {
          props: { variant: 'contained', color: 'primary' },
          style: {
            background: 'linear-gradient(135deg, #0D9B4A 0%, #1B8EBF 100%)',
            boxShadow: '0 4px 20px rgba(13, 155, 74, 0.3)',
            '&:hover': {
              background: 'linear-gradient(135deg, #14CC66 0%, #23B5E8 100%)',
              boxShadow: '0 6px 30px rgba(13, 155, 74, 0.5)',
            },
          },
        },
      ],
    },
    MuiCard: {
      styleOverrides: {
        root: {
          background: 'rgba(17, 34, 64, 0.7)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(13, 155, 74, 0.15)',
          borderRadius: 16,
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          background: 'rgba(17, 34, 64, 0.7)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(13, 155, 74, 0.1)',
        },
      },
    },
  },
});
