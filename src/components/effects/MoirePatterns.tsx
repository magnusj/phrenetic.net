import { useRef, useState, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { moireVertexShader, moireFragmentShader } from '../../shaders/moire';
import type { AudioData } from '../../types/audio';

interface MoirePatternsProps {
  audioDataRef: React.RefObject<AudioData | null>;
}

interface AudioDebugValues {
  bassAverage: number;
  bass: number;
  bassHit: number;
  isHitting: boolean;
}

export const MoirePatterns = ({ audioDataRef }: MoirePatternsProps) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  const { viewport } = useThree();
  const frameCountRef = useRef(0);

  // Component mount log
  useEffect(() => {
    console.log('[MoirePatterns] Component mounted!');
    console.log('[MoirePatterns] audioDataRef on mount:', audioDataRef.current ? 'EXISTS' : 'NULL');
    console.log('[MoirePatterns] viewport:', viewport);
    console.log('[MoirePatterns] meshRef:', meshRef.current);
    console.log('[MoirePatterns] materialRef:', materialRef.current);

    return () => {
      console.log('[MoirePatterns] Component unmounting');
    };
  }, [audioDataRef]);

  useFrame(({ clock }) => {
    frameCountRef.current++;

    // Log first few frames BEFORE the materialRef check to see if useFrame is running at all
    if (frameCountRef.current < 3 || frameCountRef.current % 60 === 0) {
      console.log('[MoirePatterns useFrame] Frame #', frameCountRef.current, 'materialRef:', materialRef.current ? 'EXISTS' : 'NULL');
    }

    if (materialRef.current) {
      try {
        const elapsedTime = clock.getElapsedTime();

        // Debug: Log material structure on first few frames
        if (frameCountRef.current < 3) {
          console.log('[MoirePatterns useFrame] materialRef.current:', materialRef.current);
          console.log('[MoirePatterns useFrame] uniforms exists?', 'uniforms' in materialRef.current);
          if ('uniforms' in materialRef.current) {
            console.log('[MoirePatterns useFrame] uniforms:', materialRef.current.uniforms);
          }
        }

        // Check if uniforms exist before accessing
        if (!materialRef.current.uniforms) {
          console.error('[MoirePatterns useFrame] uniforms is undefined!');
          return;
        }

        // Update time uniform
        if (materialRef.current.uniforms.time) {
          materialRef.current.uniforms.time.value = elapsedTime;
        } else {
          console.error('[MoirePatterns useFrame] uniforms.time is undefined!');
        }

        // Log audio data and uniforms
        if (frameCountRef.current < 3 || frameCountRef.current % 60 === 0) {
          console.log('[MoirePatterns useFrame] Frame #', frameCountRef.current);
          console.log('[MoirePatterns useFrame] time:', elapsedTime.toFixed(2));
          console.log('[MoirePatterns useFrame] audioData:', audioDataRef.current ? 'EXISTS' : 'NULL');
          if (materialRef.current.uniforms.time) {
            console.log('[MoirePatterns useFrame] uniforms.time.value:', materialRef.current.uniforms.time.value.toFixed(2));
          }
        }

        // Audio reactivity - use audioDataRef instead of audioData
        const currentAudioData = audioDataRef.current;
        if (currentAudioData) {
          // Overall intensity (average of all frequencies)
          const intensity = currentAudioData.frequencyData.reduce((sum, val) => sum + val, 0) / currentAudioData.frequencyData.length / 255;
          if (materialRef.current.uniforms.audioIntensity) {
            materialRef.current.uniforms.audioIntensity.value = intensity;
          }

          // Bass response (low frequencies)
          const bassRange = Math.floor(currentAudioData.frequencyData.length * 0.1);
          const bassSum = currentAudioData.frequencyData.slice(0, bassRange).reduce((sum, val) => sum + val, 0);
          const bassAverage = bassSum / bassRange;
          const bass = bassAverage / 255; // Normalized 0-1

          if (materialRef.current.uniforms.audioBass) {
            materialRef.current.uniforms.audioBass.value = bass;
          }

          // Detect strong bass hits (threshold = 170)
          const threshold = 170;
          const bassHit = bassAverage > threshold
            ? Math.min((bassAverage - threshold) / 50, 1.0) // Faster ramp to max
            : 0.0;

          if (materialRef.current.uniforms.bassHit) {
            materialRef.current.uniforms.bassHit.value = bassHit;
          }

          // Log bass values
          if (frameCountRef.current < 3 || frameCountRef.current % 60 === 0) {
            console.log('[MoirePatterns useFrame] bassAverage:', bassAverage.toFixed(1), 'bassHit:', bassHit.toFixed(3));
          }
        } else {
          // No audio, use defaults
          if (materialRef.current.uniforms.audioIntensity) {
            materialRef.current.uniforms.audioIntensity.value = 0.3;
          }
          if (materialRef.current.uniforms.audioBass) {
            materialRef.current.uniforms.audioBass.value = 0.3;
          }
          if (materialRef.current.uniforms.bassHit) {
            materialRef.current.uniforms.bassHit.value = 0.0;
          }
        }
      } catch (error) {
        console.error('[MoirePatterns useFrame] ERROR:', error);
        console.error('[MoirePatterns useFrame] materialRef.current:', materialRef.current);
      }
    }
  });

  return (
    <mesh ref={meshRef} position={[0, 0, 0]}>
      <planeGeometry args={[viewport.width, viewport.height]} />
      <shaderMaterial
        ref={materialRef}
        vertexShader={moireVertexShader}
        fragmentShader={moireFragmentShader}
        uniforms={{
          time: { value: 0 },
          audioIntensity: { value: 0.3 },
          audioBass: { value: 0.3 },
          bassHit: { value: 0.0 },
        }}
      />
    </mesh>
  );
};

