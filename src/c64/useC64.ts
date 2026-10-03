import { useEffect, type RefObject } from 'react';
import { Vic, FRAME_RATE, SCREEN_WIDTH, SCREEN_HEIGHT, type C64Program } from './vic';

const FRAME_MS = 1000 / FRAME_RATE;
const MAX_CATCH_UP_FRAMES = 3;

/**
 * Run a C64 program on a canvas at the PAL frame rate (~50 Hz), independent of display refresh rate.
 * The program must be referentially stable (create it with useMemo or at module level).
 */
export const useC64 = (canvasRef: RefObject<HTMLCanvasElement | null>, program: C64Program) => {
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    canvas.width = SCREEN_WIDTH;
    canvas.height = SCREEN_HEIGHT;

    const vic = new Vic();
    program.init?.(vic);
    const image = new ImageData(vic.rgba, SCREEN_WIDTH, SCREEN_HEIGHT);

    let frame = 0;
    let accumulated = FRAME_MS; // render the first frame immediately
    let last = performance.now();
    let rafId = 0;

    const tick = (now: number) => {
      accumulated += now - last;
      last = now;

      let ran = 0;
      while (accumulated >= FRAME_MS && ran < MAX_CATCH_UP_FRAMES) {
        vic.runFrame(program, frame++);
        accumulated -= FRAME_MS;
        ran++;
      }
      // After a long stall (e.g. a background tab), drop the backlog instead of fast-forwarding
      if (accumulated >= FRAME_MS) accumulated = 0;
      if (ran > 0) ctx.putImageData(image, 0, 0);

      rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);

    return () => cancelAnimationFrame(rafId);
  }, [canvasRef, program]);
};
