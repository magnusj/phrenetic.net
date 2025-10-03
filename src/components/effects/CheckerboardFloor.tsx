import { useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { checkerboardVertexShader, checkerboardFragmentShader } from '../../shaders/checkerboard';
import type { AudioData } from '../../types/audio';

interface CheckerboardFloorProps {
  audioData: AudioData | null;
}

export const CheckerboardFloor = ({ audioData }: CheckerboardFloorProps) => {
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
        vertexShader={checkerboardVertexShader}
        fragmentShader={checkerboardFragmentShader}
        uniforms={{
          time: { value: 0 },
        }}
      />
    </mesh>
  );
};
