import { useState } from 'react';
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
  return <ModeSelect onPick={(mode, settings) => setSession({ mode, settings })} />;
}
