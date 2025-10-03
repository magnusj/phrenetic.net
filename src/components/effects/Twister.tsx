import { useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { twisterVertexShader, twisterFragmentShader } from '../../shaders/twister';
import type { AudioData } from '../../types/audio';

interface TwisterProps {
  audioData: AudioData | null;
}

export const Twister = ({ audioData }: TwisterProps) => {
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
        vertexShader={twisterVertexShader}
        fragmentShader={twisterFragmentShader}
        uniforms={{
          time: { value: 0 },
        }}
      />
    </mesh>
  );
};
