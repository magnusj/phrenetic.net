import { useCallback, useRef } from 'react';

interface UseTapDetectionOptions {
  onTap?: () => void;
  maxTapDuration?: number; // Max time for a tap (ms)
  maxTapMovement?: number; // Max movement allowed for a tap (px)
}

interface TapDetectionHandlers {
  onMouseDown: (e: React.MouseEvent) => void;
  onMouseUp: (e: React.MouseEvent) => void;
  onTouchStart: (e: React.TouchEvent) => void;
  onTouchEnd: (e: React.TouchEvent) => void;
}

/**
 * Hook to detect single tap/click gestures
 * Excludes taps on interactive elements (buttons, links, inputs)
 */
export const useTapDetection = ({
  onTap,
  maxTapDuration = 300,
  maxTapMovement = 10,
}: UseTapDetectionOptions): TapDetectionHandlers => {
  const tapStartTime = useRef<number>(0);
  const tapStartX = useRef<number>(0);
  const tapStartY = useRef<number>(0);

  const isInteractiveElement = (element: HTMLElement): boolean => {
    const interactiveTags = ['BUTTON', 'A', 'INPUT', 'TEXTAREA', 'SELECT'];
    return interactiveTags.includes(element.tagName) ||
           element.closest('button, a, input, textarea, select') !== null;
  };

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (isInteractiveElement(e.target as HTMLElement)) return;

    tapStartTime.current = Date.now();
    tapStartX.current = e.clientX;
    tapStartY.current = e.clientY;
  }, []);

  const handleMouseUp = useCallback((e: React.MouseEvent) => {
    if (isInteractiveElement(e.target as HTMLElement)) return;

    const tapDuration = Date.now() - tapStartTime.current;
    const deltaX = Math.abs(e.clientX - tapStartX.current);
    const deltaY = Math.abs(e.clientY - tapStartY.current);

    if (
      tapDuration <= maxTapDuration &&
      deltaX <= maxTapMovement &&
      deltaY <= maxTapMovement
    ) {
      onTap?.();
    }

    tapStartTime.current = 0;
  }, [maxTapDuration, maxTapMovement, onTap]);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (isInteractiveElement(e.target as HTMLElement)) return;

    tapStartTime.current = Date.now();
    tapStartX.current = e.touches[0].clientX;
    tapStartY.current = e.touches[0].clientY;
  }, []);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (isInteractiveElement(e.target as HTMLElement)) return;

    const tapDuration = Date.now() - tapStartTime.current;
    const touchEndX = e.changedTouches[0].clientX;
    const touchEndY = e.changedTouches[0].clientY;
    const deltaX = Math.abs(touchEndX - tapStartX.current);
    const deltaY = Math.abs(touchEndY - tapStartY.current);

    if (
      tapDuration <= maxTapDuration &&
      deltaX <= maxTapMovement &&
      deltaY <= maxTapMovement
    ) {
      onTap?.();
    }

    tapStartTime.current = 0;
  }, [maxTapDuration, maxTapMovement, onTap]);

  return {
    onMouseDown: handleMouseDown,
    onMouseUp: handleMouseUp,
    onTouchStart: handleTouchStart,
    onTouchEnd: handleTouchEnd,
  };
};
