import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { AudioAnalysisData } from '../../types/audio';

interface WireframeCubeProps {
  audioData: AudioAnalysisData | null;
}

export const WireframeCube = ({ audioData: _audioData }: WireframeCubeProps) => {
  const groupRef = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    if (!groupRef.current) return;

    const time = clock.getElapsedTime();

    // Classic demo rotation - constant speed
    const rotationSpeed = 0.5;
    groupRef.current.rotation.x = time * rotationSpeed;
    groupRef.current.rotation.y = time * rotationSpeed * 0.7;
    groupRef.current.rotation.z = time * rotationSpeed * 0.3;
  });

  return (
    <group ref={groupRef}>
      <lineSegments>
        <edgesGeometry args={[new THREE.BoxGeometry(2, 2, 2)]} />
        <lineBasicMaterial color="#00ffff" linewidth={2} />
      </lineSegments>
    </group>
  );
};
