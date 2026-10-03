import { createContext } from 'react';

export interface SceneInfoContextType {
  isSceneInfoVisible: boolean;
  toggleSceneInfoVisibility: () => void;
}

export const SceneInfoContext = createContext<SceneInfoContextType | undefined>(undefined);
