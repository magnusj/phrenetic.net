import { useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { mandelbrotVertexShader, mandelbrotFragmentShader } from '../../shaders/mandelbrot';
import type { AudioData } from '../../types/audio';

interface MandelbrotZoomProps {
  audioData: AudioData | null;
}

export const MandelbrotZoom = ({ audioData }: MandelbrotZoomProps) => {
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
        vertexShader={mandelbrotVertexShader}
        fragmentShader={mandelbrotFragmentShader}
        uniforms={{
          time: { value: 0 },
          resolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
        }}
      />
    </mesh>
  );
};
