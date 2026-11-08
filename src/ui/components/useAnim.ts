import { useEffect, useState } from 'preact/hooks';
import { idleFrame } from '../../content/world/animations';

/** The current idle-animation frame for a sprite (or the sprite itself if it has none). */
export function useIdleFrame(sprite: string, phase = 0): string {
  const [t, setT] = useState(0);
  useEffect(() => {
    const start = performance.now();
    const id = setInterval(() => setT((performance.now() - start) / 1000), 80);
    return () => clearInterval(id);
  }, []);
  return idleFrame(sprite, t, phase);
}
