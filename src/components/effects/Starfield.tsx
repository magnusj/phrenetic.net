import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { AudioAnalysisData } from '../../types/audio';

interface StarfieldProps {
  audioData: AudioAnalysisData | null;
}

export const Starfield = ({ audioData: _audioData }: StarfieldProps) => {
  const pointsRef = useRef<THREE.Points>(null);

  // Create stars
  const stars = useMemo(() => {
    const starCount = 1000;
    const positions = new Float32Array(starCount * 3);
    const colors = new Float32Array(starCount * 3);
    const speeds = new Float32Array(starCount);

    // Amiga-style colors: white, cyan, magenta
    const starColors = [
      new THREE.Color(1, 1, 1),     // White
      new THREE.Color(0, 1, 1),     // Cyan
      new THREE.Color(1, 0, 1),     // Magenta
    ];

    for (let i = 0; i < starCount; i++) {
      const i3 = i * 3;

      // Random position in 3D space
      positions[i3] = (Math.random() - 0.5) * 100;     // x
      positions[i3 + 1] = (Math.random() - 0.5) * 100; // y
      positions[i3 + 2] = -Math.random() * 100;        // z (behind camera)

      // Random speed (creates depth illusion)
      speeds[i] = 0.1 + Math.random() * 0.3;

      // Random color from Amiga palette
      const color = starColors[Math.floor(Math.random() * starColors.length)];
      colors[i3] = color.r;
      colors[i3 + 1] = color.g;
      colors[i3 + 2] = color.b;
    }

    return { positions, colors, speeds, count: starCount };
  }, []);

  useFrame(() => {
    if (!pointsRef.current) return;

    const positions = pointsRef.current.geometry.attributes.position.array as Float32Array;

    // Move stars toward camera
    for (let i = 0; i < stars.count; i++) {
      const i3 = i * 3;

      // Move star forward
      positions[i3 + 2] += stars.speeds[i];

      // Reset star if it passes the camera
      if (positions[i3 + 2] > 5) {
        positions[i3 + 2] = -100;
        positions[i3] = (Math.random() - 0.5) * 100;
        positions[i3 + 1] = (Math.random() - 0.5) * 100;
      }
    }

    pointsRef.current.geometry.attributes.position.needsUpdate = true;
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[stars.positions, 3]}
        />
        <bufferAttribute
          attach="attributes-color"
          args={[stars.colors, 3]}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.2}
        vertexColors
        transparent
        opacity={0.8}
        sizeAttenuation={true}
      />
    </points>
  );
};
