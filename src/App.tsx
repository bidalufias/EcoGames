import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { Box } from '@mui/material';
import { Suspense, lazy } from 'react';
import { ecoTheme } from './theme/ecoTheme';
import BackToHome from './components/BackToHome';
import LandingPage from './pages/LandingPage';
import GamePage from './pages/GamePage';

const ClimateNinjaGame = lazy(() => import('./games/climate-ninja/ClimateNinjaGame'));
const CarbonCrushGame = lazy(() => import('./games/carbon-crush/CarbonCrushGame'));
const RecycleRushGame = lazy(() => import('./games/recycle-rush/RecycleRushGame'));
const EcoMemoryGame = lazy(() => import('./games/eco-memory/EcoMemoryGame'));
const GreenDefenceGame = lazy(() => import('./games/green-defence/GreenDefenceGame'));
const Climate2048Game = lazy(() => import('./games/climate-2048/Climate2048Game'));

const loadingStyle = { minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94A3B8' } as const;

function MgtcLogo() {
  return (
    <Box
      component="img"
      src="/mgtc-logo.png"
      alt="MGTC"
      sx={{
        position: 'fixed',
        top: { xs: 16, md: 24 },
        right: { xs: 16, md: 32 },
        height: { xs: 28, md: 36 },
        width: 'auto',
        zIndex: 9999,
        opacity: 0.85,
        transition: 'opacity 0.2s',
        '&:hover': { opacity: 1 },
      }}
    />
  );
}

function AppLayout() {
  const location = useLocation();
  const isGamePage = location.pathname.startsWith('/games/');

  return (
    <>
      {isGamePage && <MgtcLogo />}
      {isGamePage && <BackToHome />}
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/games/climate-ninja" element={
          <Suspense fallback={<Box sx={loadingStyle}>Loading...</Box>}>
            <ClimateNinjaGame />
          </Suspense>
        } />
        <Route path="/games/carbon-crush" element={
          <Suspense fallback={<Box sx={loadingStyle}>Loading...</Box>}>
            <CarbonCrushGame />
          </Suspense>
        } />
        <Route path="/games/recycle-rush" element={
          <Suspense fallback={<Box sx={loadingStyle}>Loading...</Box>}>
            <RecycleRushGame />
          </Suspense>
        } />
        <Route path="/games/eco-memory" element={
          <Suspense fallback={<Box sx={loadingStyle}>Loading...</Box>}>
            <EcoMemoryGame />
          </Suspense>
        } />
        <Route path="/games/green-defence" element={
          <Suspense fallback={<Box sx={loadingStyle}>Loading...</Box>}>
            <GreenDefenceGame />
          </Suspense>
        } />
        <Route path="/games/climate-2048" element={
          <Suspense fallback={<Box sx={loadingStyle}>Loading...</Box>}>
            <Climate2048Game />
          </Suspense>
        } />
        <Route path="/games/:gameId" element={<GamePage />} />
      </Routes>
    </>
  );
}

function App() {
  return (
    <ThemeProvider theme={ecoTheme}>
      <CssBaseline />
      <Box sx={{ height: '100dvh', width: '100vw', overflow: 'hidden', background: '#0F172A' }}>
        <BrowserRouter>
          <AppLayout />
        </BrowserRouter>
      </Box>
    </ThemeProvider>
  );
}

export default App;
