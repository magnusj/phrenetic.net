import { useState, useEffect, useRef, useMemo } from 'react';
import { SceneManager } from './components/SceneManager';
import { useAudioAnalyzer } from './hooks/useAudioAnalyzer';
import { createScenes } from './config/scenes';
import './App.css';

function App() {
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentScene, setCurrentScene] = useState(0);
  const audioData = useAudioAnalyzer(audioElement);
  const audioRef = useRef<HTMLAudioElement>(null);

  // Separate audio for moire scene (scene 21)
  const [moireAudioElement, setMoireAudioElement] = useState<HTMLAudioElement | null>(null);
  const moireAudioRef = useRef<HTMLAudioElement>(null);
  const moireAudioData = useAudioAnalyzer(moireAudioElement);

  // Store moireAudioData in a ref for scene 21 to access without causing re-renders
  const moireAudioDataRef = useRef<AudioData | null>(moireAudioData);
  useEffect(() => {
    moireAudioDataRef.current = moireAudioData;
  }, [moireAudioData]);

  const scenes = useMemo(() => createScenes(null, moireAudioDataRef), []);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    console.log('Setting up audio element');
    audio.src = '/tribute-to-amiga-500.mp3';

    // Event handlers
    const handlePlay = () => {
      console.log('Audio playing');
      setIsPlaying(true);
    };

    const handlePause = () => {
      console.log('Audio paused');
      setIsPlaying(false);
    };

    const handleEnded = () => {
      console.log('First song ended, switching to pixel-dreams.mp3');
      audio.src = '/pixel-dreams.mp3';
      audio.loop = true; // Loop the second song
      audio.play();
    };

    const handleError = (e: Event) => {
      console.error('Audio error:', e);
    };

    const handleLoadedData = () => {
      console.log('Audio loaded successfully');
    };

    // Add event listeners
    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError);
    audio.addEventListener('loadeddata', handleLoadedData);

    // Cleanup
    return () => {
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', handleError);
      audio.removeEventListener('loadeddata', handleLoadedData);
    };
  }, []);

  const handlePlayPause = async () => {
    const audio = audioRef.current;
    if (!audio) {
      console.error('Audio element not found');
      return;
    }

    console.log('Play/Pause clicked. Current state:', audio.paused ? 'paused' : 'playing');

    if (audio.paused) {
      // Ensure volume is set
      audio.volume = 1.0;
      audio.muted = false;

      try {
        // CRITICAL: Resume audio context on user interaction
        // The audio context must be created/resumed after user gesture
        if (!audioElement) {
          console.log('Setting audio element to trigger analyzer');
          setAudioElement(audio);
        }

        await audio.play();
        console.log('Play started successfully');
      } catch (err) {
        console.error('Play failed:', err);
      }
    } else {
      audio.pause();
    }
  };

  // Space bar to play/pause (only when demo is running - scene > 0)
  useEffect(() => {
    if (currentScene === 0) return;

    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === ' ') {
        e.preventDefault(); // Prevent page scroll
        handlePlayPause();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [audioElement, currentScene]); // Include audioElement and currentScene in dependencies

  // DEBUG: Log audio data states
  useEffect(() => {
    console.log('=== AUDIO DATA STATE ===');
    console.log('Current scene:', currentScene);
    console.log('Main audioData:', audioData ? 'EXISTS' : 'NULL', audioData);
    console.log('Moire audioData:', moireAudioData ? 'EXISTS' : 'NULL', moireAudioData);
    console.log('Main audioElement:', audioElement ? 'SET' : 'NULL');
    console.log('Moire audioElement:', moireAudioElement ? 'SET' : 'NULL');
    if (currentScene === 21) {
      console.log('>>> SCENE 21 ACTIVE - Should use moireAudioData');
      if (moireAudioData) {
        console.log('>>> Moire bass avg:', moireAudioData.frequencyData.slice(0, 10));
      } else {
        console.log('>>> WARNING: moireAudioData is NULL!');
      }
    }
  }, [currentScene, audioData, moireAudioData, audioElement, moireAudioElement]);

  // Switch to techno music for moire patterns scene (scene 21 - after credits)
  // Stop old audio context and create new one with techno-plasma.mp3
  useEffect(() => {
    console.log('[Scene 21 Effect] Triggered. Current scene:', currentScene);

    if (currentScene !== 21) {
      console.log('[Scene 21 Effect] Not scene 21, skipping');
      return;
    }

    const mainAudio = audioRef.current;
    const moireAudio = moireAudioRef.current;

    console.log('[Scene 21 Effect] Main audio ref:', mainAudio ? 'EXISTS' : 'NULL');
    console.log('[Scene 21 Effect] Moire audio ref:', moireAudio ? 'EXISTS' : 'NULL');

    if (!mainAudio || !moireAudio) {
      console.error('[Scene 21 Effect] Missing audio refs!');
      return;
    }

    console.log('[Scene 21] Stopping main audio, starting techno-plasma.mp3');

    // Stop and clean up main audio
    mainAudio.pause();
    mainAudio.currentTime = 0;
    console.log('[Scene 21] Main audio stopped');

    // Setup moire audio with techno track
    moireAudio.src = '/techno-plasma.mp3';
    moireAudio.volume = 1.0;
    moireAudio.loop = false;
    console.log('[Scene 21] Moire audio configured, loading...');

    const handleCanPlay = () => {
      console.log('[Scene 21 CanPlay] Event fired!');
      console.log('[Scene 21 CanPlay] Audio ready state:', moireAudio.readyState);
      console.log('[Scene 21 CanPlay] Audio src:', moireAudio.src);
      console.log('[Scene 21 CanPlay] Setting moire audio element...');

      setMoireAudioElement(moireAudio); // This triggers useAudioAnalyzer

      console.log('[Scene 21 CanPlay] Starting playback...');
      moireAudio.play()
        .then(() => console.log('[Scene 21] Playback started successfully'))
        .catch((err) => {
          console.error('[Scene 21] Failed to play:', err);
        });
    };

    moireAudio.addEventListener('canplay', handleCanPlay, { once: true });
    moireAudio.load();
    console.log('[Scene 21] Load initiated');

    // Cleanup
    return () => {
      console.log('[Scene 21 Effect] Cleanup');
      moireAudio.removeEventListener('canplay', handleCanPlay);
    };
  }, [currentScene]);

  const handleStartDemo = () => {
    const audio = audioRef.current;
    if (!audio) {
      console.error('Audio element not found');
      return;
    }

    console.log('Starting demo from title screen');

    // Set audio element for analyzer if not already set
    if (!audioElement) {
      console.log('Setting audio element for analyzer');
      setAudioElement(audio);
    }

    // Ensure volume is set
    audio.volume = 1.0;
    audio.muted = false;

    // Start playing audio
    audio.play().catch((err) => {
      console.error('Audio playback failed:', err);
    });
  };

  return (
    <div className="app">
      <audio ref={audioRef} />
      <audio ref={moireAudioRef} />
      <div className="scanlines"></div>
      <div className="crt-overlay"></div>

      {/* Show header only when not on title screen */}
      {currentScene > 0 && (
        <header className="app-header">
          <h1 className="demo-title">PHRENETiC.NET</h1>
          <p className="demo-subtitle">16-BIT MEMORIES • 2025</p>
        </header>
      )}

      <SceneManager
        scenes={scenes}
        audioData={currentScene === 21 ? moireAudioData : audioData}
        isPlaying={isPlaying}
        onStartDemo={handleStartDemo}
        onSceneChange={setCurrentScene}
      />
    </div>
  );
}

export default App;
