import { useContext } from 'react';
import { SceneInfoContext } from '../contexts/sceneInfo';

export const useSceneInfo = () => {
  const context = useContext(SceneInfoContext);
  if (!context) {
    throw new Error('useSceneInfo must be used within SceneInfoProvider');
  }
  return context;
};
