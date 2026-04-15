import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { Box } from '@mui/material';
import { Suspense, lazy } from 'react';
import { ecoTheme } from './theme/ecoTheme';
import EcoHeader from './components/EcoHeader';
import LandingPage from './pages/LandingPage';
import GamePage from './pages/GamePage';

const ClimateNinjaGame = lazy(() => import('./games/climate-ninja/ClimateNinjaGame'));
const CarbonCrushGame = lazy(() => import('./games/carbon-crush/CarbonCrushGame'));
const RecycleRushGame = lazy(() => import('./games/recycle-rush/RecycleRushGame'));
const EcoMemoryGame = lazy(() => import('./games/eco-memory/EcoMemoryGame'));
const GreenDefenceGame = lazy(() => import('./games/green-defence/GreenDefenceGame'));
const Climate2048Game = lazy(() => import('./games/climate-2048/Climate2048Game'));

const loadingStyle = { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#5A6A7E' } as const;

function App() {
  return (
    <ThemeProvider theme={ecoTheme}>
      <CssBaseline />
      <Box sx={{ minHeight: '100vh', background: '#FAFBFC' }}>
        <BrowserRouter>
          <EcoHeader />
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/games/climate-ninja" element={
              <Suspense fallback={<Box sx={loadingStyle}>Loading Climate Ninja...</Box>}>
                <ClimateNinjaGame />
              </Suspense>
            } />
            <Route path="/games/carbon-crush" element={
              <Suspense fallback={<Box sx={loadingStyle}>Loading Carbon Crush...</Box>}>
                <CarbonCrushGame />
              </Suspense>
            } />
            <Route path="/games/recycle-rush" element={
              <Suspense fallback={<Box sx={loadingStyle}>Loading Recycle Rush...</Box>}>
                <RecycleRushGame />
              </Suspense>
            } />
            <Route path="/games/eco-memory" element={
              <Suspense fallback={<Box sx={loadingStyle}>Loading Eco Memory...</Box>}>
                <EcoMemoryGame />
              </Suspense>
            } />
            <Route path="/games/green-defence" element={
              <Suspense fallback={<Box sx={loadingStyle}>Loading Green Defence...</Box>}>
                <GreenDefenceGame />
              </Suspense>
            } />
            <Route path="/games/climate-2048" element={
              <Suspense fallback={<Box sx={loadingStyle}>Loading Climate 2048...</Box>}>
                <Climate2048Game />
              </Suspense>
            } />
            <Route path="/games/:gameId" element={<GamePage />} />
          </Routes>
        </BrowserRouter>
      </Box>
    </ThemeProvider>
  );
}

export default App;
