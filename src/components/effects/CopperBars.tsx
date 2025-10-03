import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { AudioData } from '../../types/audio';

interface CopperBarsProps {
  audioData: AudioData | null;
}

export const CopperBars = ({ audioData }: CopperBarsProps) => {
  const groupRef = useRef<THREE.Group>(null);
  const NUM_BARS = 32;

  // Create copper bar colors (classic Amiga palette)
  const bars = useMemo(() => {
    return Array.from({ length: NUM_BARS }, (_, i) => {
      const t = i / NUM_BARS;
      // Rainbow gradient
      const hue = t * 360;
      return {
        color: new THREE.Color().setHSL(hue / 360, 1.0, 0.5),
        position: i - NUM_BARS / 2,
      };
    });
  }, []);

  useFrame(({ clock }) => {
    if (!groupRef.current) return;

    const time = clock.getElapsedTime();

    // Animate each bar
    groupRef.current.children.forEach((bar, i) => {
      const offset = i * 0.1;
      // Wave motion
      bar.position.y = Math.sin(time * 2 + offset) * 2 + Math.sin(time * 3 + offset * 2) * 0.5;
      // Slight rotation
      bar.rotation.z = Math.sin(time + offset) * 0.1;
    });
  });

  return (
    <group ref={groupRef} position={[0, 0, -1]}>
      {bars.map((bar, i) => (
        <mesh key={i} position={[0, bar.position * 0.2, 0]}>
          <planeGeometry args={[12, 0.15]} />
          <meshBasicMaterial color={bar.color} transparent opacity={0.8} />
        </mesh>
      ))}
    </group>
  );
};
