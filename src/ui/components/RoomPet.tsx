/**
 * The pet in the room: sits for a while, then walks, hops or flies somewhere
 * else on the floor. Tap it for a happy hop.
 */
import { useEffect, useRef, useState } from 'preact/hooks';
import { petMotion } from '../../content/world/animations';
import { ROOM_W } from '../../content/world/room';
import { Z_PET } from '../../render/scene';
import { sprite, spriteUrl } from '../../render/sprites';
import { sfx } from '../../audio/sfx';

const SPEED = { walk: 26, hop: 34, fly: 40 };

interface State {
  x: number;
  dir: 1 | -1;
  goal: number | null;
  /** Seconds left sitting before the next trip. */
  rest: number;
  t: number;
  jump: number;
}

export function RoomPet({ path, startX, floorY, scale }: { path: string; startX: number; floorY: number; scale: number }) {
  const motion = petMotion(path);
  const [s, setS] = useState<State>({ x: startX, dir: -1, goal: null, rest: 2, t: 0, jump: 0 });
  const last = useRef(0);

  useEffect(() => {
    let raf = 0;
    const tick = (now: number) => {
      const dt = last.current ? Math.min(0.05, (now - last.current) / 1000) : 0;
      last.current = now;
      setS((p) => {
        const n = { ...p, t: p.t + dt, jump: Math.max(0, p.jump - dt * 2.5) };
        if (n.goal === null) {
          n.rest -= dt;
          if (n.rest <= 0) {
            let goal = 40 + Math.random() * (ROOM_W - 80);
            if (Math.abs(goal - n.x) < 50) goal = n.x > ROOM_W / 2 ? n.x - 120 : n.x + 120;
            n.goal = goal;
            n.dir = goal > n.x ? 1 : -1;
          }
        } else if (motion) {
          const step = SPEED[motion.style] * dt * n.dir;
          n.x += step;
          if ((n.dir > 0 && n.x >= n.goal) || (n.dir < 0 && n.x <= n.goal)) {
            n.x = n.goal;
            n.goal = null;
            n.rest = 3 + Math.random() * 5;
          }
        }
        return n;
      });
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [path]);

  const moving = s.goal !== null && !!motion;
  const frame = moving ? motion!.move[Math.floor(s.t * motion!.fps) % motion!.move.length] : path;
  const img = sprite(frame) ?? sprite(path);
  if (!img) return null;
  let lift = Math.round(Math.sin(s.jump * Math.PI) * 10);
  if (moving && motion!.style === 'fly') lift += 18 + Math.round(Math.sin(s.t * 6) * 3);
  if (moving && motion!.style === 'hop') lift += Math.round(Math.abs(Math.sin(s.t * 6)) * 5);
  const S = scale;
  return (
    <img
      class="px actor pet"
      src={spriteUrl(frame)}
      alt=""
      draggable={false}
      style={{
        left: `${(s.x - img.width / 2) * S}px`,
        top: `${(floorY - img.height - lift) * S}px`,
        width: `${img.width * S}px`,
        zIndex: Z_PET,
        transform: s.dir < 0 ? 'scaleX(-1)' : undefined,
      }}
      onPointerDown={(e) => {
        e.stopPropagation();
        sfx.star(0);
        setS((p) => ({ ...p, jump: 1 }));
      }}
    />
  );
}
