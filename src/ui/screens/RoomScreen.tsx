/**
 * The wizard's room. Tap something in the tray to place it, drag to move,
 * and use the little toolbar to flip it or put it away.
 *
 * The room is wider than the screen. The wizard walks left and right (A / D,
 * the arrow keys, or the buttons in the corners) and the view follows.
 * Dragging something to the edge of the view walks that way too.
 */
import { useEffect, useRef, useState } from 'preact/hooks';
import { sfx } from '../../audio/sfx';
import { currentProfile, go, update } from '../../app/store';
import { lessonInfo } from '../../content/curriculum';
import { item } from '../../content/items';
import type { ItemCategory, ItemDef } from '../../content/types';
import { FLOOR_TOP, PET_SPOT, ROOM_H, ROOM_W, WALK_MARGIN, WINDOW_SPOT, WIZARD_SPOT, type StoryClutter } from '../../content/world/room';
import { chooseWindow, isDone, roomClutter, windowSprite } from '../../game/progress';
import type { Placement } from '../../game/save';
import { layer } from '../../render/scene';
import { loadSprite, sprite, spriteUrl } from '../../render/sprites';
import { walkUrls } from '../../render/portrait';
import { WALK_FPS, WIZ, WIZ_CANVAS } from '../../render/wizard';
import { Sprite } from '../components/Sprite';
import { RoomPet } from '../components/RoomPet';
import { useIdleFrame } from '../components/useAnim';
import { IDLE, petMotion } from '../../content/world/animations';
import { Button } from '../components/bits';

const TABS: { cat: ItemCategory; label: string }[] = [
  { cat: 'furniture', label: 'Furniture' },
  { cat: 'decor', label: 'Little things' },
  { cat: 'wall', label: 'Wall' },
  { cat: 'rug', label: 'Rugs' },
  { cat: 'window', label: 'Window' },
];

/** A curved "turn around" arrow for the flip button. */
const FlipIcon = () => (
  <svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true">
    <path d="M17 7.5A7 7 0 1 0 19 13" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" />
    <path d="M13.5 6.5 19 3.5l.6 6.2z" fill="currentColor" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round" />
  </svg>
);

const DEFAULT_Y: Record<string, number> = { rug: 232, furniture: 222, wall: 110, decor: 180 };
/** Room pixels per second. */
const WALK_SPEED = 130;
/** Dragging this close (screen pixels) to the edge of the view walks that way. */
const EDGE = 36;
const WALK_KEYS: Record<string, number> = { a: -1, arrowleft: -1, d: 1, arrowright: 1 };

function clamp(it: ItemDef, x: number, y: number): [number, number] {
  const img = it.sprite ? sprite(it.sprite) : undefined;
  const w = img?.width ?? 32;
  const h = img?.height ?? 32;
  const [ymin, ymax] =
    it.category === 'rug' ? [FLOOR_TOP + 12, ROOM_H] :
    it.category === 'furniture' ? [FLOOR_TOP + 4, ROOM_H] :
    it.category === 'wall' ? [h + 4, FLOOR_TOP - 4] : [h + 4, ROOM_H];
  return [Math.round(Math.max(w / 2, Math.min(ROOM_W - w / 2, x))), Math.round(Math.max(ymin, Math.min(ymax, y)))];
}

