import { createContext, useContext, useState, useEffect, useMemo, useCallback, type ReactNode } from 'react';
import { useIsMobile } from '../hooks/useIsMobile';

interface SceneInfoContextType {
  isSceneInfoVisible: boolean;
  toggleSceneInfoVisibility: () => void;
}

const SceneInfoContext = createContext<SceneInfoContextType | undefined>(undefined);

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

export const useSceneInfo = () => {
  const context = useContext(SceneInfoContext);
  if (!context) {
    throw new Error('useSceneInfo must be used within SceneInfoProvider');
  }
  return context;
};
