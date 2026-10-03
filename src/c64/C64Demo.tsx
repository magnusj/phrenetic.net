import { useEffect, useMemo, useState } from 'react';
import { DemoAudio } from './demoAudio';
import { C64Screen } from './C64Screen';
import { createC64Demo } from './programs/demo';
import './C64Demo.css';

export const C64Demo = () => {
  const audio = useMemo(() => new DemoAudio(), []);
  const program = useMemo(() => createC64Demo(audio), [audio]);
  const [started, setStarted] = useState(false);

  useEffect(() => () => audio.dispose(), [audio]);

  // The first click, tap or key press "types" LOAD. Browsers also require a gesture before audio can play.
  useEffect(() => {
    if (started) return;
    const handleGesture = (e: Event) => {
      if (e instanceof KeyboardEvent && e.key === 'Escape') return;
      audio.unlock();
      program.start();
      setStarted(true);
    };
    window.addEventListener('pointerdown', handleGesture);
    window.addEventListener('keydown', handleGesture);
    return () => {
      window.removeEventListener('pointerdown', handleGesture);
      window.removeEventListener('keydown', handleGesture);
    };
  }, [audio, program, started]);

  return (
    <div className="c64-demo">
      <C64Screen program={program} className="c64-demo-screen" />
      {!started && <p className="c64-demo-hint">PRESS ANY KEY OR TAP TO LOAD</p>}
    </div>
  );
};
