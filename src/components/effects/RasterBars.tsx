import { useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { rasterBarsVertexShader, rasterBarsFragmentShader } from '../../shaders/rasterbars';
import type { AudioAnalysisData } from '../../types/audio';

interface RasterBarsProps {
  audioData: AudioAnalysisData | null;
}

export const RasterBars = ({ audioData: _audioData }: RasterBarsProps) => {
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
        vertexShader={rasterBarsVertexShader}
        fragmentShader={rasterBarsFragmentShader}
        uniforms={{
          time: { value: 0 },
        }}
      />
    </mesh>
  );
};