export function RoomScreen() {
  const p = currentProfile()!;
  const [tab, setTab] = useState<ItemCategory>('furniture');
  const [selected, setSelected] = useState<string | null>(null);
  /** Where the pointer is while dragging; the item's spot is worked out from it, so it keeps up when the view scrolls. */
  const [drag, setDrag] = useState<{ uid: string; px: number; py: number } | null>(null);
  const [scale, setScale] = useState(2);
  /** Width of the visible part of the room, in room pixels. */
  const [view, setView] = useState(480);
  const [walk, setWalk] = useState({ x: WIZARD_SPOT.x, dir: 1, t: 0, moving: false });
  const [ready, setReady] = useState(false);
  const [hint, setHint] = useState<{ x: number; y: number; text: string } | null>(null);
  const [wiz, setWiz] = useState<{ stand: string; walk: string[] }>();
  const box = useRef<HTMLDivElement>(null);
  const viewport = useRef<HTMLDivElement>(null);
  const dragStart = useRef<{ px: number; py: number; x: number; y: number; cam: number } | null>(null);
  const keys = useRef(new Set<string>());
  /** Walk direction from the on-screen buttons, and from dragging to an edge. */
  const held = useRef(0);
  const edge = useRef(0);
  const wizX = useRef(WIZARD_SPOT.x);

  const owned = p.owned.map(item).filter((i): i is ItemDef => !!i && ['furniture', 'decor', 'wall', 'rug', 'window'].includes(i.category));
  const clutter = roomClutter(p);
  const win = windowSprite(p);

  useEffect(() => {
    const paths = [...owned.map((i) => i.sprite!), ...clutter.map((c) => c.sprite), 'backgrounds/tower', ...(win ? [win] : [])];
    if (p.equipped.pet) {
      const pet = item(p.equipped.pet)!.sprite!;
      paths.push(pet, ...(petMotion(pet)?.move ?? []));
    }
    paths.push(...clutter.flatMap((c) => IDLE[c.sprite]?.frames ?? []));
    void Promise.all(paths.map((s) => loadSprite(s).catch(() => undefined))).then(() => setReady(true));
    void walkUrls(p.look, p.equipped).then(setWiz);
  }, []);

  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const fit = () => {
      const s = Math.max(1, Math.min((window.innerHeight - 330) / ROOM_H, 3));
      setScale(s);
      setView(Math.min(ROOM_W, (el.clientWidth - 10) / s));
    };
    const ro = new ResizeObserver(fit);
    ro.observe(el);
    window.addEventListener('resize', fit);
    return () => (ro.disconnect(), window.removeEventListener('resize', fit));
  }, []);

  // Walking: keys and buttons set a direction, one loop moves the wizard.
  useEffect(() => {
    const typing = (e: KeyboardEvent) => e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement;
    const down = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if (!(k in WALK_KEYS) || typing(e) || e.ctrlKey || e.metaKey || e.altKey) return;
      e.preventDefault();
      keys.current.add(k);
    };
    const up = (e: KeyboardEvent) => keys.current.delete(e.key.toLowerCase());
    const clear = () => (keys.current.clear(), (held.current = 0));
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    window.addEventListener('blur', clear);

    let raf = 0;
    let last = 0;
    let moving = false;
    const tick = (now: number) => {
      const dt = last ? Math.min(0.05, (now - last) / 1000) : 0;
      last = now;
      let dir = 0;
      for (const k of keys.current) dir += WALK_KEYS[k];
      dir = Math.sign(dir) || held.current || edge.current;
      if (dir) {
        moving = true;
        setWalk((w) => {
          const x = Math.max(WALK_MARGIN, Math.min(ROOM_W - WALK_MARGIN, w.x + dir * WALK_SPEED * dt));
          wizX.current = x;
          return { x, dir, t: w.t + dt, moving: true };
        });
      } else if (moving) {
        moving = false;
        setWalk((w) => ({ ...w, moving: false }));
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
      window.removeEventListener('blur', clear);
    };
  }, []);

  /** Left edge of the view: follows the wizard, stops at the walls. */
  const cam = Math.max(0, Math.min(ROOM_W - view, walk.x - view / 2));

  const save = (room: Placement[]) => update((x) => ({ ...x, room }));

  const place = (it: ItemDef) => {
    if (it.category === 'window') {
      sfx.click();
      return update((x) => chooseWindow(x, it.id));
    }
    const existing = p.room.find((r) => r.item === it.id);
    if (existing) return setSelected(existing.uid);
    const [x, y] = clamp(it, cam + view / 2, DEFAULT_Y[it.category] ?? 220);
    const uid = `${it.id}-${Date.now()}`;
    sfx.click();
    save([...p.room, { uid, item: it.id, x, y }]);
    setSelected(uid);
  };

  const onPointerDown = (e: PointerEvent, pl: Placement) => {
    e.preventDefault();
    e.stopPropagation();
    setSelected(pl.uid);
    setHint(null);
    dragStart.current = { px: e.clientX, py: e.clientY, x: pl.x, y: pl.y, cam };
    setDrag({ uid: pl.uid, px: e.clientX, py: e.clientY });
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };
  const onPointerMove = (e: PointerEvent, pl: Placement) => {
    if (!dragStart.current || drag?.uid !== pl.uid) return;
    setDrag({ uid: pl.uid, px: e.clientX, py: e.clientY });
    const r = viewport.current!.getBoundingClientRect();
    edge.current = e.clientX < r.left + EDGE ? -1 : e.clientX > r.right - EDGE ? 1 : 0;
  };
  /** Where a placement is right now: under the pointer while it's being dragged. */
  const pos = (pl: Placement): { x: number; y: number } => {
    const st = dragStart.current;
    if (!st || drag?.uid !== pl.uid) return pl;
    const [x, y] = clamp(item(pl.item)!, st.x + (drag.px - st.px) / scale + (cam - st.cam), st.y + (drag.py - st.py) / scale);
    return { x, y };
  };
  const onPointerUp = () => {
    if (drag) {
      const moved = p.room.find((r) => r.uid === drag.uid);
      if (moved) save(p.room.map((r) => (r === moved ? { ...r, ...pos(moved) } : r)));
    }
    dragStart.current = null;
    edge.current = 0;
    setDrag(null);
  };
  const hold = (dir: number) => ({
    onPointerDown: (e: PointerEvent) => (e.stopPropagation(), e.preventDefault(), (held.current = dir)),
    onPointerUp: () => (held.current = 0),
    onPointerLeave: () => (held.current = 0),
    onPointerCancel: () => (held.current = 0),
  });

  const sel = p.room.find((r) => r.uid === selected);
  const sorted = [...p.room].sort((a, b) => layer(a) - layer(b) || pos(a).y - pos(b).y);
  const S = scale;

  const at = (path: string, x: number, y: number): Record<string, string> => {
    const img = sprite(path);
    if (!img) return { display: 'none' };
    return { left: `${(x - img.width / 2) * S}px`, top: `${(y - img.height) * S}px`, width: `${img.width * S}px` };
  };

  return (
    <main class="screen room-screen">
      <div class="room-box" ref={box}>
        <div class="room" ref={viewport} style={{ width: `${Math.round(view * S)}px`, height: `${Math.round(ROOM_H * S)}px` }} onPointerDown={() => (setSelected(null), setHint(null))}>
         <div class="room-world" style={{ width: `${ROOM_W * S}px`, transform: `translateX(${-Math.round(cam * S)}px)` }}>
          <img class="px room-bg" src={spriteUrl('backgrounds/tower')} alt="" draggable={false} />
          {ready && win && <img class="px clutter" src={spriteUrl(win)} alt="" draggable={false} style={{ ...at(win, WINDOW_SPOT.x, WINDOW_SPOT.y), zIndex: 900, pointerEvents: 'none' }} />}
          {ready && sorted.map((pl) => {
            const it = item(pl.item);
            if (!it?.sprite) return null;
            const { x, y } = pos(pl);
            return (
              <img
                key={pl.uid}
                class={`px placed ${selected === pl.uid ? 'selected' : ''} ${pl.flip ? 'flip' : ''}`}
                src={spriteUrl(it.sprite)}
                alt={it.name}
                draggable={false}
                style={{ ...at(it.sprite, x, y), zIndex: layer(pl) * 1000 + y }}
                onPointerDown={(e) => onPointerDown(e, pl)}
                onPointerMove={(e) => onPointerMove(e, pl)}
                onPointerUp={onPointerUp}
              />
            );
          })}
          {ready && clutter.map((c) => <ClutterImg key={c.sprite + c.x} c={c} S={S} at={at} onHint={setHint} />)}
          {ready && p.equipped.pet && (
            <RoomPet key={p.equipped.pet} path={item(p.equipped.pet)!.sprite!} startX={PET_SPOT.x} floorY={PET_SPOT.y} scale={S} follow={wizX} />
          )}
          {wiz && (
            <img
              class="px actor"
              src={walk.moving ? wiz.walk[Math.floor(walk.t * WALK_FPS) % wiz.walk.length] : wiz.stand}
              alt=""
              // The art faces right; mirror it around the head when walking left. Always in front of the furniture.
              style={{
                transform: walk.dir < 0 ? 'scaleX(-1)' : undefined,
                left: `${(walk.x - (walk.dir < 0 ? WIZ_CANVAS.w + 16 - WIZ.headX : WIZ.headX)) * S}px`,
                top: `${(WIZARD_SPOT.y - WIZ.feetY - WIZ.padTop) * S}px`,
                width: `${(WIZ_CANVAS.w + 16) * S}px`,
                zIndex: 9000,
              }}
            />
          )}
          {sel && !drag && (
            <div class="item-tools" style={{ left: `${pos(sel).x * S}px`, top: `${(pos(sel).y - (sprite(item(sel.item)!.sprite!)?.height ?? 30)) * S - 8}px` }} onPointerDown={(e) => e.stopPropagation()}>
              <button onClick={() => save(p.room.map((r) => (r.uid === sel.uid ? { ...r, flip: !r.flip } : r)))} title="Turn around">
                <FlipIcon />
              </button>
              <button onClick={() => (save(p.room.filter((r) => r.uid !== sel.uid)), setSelected(null))} title="Put away">✕</button>
            </div>
          )}
          {hint && (
            <div class="room-hint" style={{ left: `${hint.x}px`, top: `${hint.y}px` }}>
              {hint.text}
            </div>
          )}
         </div>
          {view < ROOM_W && (
            <>
              <button class="walk-btn left" title="Walk left" disabled={walk.x <= WALK_MARGIN} {...hold(-1)}>◀ A</button>
              <button class="walk-btn right" title="Walk right" disabled={walk.x >= ROOM_W - WALK_MARGIN} {...hold(1)}>D ▶</button>
            </>
          )}
        </div>
      </div>

      <div class="tray panel">
        <div class="tabs">
          {TABS.map((t) => (
            <button key={t.cat} class={`tab ${tab === t.cat ? 'on' : ''}`} onClick={() => setTab(t.cat)}>
              {t.label}
            </button>
          ))}
          <Button onClick={() => go({ name: 'shop' })} icon="bag" class="tray-shop">
            Shop
          </Button>
        </div>
        <div class="tray-items">
          {tab === 'window' && !isDone(p, 'fix-window') && <p class="small muted">Fix the window first! (Lesson {(lessonInfo('fix-window')?.index ?? 0) + 1})</p>}
          {tab !== 'window' && owned.filter((i) => i.category === tab).length === 0 && (
            <p class="small muted">Nothing yet. Finish lessons and visit the shop!</p>
          )}
          {owned
            .filter((i) => i.category === tab)
            .map((it) => {
              const placed = it.category === 'window' ? p.window === it.id : p.room.some((r) => r.item === it.id);
              return (
                <button key={it.id} class={`tray-item ${placed ? 'placed' : ''}`} onClick={() => place(it)} title={it.name}>
                  <Sprite path={it.sprite!} fit={56} />
                  {placed && <span class="tick">✓</span>}
                </button>
              );
            })}
        </div>
        <p class="small muted tray-help">Tap to place. Drag to move. Walk with A and D.</p>
      </div>
    </main>
  );
}

function ClutterImg({ c, S, at, onHint }: { c: StoryClutter; S: number; at: (path: string, x: number, y: number) => Record<string, string>; onHint: (h: { x: number; y: number; text: string }) => void }) {
  const info = lessonInfo(c.until);
  const frame = useIdleFrame(c.sprite, c.x);
  return (
    <img
      class="px clutter"
      src={spriteUrl(frame)}
      alt=""
      draggable={false}
      style={{ ...at(frame, c.x, c.y), zIndex: 2000 + c.y }}
      onPointerDown={(e) => {
        e.stopPropagation();
        sfx.oops();
        onHint({ x: c.x * S, y: (c.y - 10) * S, text: `Lesson ${(info?.index ?? 0) + 1} fixes this!` });
      }}
    />
  );
}
