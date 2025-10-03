import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { AudioAnalysisData } from '../../types/audio';

interface DotBallsProps {
  audioData: AudioAnalysisData | null;
}

export const DotBalls = ({ audioData: _audioData }: DotBallsProps) => {
  const pointsRef = useRef<THREE.Points>(null);
  const groupRef = useRef<THREE.Group>(null);

  // Create sphere of particles
  const particles = useMemo(() => {
    const particleCount = 500;
    const radius = 2;
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);

    // Amiga-style colors
    const dotColors = [
      new THREE.Color(1, 1, 1),     // White
      new THREE.Color(0, 1, 1),     // Cyan
      new THREE.Color(1, 0, 1),     // Magenta
      new THREE.Color(1, 1, 0),     // Yellow
    ];

    for (let i = 0; i < particleCount; i++) {
      const i3 = i * 3;

      // Fibonacci sphere distribution for even particle spacing
      const phi = Math.acos(1 - 2 * (i + 0.5) / particleCount);
      const theta = Math.PI * (1 + Math.sqrt(5)) * i;

      const x = radius * Math.sin(phi) * Math.cos(theta);
      const y = radius * Math.sin(phi) * Math.sin(theta);
      const z = radius * Math.cos(phi);

      positions[i3] = x;
      positions[i3 + 1] = y;
      positions[i3 + 2] = z;

      // Random color from palette
      const color = dotColors[Math.floor(Math.random() * dotColors.length)];
      colors[i3] = color.r;
      colors[i3 + 1] = color.g;
      colors[i3 + 2] = color.b;
    }

    return { positions, colors, count: particleCount, radius };
  }, []);

  useFrame(({ clock }) => {
    if (!groupRef.current) return;

    const time = clock.getElapsedTime();

    // Multi-axis rotation (classic demo scene style)
    groupRef.current.rotation.x = time * 0.3;
    groupRef.current.rotation.y = time * 0.5;
    groupRef.current.rotation.z = time * 0.2;
  });

  return (
    <group ref={groupRef}>
      <points ref={pointsRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[particles.positions, 3]}
          />
          <bufferAttribute
            attach="attributes-color"
            args={[particles.colors, 3]}
          />
        </bufferGeometry>
        <pointsMaterial
          size={0.05}
          vertexColors
          transparent
          opacity={0.9}
          sizeAttenuation={true}
        />
      </points>
    </group>
  );
};