// Audio debug overlay component (to be used outside Canvas)
export const AudioDebugOverlay = ({ audioDataRef }: { audioDataRef: React.RefObject<AudioData | null> }) => {
  const [debugValues, setDebugValues] = useState<AudioDebugValues>({
    bassAverage: 0,
    bass: 0,
    bassHit: 0,
    isHitting: false,
  });

  // Update debug values every frame
  useEffect(() => {
    const interval = setInterval(() => {
      const audioData = audioDataRef.current;
      if (audioData && audioData.frequencyData && audioData.frequencyData.length > 0) {
        const bassRange = Math.floor(audioData.frequencyData.length * 0.1);
        const bassSum = audioData.frequencyData.slice(0, bassRange).reduce((sum: number, val: number) => sum + val, 0);
        const bassAverage = bassSum / bassRange;
        const bass = bassAverage / 255;
        const threshold = 170;
        const bassHit = bassAverage > threshold
          ? Math.min((bassAverage - threshold) / 50, 1.0)
          : 0.0;

        setDebugValues({
          bassAverage,
          bass,
          bassHit,
          isHitting: bassAverage > threshold,
        });
      }
    }, 50); // Update 20 times per second

    return () => clearInterval(interval);
  }, [audioDataRef]);

  return (
    <div
      style={{
        position: 'fixed',
        top: '20px',
        right: '20px',
        padding: '15px',
        background: 'rgba(0, 0, 0, 0.8)',
        color: '#0f0',
        fontFamily: '"Press Start 2P", monospace',
        fontSize: '10px',
        border: '2px solid #0f0',
        zIndex: 1000,
        minWidth: '250px',
        pointerEvents: 'none',
      }}
    >
      <div style={{ marginBottom: '8px', color: '#fff', fontSize: '12px' }}>
        🎵 AUDIO DEBUG
      </div>
      <div style={{ marginBottom: '5px' }}>
        BASS AVG: {debugValues.bassAverage.toFixed(1)} / 255
      </div>
      <div style={{ marginBottom: '5px' }}>
        BASS NORM: {debugValues.bass.toFixed(3)}
      </div>
      <div style={{ marginBottom: '5px' }}>
        BASS HIT: {debugValues.bassHit.toFixed(3)}
      </div>
      <div style={{ marginBottom: '5px' }}>
        THRESHOLD: 170
      </div>
      <div style={{
        marginTop: '8px',
        padding: '5px',
        background: debugValues.isHitting ? '#0f0' : '#333',
        color: debugValues.isHitting ? '#000' : '#666',
        textAlign: 'center',
        fontWeight: 'bold'
      }}>
        {debugValues.isHitting ? '🔥 HIT!' : '--- IDLE ---'}
      </div>
      <div style={{ marginTop: '8px', fontSize: '8px', color: '#888' }}>
        AUDIO: {audioDataRef.current ? 'ACTIVE' : 'NULL'}
      </div>
    </div>
  );
};
