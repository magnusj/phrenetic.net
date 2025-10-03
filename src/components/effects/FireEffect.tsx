import { useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { fireVertexShader, fireFragmentShader } from '../../shaders/fire';
import type { AudioData } from '../../types/audio';

interface FireEffectProps {
  audioData: AudioData | null;
}

export const FireEffect = ({ audioData }: FireEffectProps) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  const { viewport } = useThree();

  useFrame(({ clock }) => {
    if (materialRef.current) {
      materialRef.current.uniforms.time.value = clock.getElapsedTime();
    }
  });

  return (
    <mesh ref={meshRef} position={[0, 0, 0]}>
      <planeGeometry args={[viewport.width, viewport.height]} />
      <shaderMaterial
        ref={materialRef}
        vertexShader={fireVertexShader}
        fragmentShader={fireFragmentShader}
        uniforms={{
          time: { value: 0 },
        }}
      />
    </mesh>
  );
};
