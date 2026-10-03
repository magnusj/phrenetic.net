import { useRef } from 'react';
import { useC64 } from './useC64';
import type { C64Program } from './vic';
import './C64Screen.css';

interface C64ScreenProps {
  program: C64Program;
  className?: string;
}

/** A PAL C64 screen (384x272 including border) running a program, scaled with hard pixel edges. */
export const C64Screen = ({ program, className }: C64ScreenProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useC64(canvasRef, program);

  return <canvas ref={canvasRef} className={`c64-screen ${className ?? ''}`} />;
};
