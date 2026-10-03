import { useState, useMemo, useCallback, type ReactNode } from 'react';
import { useIsMobile } from '../hooks/useIsMobile';
import { SceneInfoContext } from './sceneInfo';

export const SceneInfoProvider = ({ children }: { children: ReactNode }) => {
  const isMobile = useIsMobile();
  const [isSceneInfoVisible, setIsSceneInfoVisible] = useState(!isMobile);

  // Reset visibility when mobile state changes (e.g., window resize). Adjusting state during
  // render, rather than in an effect, avoids an extra render with the stale value.
  const [visibilityFor, setVisibilityFor] = useState(isMobile);
  if (visibilityFor !== isMobile) {
    setVisibilityFor(isMobile);
    setIsSceneInfoVisible(!isMobile);
  }

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
