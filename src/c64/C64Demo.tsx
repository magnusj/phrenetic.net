import { useMemo } from 'react';
import { C64Screen } from './C64Screen';
import { createBootScreen } from './programs/bootScreen';
import './C64Demo.css';

export const C64Demo = () => {
  const program = useMemo(() => createBootScreen(), []);

  return (
    <div className="c64-demo">
      <C64Screen program={program} className="c64-demo-screen" />
    </div>
  );
};
