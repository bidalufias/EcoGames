import { useState } from 'react';
import ModeSelect, { type Mode } from './components/ModeSelect';
import TechSelect from './components/TechSelect';
import SoloPlay from './components/SoloPlay';
import ChallengePlay from './components/ChallengePlay';
import { TECH_TRACKS, type TechTrack } from './data';

type Step =
  | { kind: 'mode' }
  | { kind: 'tech'; mode: Mode }
  | { kind: 'play'; mode: Mode; track: TechTrack };

export default function Climate2048Game() {
  const [step, setStep] = useState<Step>({ kind: 'mode' });

  if (step.kind === 'mode') {
    return (
      <ModeSelect
        onPick={mode => {
          // Only one tech (solar) is available right now — skip the picker.
          const playable = TECH_TRACKS.filter(t => t.available);
          if (playable.length === 1) {
            setStep({ kind: 'play', mode, track: playable[0] });
          } else {
            setStep({ kind: 'tech', mode });
          }
        }}
      />
    );
  }

  if (step.kind === 'tech') {
    return (
      <TechSelect
        modeLabel={step.mode === 'solo' ? 'Solo' : 'Challenge'}
        onPick={track => setStep({ kind: 'play', mode: step.mode, track })}
        onBack={() => setStep({ kind: 'mode' })}
      />
    );
  }

  // Playing
  if (step.mode === 'solo') {
    return <SoloPlay track={step.track} onChangeMode={() => setStep({ kind: 'mode' })} />;
  }
  return <ChallengePlay track={step.track} onChangeMode={() => setStep({ kind: 'mode' })} />;
}
