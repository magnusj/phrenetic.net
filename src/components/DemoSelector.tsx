import { useMemo } from 'react';
import { C64Screen } from '../c64/C64Screen';
import { createBootScreen } from '../c64/programs/bootScreen';
import { demoAudio } from '../c64/demoAudio';
import './DemoSelector.css';

export const DemoSelector = () => {
  const c64Preview = useMemo(() => createBootScreen(), []);

  return (
    <div className="demo-selector">
      <h1 className="demo-selector-title">PHRENETiC</h1>
      <p className="demo-selector-subtitle">SELECT YOUR MACHINE</p>

      <div className="demo-selector-cards">
        <a className="demo-card demo-card-amiga" href="#/amiga">
          <div className="demo-card-preview">
            <img className="demo-card-pixelated" src="/amiga-workbench.gif" alt="Amiga Workbench 1.2 boot screen" />
          </div>
          <span className="demo-card-name">AMIGA 500</span>
          <span className="demo-card-tagline">16-BIT MEMORIES</span>
        </a>

        {/* Unlocking audio in this click lets the C64 demo start loading without another click */}
        <a className="demo-card demo-card-c64" href="#/c64" onClick={() => demoAudio.unlock()}>
          <div className="demo-card-preview">
            <C64Screen program={c64Preview} />
          </div>
          <span className="demo-card-name">COMMODORE 64</span>
          <span className="demo-card-tagline">8-BIT MAYHEM</span>
        </a>
      </div>
    </div>
  );
};
