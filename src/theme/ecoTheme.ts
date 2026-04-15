import { createTheme } from '@mui/material/styles';

// MGTC Brand Colors from logo
const MGTC_GREEN = '#8BC53F';
const MGTC_GREEN_DARK = '#6BA32E';
const MGTC_GREEN_LIGHT = '#A8D86E';
const MGTC_BLUE = '#007DC4';
const MGTC_BLUE_DARK = '#005A8D';
const MGTC_BLUE_LIGHT = '#3DA1E0';
const MGTC_NAVY = '#1B438B';

// Accent colors per game
const GAME_COLORS = {
  ninja: '#8BC53F',
  crush: '#007DC4',
  recycle: '#FF8C42',
  memory: '#9B59B6',
  defence: '#14CCAA',
  2048: '#FF6B35',
};

export { MGTC_GREEN, MGTC_GREEN_DARK, MGTC_GREEN_LIGHT, MGTC_BLUE, MGTC_BLUE_DARK, MGTC_BLUE_LIGHT, MGTC_NAVY, GAME_COLORS };

export const ecoTheme = createTheme({
  palette: {
    mode: 'light',
    primary: { main: MGTC_GREEN, light: MGTC_GREEN_LIGHT, dark: MGTC_GREEN_DARK },
    secondary: { main: MGTC_BLUE, light: MGTC_BLUE_LIGHT, dark: MGTC_BLUE_DARK },
    background: { default: '#FAFBFC', paper: '#FFFFFF' },
    text: { primary: '#1A2332', secondary: '#5A6A7E' },
    error: { main: '#E74C3C' },
    success: { main: MGTC_GREEN },
    warning: { main: '#FF8C42' },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: { fontWeight: 800, letterSpacing: '-0.03em', color: '#1A2332' },
    h2: { fontWeight: 700, letterSpacing: '-0.02em', color: '#1A2332' },
    h3: { fontWeight: 700, color: '#1A2332' },
    h4: { fontWeight: 600, color: '#1A2332' },
    h5: { fontWeight: 600, color: '#1A2332' },
    h6: { fontWeight: 600, color: '#1A2332' },
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
    },
    MuiCard: {
      styleOverrides: {
        root: {
          background: '#FFFFFF',
          border: '1px solid #E8EDF2',
          borderRadius: 16,
          boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.03)',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          background: '#FFFFFF',
          border: '1px solid #E8EDF2',
        },
      },
    },
  },
});
