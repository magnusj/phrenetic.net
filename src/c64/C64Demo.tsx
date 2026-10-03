import { useEffect, useMemo, useState } from 'react';
import { demoAudio } from './demoAudio';
import { C64Screen } from './C64Screen';
import { createC64Demo } from './programs/demo';
import './C64Demo.css';

export const C64Demo = () => {
  const program = useMemo(() => createC64Demo(demoAudio), []);
  // Opened from the selector, the click on the card already unlocked audio, so loading starts at once
  const [started, setStarted] = useState(() => demoAudio.unlocked);

  useEffect(() => {
    if (demoAudio.unlocked) program.start();
    return () => demoAudio.stopAll();
  }, [program]);

  // Otherwise the first click, tap or key press "types" LOAD, and unlocks audio
  useEffect(() => {
    if (started) return;
    const handleGesture = (e: Event) => {
      if (e instanceof KeyboardEvent && e.key === 'Escape') return;
      demoAudio.unlock();
      program.start();
      setStarted(true);
    };
    window.addEventListener('pointerdown', handleGesture);
    window.addEventListener('keydown', handleGesture);
    return () => {
      window.removeEventListener('pointerdown', handleGesture);
      window.removeEventListener('keydown', handleGesture);
    };
  }, [program, started]);

  return (
    <div className="c64-demo">
      <C64Screen program={program} className="c64-demo-screen" />
      {!started && <p className="c64-demo-hint">PRESS ANY KEY OR TAP TO LOAD</p>}
    </div>
  );
};
