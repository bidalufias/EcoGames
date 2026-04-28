import { createTheme } from '@mui/material/styles';

// MGTC Brand Colors
const MGTC_GREEN = '#4CAF50';
const MGTC_GREEN_DARK = '#388E3C';
const MGTC_GREEN_LIGHT = '#81C784';
const MGTC_BLUE = '#2196F3';
const MGTC_BLUE_DARK = '#1565C0';
const MGTC_BLUE_LIGHT = '#64B5F6';
const MGTC_NAVY = '#0F172A';

// Accent colors per game — refined, modern palette
const GAME_COLORS = {
  ninja: '#4CAF50',
  crush: '#2196F3',
  recycle: '#FF9800',
  memory: '#7C4DFF',
  defence: '#00BFA5',
  2048: '#FF5722',
};

export { MGTC_GREEN, MGTC_GREEN_DARK, MGTC_GREEN_LIGHT, MGTC_BLUE, MGTC_BLUE_DARK, MGTC_BLUE_LIGHT, MGTC_NAVY, GAME_COLORS };

export const ecoTheme = createTheme({
  palette: {
    mode: 'light',
    primary: { main: MGTC_GREEN, light: MGTC_GREEN_LIGHT, dark: MGTC_GREEN_DARK },
    secondary: { main: MGTC_BLUE, light: MGTC_BLUE_LIGHT, dark: MGTC_BLUE_DARK },
    background: { default: '#FFFFFF', paper: '#FFFFFF' },
    text: { primary: '#0F172A', secondary: '#64748B' },
    error: { main: '#EF4444' },
    success: { main: MGTC_GREEN },
    warning: { main: '#FF9800' },
  },
  typography: {
    // Emoji fonts at the tail of the stack guarantee that color glyphs render
    // even when the body font (Inter) lacks emoji coverage. Without this, iOS
    // Safari sometimes leaves squares blank in the Climate 2048 tiles.
    fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif',
    h1: { fontWeight: 800, letterSpacing: '-0.04em', color: '#0F172A' },
    h2: { fontWeight: 700, letterSpacing: '-0.02em', color: '#0F172A' },
    h3: { fontWeight: 700, color: '#0F172A' },
    h4: { fontWeight: 600, color: '#0F172A' },
    h5: { fontWeight: 600, color: '#0F172A' },
    h6: { fontWeight: 600, color: '#0F172A' },
  },
  shape: { borderRadius: 12 },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 10,
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
          border: '1px solid #F1F5F9',
          borderRadius: 16,
          boxShadow: 'none',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          background: '#FFFFFF',
          border: '1px solid #F1F5F9',
          boxShadow: 'none',
        },
      },
    },
  },
});
