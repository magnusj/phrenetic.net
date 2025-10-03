import { useState, useEffect } from 'react';
import './SceneInfo.css';

export interface SceneStat {
  label: string;
  value: string | number;
}

interface SceneInfoProps {
  name: string;
  stats?: SceneStat[];
}

export const SceneInfo = ({ name, stats }: SceneInfoProps) => {
  const [fps, setFps] = useState(0);

  useEffect(() => {
    let animationFrameId: number;
    let frames = 0;
    let lastFpsUpdate = performance.now();

    const updateFps = () => {
      frames++;
      const currentTime = performance.now();
      const elapsed = currentTime - lastFpsUpdate;

      if (elapsed >= 1000) {
        setFps(Math.round((frames * 1000) / elapsed));
        frames = 0;
        lastFpsUpdate = currentTime;
      }

      animationFrameId = requestAnimationFrame(updateFps);
    };

    updateFps();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <div className="scene-info">
      <div className="scene-info-line">
        <span className="scene-info-label">EFFECT:</span>
        <span className="scene-info-value">{name}</span>
      </div>
      <div className="scene-info-line">
        <span className="scene-info-label">FPS:</span>
        <span className="scene-info-value">{fps}</span>
      </div>
      {stats && stats.map((stat, index) => (
        <div key={index} className="scene-info-line">
          <span className="scene-info-label">{stat.label}:</span>
          <span className="scene-info-value">{stat.value}</span>
        </div>
      ))}
    </div>
  );
};
