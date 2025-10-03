import { useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { metaballsVertexShader, metaballsFragmentShader } from '../../shaders/metaballs';
import type { AudioAnalysisData } from '../../types/audio';

interface MetaballsProps {
  audioData: AudioAnalysisData | null;
}

export const Metaballs = ({ audioData: _audioData }: MetaballsProps) => {
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
        vertexShader={metaballsVertexShader}
        fragmentShader={metaballsFragmentShader}
        uniforms={{
          time: { value: 0 },
          resolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
        }}
      />
    </mesh>
  );
};
