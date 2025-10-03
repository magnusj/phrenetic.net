import { useEffect, useRef, useState } from 'react';
import type { AudioData } from '../types/audio';

export const useAudioAnalyzer = (audioElement: HTMLAudioElement | null) => {
  const [audioData, setAudioData] = useState<AudioData | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const animationFrameRef = useRef<number>(0);
  const hasConnectedRef = useRef(false);

  useEffect(() => {
    console.log('[useAudioAnalyzer] Effect triggered, audioElement:', audioElement ? 'EXISTS' : 'NULL');
    console.log('[useAudioAnalyzer] hasConnectedRef:', hasConnectedRef.current);

    if (!audioElement) {
      console.log('[useAudioAnalyzer] No audio element, returning');
      return;
    }

    // Prevent creating MediaElementSource twice on same element
    if (hasConnectedRef.current) {
      console.log('[useAudioAnalyzer] Already connected to this element, skipping');
      return;
    }

    // Create a fresh audio context for THIS audio element
    // Each element gets its own independent context and analyzer
    let analyser: AnalyserNode;

    try {
      console.log('[useAudioAnalyzer] Creating NEW audio context and analyzer for this element');

      // Create audio context and analyzer
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      analyser = audioContext.createAnalyser();
      analyser.fftSize = 2048;
      analyser.smoothingTimeConstant = 0.8;

      // Connect audio element to analyzer (can only be done once per element)
      console.log('[useAudioAnalyzer] Creating MediaElementSource from audio element');
      const source = audioContext.createMediaElementSource(audioElement);
      console.log('[useAudioAnalyzer] Source created, connecting to analyser');
      source.connect(analyser);
      analyser.connect(audioContext.destination);
      console.log('[useAudioAnalyzer] Audio graph connected: source -> analyser -> destination');

      audioContextRef.current = audioContext;
      analyserRef.current = analyser;
      sourceRef.current = source;
      hasConnectedRef.current = true; // Mark as connected

      console.log('[useAudioAnalyzer] Audio context created successfully');
      console.log('[useAudioAnalyzer] Audio context state:', audioContext.state);

      // Resume audio context immediately after creation
      if (audioContext.state === 'suspended') {
        console.log('Audio context is suspended, attempting to resume');
        audioContext.resume().then(() => {
          console.log('Audio context resumed successfully');
        }).catch((err) => {
          console.error('Failed to resume audio context:', err);
        });
      }
    } catch (error) {
      console.error('Failed to create audio context:', error);
      return;
    }

    const bufferLength = analyser.frequencyBinCount;
    const frequencyData = new Uint8Array(bufferLength);
    const timeDomainData = new Uint8Array(bufferLength);

    let analyzeCallCount = 0;
    const analyze = () => {
      if (!analyserRef.current) return;

      analyserRef.current.getByteFrequencyData(frequencyData);
      analyserRef.current.getByteTimeDomainData(timeDomainData);

      // Log first few analyze calls and every 60th call (once per second at 60fps)
      if (analyzeCallCount < 3 || analyzeCallCount % 60 === 0) {
        console.log('[useAudioAnalyzer analyze] Call #', analyzeCallCount);
        console.log('[useAudioAnalyzer analyze] FrequencyData sample:', Array.from(frequencyData.slice(0, 10)));
        const sum = frequencyData.reduce((a, b) => a + b, 0);
        console.log('[useAudioAnalyzer analyze] FrequencyData sum:', sum, 'avg:', sum / frequencyData.length);
      }
      analyzeCallCount++;

      // Calculate frequency ranges
      const bass = getAverageFrequency(frequencyData, 0, 60);
      const mid = getAverageFrequency(frequencyData, 60, 180);
      const treble = getAverageFrequency(frequencyData, 180, 255);
      const volume = getAverageFrequency(frequencyData, 0, 255);

      setAudioData({
        frequencyData: new Uint8Array(frequencyData),
        timeDomainData: new Uint8Array(timeDomainData),
        bass,
        mid,
        treble,
        volume,
      });

      animationFrameRef.current = requestAnimationFrame(analyze);
    };

    console.log('[useAudioAnalyzer] Starting analyze loop');
    analyze();

    return () => {
      console.log('[useAudioAnalyzer] Cleanup: stopping analyze loop and closing context');
      cancelAnimationFrame(animationFrameRef.current);
      if (audioContextRef.current?.state !== 'closed') {
        audioContextRef.current?.close();
      }
      // Reset connection flag so element can be reconnected if component remounts
      hasConnectedRef.current = false;
      console.log('[useAudioAnalyzer] Cleanup: reset hasConnectedRef to false');
    };
  }, [audioElement]);

  return audioData;
};

function getAverageFrequency(data: Uint8Array, start: number, end: number): number {
  let sum = 0;
  let count = 0;
  for (let i = start; i < end && i < data.length; i++) {
    sum += data[i];
    count++;
  }
  return count > 0 ? sum / count / 255 : 0; // Normalize to 0-1
}
