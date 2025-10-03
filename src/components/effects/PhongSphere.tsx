import { useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { phongSphereVertexShader, phongSphereFragmentShader } from '../../shaders/phongsphere';
import type { AudioAnalysisData } from '../../types/audio';

interface PhongSphereProps {
  audioData: AudioAnalysisData | null;
}

export const PhongSphere = ({ audioData: _audioData }: PhongSphereProps) => {
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
        vertexShader={phongSphereVertexShader}
        fragmentShader={phongSphereFragmentShader}
        uniforms={{
          time: { value: 0 },
        }}
      />
    </mesh>
  );
};
