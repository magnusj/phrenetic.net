import { createContext, type RefObject } from 'react';
import type { AudioAnalysisData } from '../types/audio';

/**
 * The Moire scene's audio analysis, kept in a ref so updates don't re-render the scene.
 * Provided by the Amiga demo, read by the Moire Patterns scene.
 */
export const MoireAudioContext = createContext<RefObject<AudioAnalysisData | null>>({ current: null });
