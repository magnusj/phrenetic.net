import { useState, useEffect, useMemo, useCallback, type ReactNode } from 'react';
import { useIsMobile } from '../hooks/useIsMobile';
import { SceneInfoContext } from './sceneInfo';

export const SceneInfoProvider = ({ children }: { children: ReactNode }) => {
  const isMobile = useIsMobile();
  const [isSceneInfoVisible, setIsSceneInfoVisible] = useState(!isMobile);

  // Update visibility when mobile state changes (e.g., window resize)
  useEffect(() => {
    setIsSceneInfoVisible(!isMobile);
  }, [isMobile]);

  const toggleSceneInfoVisibility = useCallback(() => {
    setIsSceneInfoVisible(prev => !prev);
  }, []);

  const value = useMemo(
    () => ({ isSceneInfoVisible, toggleSceneInfoVisibility }),
    [isSceneInfoVisible, toggleSceneInfoVisibility]
  );

  return (
    <SceneInfoContext.Provider value={value}>
      {children}
    </SceneInfoContext.Provider>
  );
};
