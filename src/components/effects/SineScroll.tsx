import { useEffect, useRef } from 'react';
import type { AudioAnalysisData } from '../../types/audio';
import './SineScroll.css';

interface SineScrollProps {
  audioData: AudioAnalysisData | null;
  text: string[];
  speed?: number;
  amplitude?: number;
}

export const SineScroll = ({ audioData: _audioData, text, speed = 30, amplitude = 80 }: SineScrollProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollPosRef = useRef(window.innerHeight);
  const animationRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    const animate = () => {
      if (!containerRef.current) return;

      // Update scroll position
      scrollPosRef.current -= speed / 60;

      // Reset when all text has scrolled off screen
      if (scrollPosRef.current < -text.length * 60) {
        scrollPosRef.current = window.innerHeight;
      }

      // Update each line position
      const lines = containerRef.current.querySelectorAll('.sine-scroll-line');
      lines.forEach((line, index) => {
        const element = line as HTMLDivElement;
        const y = scrollPosRef.current + index * 60;

        // Horizontal sine wave based on vertical position
        const time = Date.now() / 1000;
        const x = Math.sin(y / 80 + time) * amplitude;

        element.style.transform = `translate(${x}px, ${y}px)`;
      });

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [text, speed, amplitude]);

  return (
    <div ref={containerRef} className="sine-scroll-container">
      {text.map((line, index) => (
        <div key={index} className="sine-scroll-line">
          {line}
        </div>
      ))}
    </div>
  );
};
