import { useState, useEffect, ReactNode, cloneElement, isValidElement, useRef } from 'react';
import type { AudioData } from '../types/audio';
import './SceneManager.css';

export interface Scene {
  id: string;
  duration: number; // seconds
  component: ReactNode;
}

interface SceneManagerProps {
  scenes: Scene[];
  audioData: AudioData | null;
  isPlaying: boolean;
  onStartDemo: () => void;
  onSceneChange?: (sceneIndex: number) => void;
}

export const SceneManager = ({ scenes, audioData, isPlaying, onStartDemo, onSceneChange }: SceneManagerProps) => {
  const [currentSceneIndex, setCurrentSceneIndex] = useState(0);
  const [sceneTime, setSceneTime] = useState(0);
  const [transitioning, setTransitioning] = useState(false);
  const [demoStarted, setDemoStarted] = useState(false);
  const isTransitionScheduledRef = useRef(false);

  // Notify parent about scene changes
  useEffect(() => {
    if (onSceneChange) {
      onSceneChange(currentSceneIndex);
    }
  }, [currentSceneIndex, onSceneChange]);

  const handleStartDemo = () => {
    console.log('Demo started from title screen');
    setDemoStarted(true);
    onStartDemo();

    // Immediately advance to next scene after a short delay
    setTimeout(() => {
      if (currentSceneIndex === 0) {
        setTransitioning(true);
        setTimeout(() => {
          setCurrentSceneIndex(1);
          setSceneTime(0);
          setTransitioning(false);
        }, 300); // Fade duration
      }
    }, 500); // Wait 0.5s for music to start
  };

  useEffect(() => {
    // Only advance timer if demo has started AND music is playing AND not transitioning
    if (!isPlaying || !demoStarted || transitioning) return;

    const interval = setInterval(() => {
      setSceneTime((prev) => {
        const newTime = prev + 0.1;
        const currentScene = scenes[currentSceneIndex];

        if (newTime >= currentScene.duration && !isTransitionScheduledRef.current) {
          // Trigger transition (only if not already scheduled)
          isTransitionScheduledRef.current = true;
          setTransitioning(true);
          setTimeout(() => {
            setCurrentSceneIndex((prevIndex) => (prevIndex + 1) % scenes.length);
            setSceneTime(0);
            setTransitioning(false);
            isTransitionScheduledRef.current = false; // Reset flag
          }, 300); // Fade duration
          return 0;
        }

        return newTime;
      });
    }, 100);

    return () => clearInterval(interval);
  }, [isPlaying, demoStarted, transitioning, currentSceneIndex, scenes]);

  // Manual scene skip with arrow keys only
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' && !isTransitionScheduledRef.current) {
        isTransitionScheduledRef.current = true;
        setTransitioning(true);
        setTimeout(() => {
          setCurrentSceneIndex((prevIndex) => (prevIndex + 1) % scenes.length);
          setSceneTime(0);
          setTransitioning(false);
          isTransitionScheduledRef.current = false;
        }, 300);
      } else if (e.key === 'ArrowLeft' && !isTransitionScheduledRef.current) {
        isTransitionScheduledRef.current = true;
        setTransitioning(true);
        setTimeout(() => {
          setCurrentSceneIndex((prevIndex) => (prevIndex - 1 + scenes.length) % scenes.length);
          setSceneTime(0);
          setTransitioning(false);
          isTransitionScheduledRef.current = false;
        }, 300);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [scenes.length]);

  const currentScene = scenes[currentSceneIndex];
  const progress = (sceneTime / currentScene.duration) * 100;

  // Inject props into scene components dynamically (only when needed)
  const renderSceneContent = () => {
    const content = currentScene.component;

    console.log('[SceneManager renderScene] Scene index:', currentSceneIndex);
    console.log('[SceneManager renderScene] Scene ID:', currentScene.id);
    console.log('[SceneManager renderScene] audioData received:', audioData ? 'EXISTS' : 'NULL');

    // Only inject props for specific scenes that need them
    if (isValidElement(content)) {
      const props: any = {};

      // Inject onStartDemo for title scene (scene 0)
      if (currentSceneIndex === 0) {
        console.log('[SceneManager renderScene] Scene 0: injecting onStartDemo');
        props.onStartDemo = handleStartDemo;
      }

      // Scene 21 (moire patterns) now gets audioData directly from scenes.tsx
      // No cloneElement needed

      // Only clone if we have props to inject
      if (Object.keys(props).length > 0) {
        console.log('[SceneManager renderScene] Cloning element with props:', Object.keys(props));
        return cloneElement(content as React.ReactElement<any>, props);
      }
    }

    console.log('[SceneManager renderScene] Returning content as-is (no props to inject)');
    return content;
  };

  return (
    <div className="scene-manager">
      <div className={`scene-content ${transitioning ? 'fade-out' : 'fade-in'}`}>
        {renderSceneContent()}
      </div>

      {/* Scene progress indicator */}
      <div className="scene-indicator">
        <div className="scene-dots">
          {scenes.map((_, index) => (
            <div
              key={index}
              className={`dot ${index === currentSceneIndex ? 'active' : ''}`}
            />
          ))}
        </div>
        <div className="scene-progress-bar">
          <div className="scene-progress-fill" style={{ width: `${progress}%` }} />
        </div>
      </div>
    </div>
  );
};
