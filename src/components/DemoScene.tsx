import { Canvas } from '@react-three/fiber';
import { PlasmaEffect } from './effects/PlasmaEffect';
import { CopperBars } from './effects/CopperBars';
import type { AudioAnalysisData } from '../types/audio';

interface DemoSceneProps {
  audioData: AudioAnalysisData | null;
}

export const DemoScene = ({ audioData }: DemoSceneProps) => {
  return (
    <div className="demo-scene">
      <Canvas
        camera={{ position: [0, 0, 5], fov: 75 }}
        gl={{ antialias: false, alpha: false }}
      >
        <color attach="background" args={['#000000']} />
        <PlasmaEffect audioData={audioData} />
        <CopperBars audioData={audioData} />
      </Canvas>
    </div>
  );
};
