import { useRef, useCallback } from 'react';

interface TouchGestureHandlers {
  onTouchStart: (e: React.TouchEvent) => void;
  onTouchMove: (e: React.TouchEvent) => void;
  onTouchEnd: (e: React.TouchEvent) => void;
}

interface UseTouchGesturesOptions {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  minSwipeDistance?: number;
}

/**
 * Hook to detect swipe gestures (left/right) on touch devices
 */
export const useTouchGestures = ({
  onSwipeLeft,
  onSwipeRight,
  minSwipeDistance = 50,
}: UseTouchGesturesOptions): TouchGestureHandlers => {
  const touchStartX = useRef<number>(0);
  const touchStartY = useRef<number>(0);
  const isSwiping = useRef<boolean>(false);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
    isSwiping.current = false;
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!touchStartX.current) return;

    const touchCurrentX = e.touches[0].clientX;
    const touchCurrentY = e.touches[0].clientY;

    const deltaX = touchCurrentX - touchStartX.current;
    const deltaY = touchCurrentY - touchStartY.current;

    // Check if horizontal swipe (more horizontal than vertical movement)
    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 10) {
      isSwiping.current = true;
      // Prevent vertical scrolling during horizontal swipe
      e.preventDefault();
    }
  }, []);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (!touchStartX.current || !isSwiping.current) {
      touchStartX.current = 0;
      return;
    }

    const touchEndX = e.changedTouches[0].clientX;
    const deltaX = touchEndX - touchStartX.current;

    // Check if swipe distance meets minimum threshold
    if (Math.abs(deltaX) >= minSwipeDistance) {
      if (deltaX > 0) {
        // Swipe right
        onSwipeRight?.();
      } else {
        // Swipe left
        onSwipeLeft?.();
      }
    }

    // Reset
    touchStartX.current = 0;
    touchStartY.current = 0;
    isSwiping.current = false;
  }, [minSwipeDistance, onSwipeLeft, onSwipeRight]);

  return {
    onTouchStart: handleTouchStart,
    onTouchMove: handleTouchMove,
    onTouchEnd: handleTouchEnd,
  };
};
