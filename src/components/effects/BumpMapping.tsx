import { useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { bumpMappingVertexShader, bumpMappingFragmentShader } from '../../shaders/bumpmapping';
import type { AudioAnalysisData } from '../../types/audio';

interface BumpMappingProps {
  audioData: AudioAnalysisData | null;
}

export const BumpMapping = ({ audioData: _audioData }: BumpMappingProps) => {
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
        vertexShader={bumpMappingVertexShader}
        fragmentShader={bumpMappingFragmentShader}
        uniforms={{
          time: { value: 0 },
        }}
      />
    </mesh>
  );
};
