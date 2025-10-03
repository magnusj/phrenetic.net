import { useEffect, useRef } from 'react';
import type { AudioData } from '../../types/audio';
import './DYCPScroller.css';

interface DYCPScrollerProps {
  text: string;
  audioData: AudioData | null;
  speed?: number;
  amplitude?: number;
  frequency?: number;
}

export const DYCPScroller = ({
  text,
  audioData,
  speed = 2,
  amplitude = 40,
  frequency = 0.3
}: DYCPScrollerProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number>(0);
  const scrollPosRef = useRef<number>(window.innerWidth);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const chars = text.split('');
    container.innerHTML = '';

    // Create span for each character
    chars.forEach((char, i) => {
      const span = document.createElement('span');
      span.textContent = char === ' ' ? '\u00A0' : char;
      span.className = 'dycp-char';
      span.style.position = 'absolute';
      span.style.left = `${i * 20}px`; // Character spacing
      container.appendChild(span);
    });

    const animate = () => {
      scrollPosRef.current -= speed;

      const bassBoost = audioData?.bass || 0;
      const midBoost = audioData?.mid || 0;
      const time = Date.now() * 0.001;

      // Find the last character's position to check if entire text has scrolled off
      const lastCharIndex = chars.length - 1;
      const lastCharX = scrollPosRef.current + lastCharIndex * 20;

      Array.from(container.children).forEach((span, i) => {
        const htmlSpan = span as HTMLSpanElement;
        const worldX = scrollPosRef.current + i * 20;

        // DYCP: Y position based on screen X position (not world X)
        // This creates a stationary wave that text scrolls through
        const screenX = worldX % (window.innerWidth + chars.length * 20);

        // Classic DYCP sine wave - each character at different Y based on screen position
        // Smoother wave with lower frequency
        // Center vertically by offsetting from middle of container
        const y = Math.sin(screenX * 0.01 + time * 0.3) * (amplitude + bassBoost * 30);

        // Color shift based on position and audio
        const hue = (screenX * 0.5 + time * 50 + midBoost * 100) % 360;

        // Position horizontally and vertically with sine wave offset
        // Container is already centered, so characters oscillate around center
        htmlSpan.style.transform = `translate(${worldX}px, ${y}px)`;
        htmlSpan.style.color = `hsl(${hue}, 100%, 60%)`;
      });

      // Only wrap when the ENTIRE text (last character) has scrolled completely off-screen to the left
      if (lastCharX < -window.innerWidth) {
        scrollPosRef.current = window.innerWidth;
      }

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationRef.current);
    };
  }, [text, audioData, speed, amplitude, frequency]);

  return (
    <div className="dycp-container">
      <div ref={containerRef} className="dycp-text"></div>
    </div>
  );
};
