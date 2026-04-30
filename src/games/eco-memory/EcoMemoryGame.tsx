import { useState } from 'react';
import BackToHome from '../../components/BackToHome';
import MgtcLogo from '../../components/MgtcLogo';
import ModeSelect, { type Mode, type GameSettings } from './components/ModeSelect';
import SoloPlay from './components/SoloPlay';
import VersusPlay from './components/VersusPlay';

interface ActiveSession {
  mode: Mode;
  settings: GameSettings;
}

/**
 * Top-level Eco Memory shell. Mirrors the Climate 2048 split (`ModeSelect` →
 * `SoloPlay` / `ChallengePlay`): a thin router that hands off to the chosen
 * mode and lets each one own its full screen flow.
 *
 * Owns the BackToHome / MgtcLogo header itself (App.tsx skips them for this
 * route) so we can show the masthead on the main menu but hide it once a
 * session starts — leaving the play screen with the in-game Menu button as
 * the single way back.
 */
export default function EcoMemoryGame() {
  const [session, setSession] = useState<ActiveSession | null>(null);

  if (session?.mode === 'solo') {
    return (
      <SoloPlay
        difficulty={session.settings.difficulty}
        studyMode={session.settings.studyMode}
        onExit={() => setSession(null)}
      />
    );
  }
  if (session?.mode === 'versus') {
    return (
      <VersusPlay
        difficulty={session.settings.difficulty}
        studyMode={session.settings.studyMode}
        onExit={() => setSession(null)}
      />
    );
  }
  return (
    <>
      <BackToHome />
      <MgtcLogo />
      <ModeSelect onPick={(mode, settings) => setSession({ mode, settings })} />
    </>
  );
}
