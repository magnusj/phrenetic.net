import { useState, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { MoirePatterns, AudioDebugOverlay } from '../effects/MoirePatterns';
import { SceneInfo } from '../SceneInfo';
import type { AudioAnalysisData } from '../../types/audio';

interface MoirePatternsSceneProps {
  audioDataRef: React.RefObject<AudioAnalysisData | null>;
}

export const MoirePatternsScene = ({ audioDataRef }: MoirePatternsSceneProps) => {
  const [showDebug, setShowDebug] = useState(false);

  // Toggle debug overlay with 'D' key
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'd' || e.key === 'D') {
        setShowDebug(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, []);

  return (
    <>
      <Canvas
        camera={{ position: [0, 0, 5], fov: 75 }}
        gl={{ antialias: false, alpha: false }}
        frameloop="always"
        style={{ width: "100%", height: "100%" }}
      >
        <color attach="background" args={["#000000"]} />
        <MoirePatterns audioDataRef={audioDataRef} />
      </Canvas>
      {showDebug && <AudioDebugOverlay audioDataRef={audioDataRef} />}
      <SceneInfo
        name="MOIRE PATTERNS"
        stats={[
          { label: "LAYERS", value: 4 },
          { label: "FREQUENCY", value: "50Hz" },
        ]}
      />
    </>
  );
};
