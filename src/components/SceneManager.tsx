import { useState, useEffect, type ReactNode, cloneElement, isValidElement, useRef } from 'react';
import type { AudioAnalysisData } from '../types/audio';
import { useTouchGestures } from '../hooks/useTouchGestures';
import { useTapDetection } from '../hooks/useTapDetection';
import { useSceneInfo } from '../contexts/SceneInfoContext';
import './SceneManager.css';

export interface Scene {
  id: string;
  duration: number; // seconds
  component: ReactNode;
}

interface SceneManagerProps {
  scenes: Scene[];
  audioData: AudioAnalysisData | null;
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
  const lastTimeRef = useRef<number>(performance.now());
  const { toggleSceneInfoVisibility } = useSceneInfo();

  // Touch gesture handlers for scene navigation
  const handleSwipeLeft = () => {
    if (!isTransitionScheduledRef.current && demoStarted) {
      isTransitionScheduledRef.current = true;
      setTransitioning(true);
      setTimeout(() => {
        setCurrentSceneIndex((prevIndex) => (prevIndex + 1) % scenes.length);
        setSceneTime(0);
        setTransitioning(false);
        isTransitionScheduledRef.current = false;
      }, 300);
    }
  };

  const handleSwipeRight = () => {
    if (!isTransitionScheduledRef.current && demoStarted) {
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

  const touchGestures = useTouchGestures({
    onSwipeLeft: handleSwipeLeft,
    onSwipeRight: handleSwipeRight,
  });

  const tapDetection = useTapDetection({
    onTap: () => {
      if (demoStarted) {
        toggleSceneInfoVisibility();
      }
    },
  });

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

    let animationFrameId: number;
    lastTimeRef.current = performance.now(); // Reset on state change

    const animate = (timestamp: number) => {
      const delta = (timestamp - lastTimeRef.current) / 1000; // Convert to seconds
      lastTimeRef.current = timestamp;

      setSceneTime((prev) => {
        const newTime = prev + delta;
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
          return currentScene.duration; // Cap at duration to prevent overshoot
        }

        return newTime;
      });

      animationFrameId = requestAnimationFrame(animate);
    };

    animationFrameId = requestAnimationFrame(animate);

    return () => cancelAnimationFrame(animationFrameId);
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

  // Touch events drive swipes; pointer events (mouse + touch) drive taps.
  // Capture phase so taps are seen before the Canvas handles them.
  const gestureHandlers = {
    onTouchStart: touchGestures.onTouchStart,
    onTouchMove: touchGestures.onTouchMove,
    onTouchEnd: touchGestures.onTouchEnd,
    onPointerDownCapture: tapDetection.onPointerDown,
    onPointerUpCapture: tapDetection.onPointerUp,
  };

  return (
    <div className="scene-manager" {...gestureHandlers}>
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
