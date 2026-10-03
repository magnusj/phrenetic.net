import { useCallback, useRef } from 'react';

interface UseTapDetectionOptions {
  onTap?: () => void;
  maxTapDuration?: number; // Max time for a tap (ms)
  maxTapMovement?: number; // Max movement allowed for a tap (px)
}

interface TapDetectionHandlers {
  onPointerDown: (e: React.PointerEvent) => void;
  onPointerUp: (e: React.PointerEvent) => void;
}

/**
 * Hook to detect single tap/click gestures via pointer events (mouse, touch, pen)
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

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    if (!e.isPrimary || isInteractiveElement(e.target as HTMLElement)) return;

    tapStartTime.current = Date.now();
    tapStartX.current = e.clientX;
    tapStartY.current = e.clientY;
  }, []);

  const handlePointerUp = useCallback((e: React.PointerEvent) => {
    if (!e.isPrimary || isInteractiveElement(e.target as HTMLElement)) return;

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

  return {
    onPointerDown: handlePointerDown,
    onPointerUp: handlePointerUp,
  };
};
