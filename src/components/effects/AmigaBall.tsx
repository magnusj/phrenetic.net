import { useRef, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { amigaBallVertexShader, amigaBallFragmentShader } from '../../shaders/amigaball';
import type { AudioData } from '../../types/audio';
import './AmigaBall.css';

interface AmigaBallProps {
  audioData: AudioData | null;
  onStartDemo?: () => void;
}

export const AmigaBall = ({ audioData, onStartDemo }: AmigaBallProps) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  const { viewport } = useThree();
  const [isFullscreen, setIsFullscreen] = useState(false);

  useFrame(({ clock }) => {
    if (materialRef.current) {
      materialRef.current.uniforms.time.value = clock.getElapsedTime();
    }
  });

  const handleStartDemo = async () => {
    console.log('Start demo clicked');

    // Toggle fullscreen if checked
    if (isFullscreen) {
      try {
        await document.documentElement.requestFullscreen();
      } catch (err) {
        console.error('Fullscreen failed:', err);
      }
    }

    // Call the callback to start demo (music + timer)
    if (onStartDemo) {
      onStartDemo();
    }
  };

  return (
    <>
      {/* Shader background */}
      <mesh ref={meshRef} position={[0, 0, 0]}>
        <planeGeometry args={[viewport.width, viewport.height]} />
        <shaderMaterial
          ref={materialRef}
          vertexShader={amigaBallVertexShader}
          fragmentShader={amigaBallFragmentShader}
          uniforms={{
            time: { value: 0 },
          }}
        />
      </mesh>

      {/* Title screen overlay */}
      <group>
        <mesh position={[0, 0, 0.1]}>
          <planeGeometry args={[viewport.width, viewport.height]} />
          <meshBasicMaterial transparent opacity={0} />
        </mesh>
      </group>
    </>
  );
};

// HTML Overlay Component
interface AmigaBallOverlayProps {
  onStartDemo?: () => void;
}

export const AmigaBallOverlay = ({ onStartDemo }: AmigaBallOverlayProps) => {
  const [isFullscreen, setIsFullscreen] = useState(false);

  const handleStartDemo = async () => {
    console.log('Start demo clicked');

    // Toggle fullscreen if checked
    if (isFullscreen) {
      try {
        await document.documentElement.requestFullscreen();
      } catch (err) {
        console.error('Fullscreen failed:', err);
      }
    }

    // Start the demo
    if (onStartDemo) {
      onStartDemo();
    }
  };

  return (
    <div className="amiga-ball-overlay">
      <div className="title-content">
        <div className="title-main">
          <h1 className="title-logo">PHRENETiC.NET</h1>
          <p className="title-subtitle">16-BIT MEMORIES • 2025</p>
        </div>

        <div className="title-tribute">
          <p>A Tribute to The Amiga Demo Scene</p>
        </div>

        <div className="title-credits">
          <p className="credits-label">Code, Gfx, Music</p>
          <p className="credits-name">Supremo</p>
        </div>

        <div className="title-controls">
          <button className="start-button" onClick={handleStartDemo}>
            PRESS PLAY ON TAPE
          </button>

          <label className="fullscreen-option">
            <input
              type="checkbox"
              checked={isFullscreen}
              onChange={(e) => setIsFullscreen(e.target.checked)}
            />
            <span>Fullscreen Mode</span>
          </label>
        </div>

        <div className="title-help">
          <p>SPACE: Play/Pause • ← →: Skip Scenes</p>
        </div>
      </div>
    </div>
  );
};
