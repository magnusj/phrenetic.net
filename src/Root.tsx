import { useEffect } from 'react';
import App from './App';
import { C64Demo } from './c64/C64Demo';
import { DemoSelector } from './components/DemoSelector';
import { useHashRoute } from './hooks/useHashRoute';

export const Root = () => {
  const route = useHashRoute();

  // Escape returns to the selector from either demo
  useEffect(() => {
    if (route === '/') return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') window.location.hash = '/';
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [route]);

  if (route === '/amiga') return <App />;
  if (route === '/c64') return <C64Demo />;
  return <DemoSelector />;
};
