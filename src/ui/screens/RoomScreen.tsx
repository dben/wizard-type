/**
 * The wizard's room. Tap something in the tray to place it, drag to move,
 * and use the little toolbar to flip it or put it away.
 */
import { useEffect, useRef, useState } from 'preact/hooks';
import { sfx } from '../../audio/sfx';
import { currentProfile, go, update } from '../../app/store';
import { lessonInfo } from '../../content/curriculum';
import { item } from '../../content/items';
import type { ItemCategory, ItemDef } from '../../content/types';
import { FLOOR_TOP, PET_SPOT, ROOM_H, ROOM_W, WINDOW_SPOT, WIZARD_SPOT, type StoryClutter } from '../../content/world/room';
import { chooseWindow, isDone, roomClutter, windowSprite } from '../../game/progress';
import type { Placement } from '../../game/save';
import { layer } from '../../render/scene';
import { loadSprite, sprite, spriteUrl } from '../../render/sprites';
import { portraitUrl } from '../../render/portrait';
import { WIZ, WIZ_CANVAS } from '../../render/wizard';
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

const DEFAULT_Y: Record<string, number> = { rug: 252, furniture: 246, wall: 130, decor: 200 };

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
  const [drag, setDrag] = useState<{ uid: string; x: number; y: number } | null>(null);
  const [scale, setScale] = useState(2);
  const [ready, setReady] = useState(false);
  const [hint, setHint] = useState<{ x: number; y: number; text: string } | null>(null);
  const [wizUrl, setWizUrl] = useState<string>();
  const box = useRef<HTMLDivElement>(null);
  const dragStart = useRef<{ px: number; py: number; x: number; y: number } | null>(null);

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
    void portraitUrl(p.look, p.equipped).then(setWizUrl);
  }, []);

  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const ro = new ResizeObserver(() => {
      const w = el.clientWidth;
      const h = window.innerHeight - 330;
      setScale(Math.max(1, Math.min(w / ROOM_W, Math.max(1, h / ROOM_H), 3)));
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const save = (room: Placement[]) => update((x) => ({ ...x, room }));

  const place = (it: ItemDef) => {
    if (it.category === 'window') {
      sfx.click();
      return update((x) => chooseWindow(x, it.id));
    }
    const existing = p.room.find((r) => r.item === it.id);
    if (existing) return setSelected(existing.uid);
    const [x, y] = clamp(it, ROOM_W / 2, DEFAULT_Y[it.category] ?? 220);
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
    dragStart.current = { px: e.clientX, py: e.clientY, x: pl.x, y: pl.y };
    setDrag({ uid: pl.uid, x: pl.x, y: pl.y });
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };
  const onPointerMove = (e: PointerEvent, pl: Placement) => {
    const st = dragStart.current;
    if (!st || drag?.uid !== pl.uid) return;
    const [x, y] = clamp(item(pl.item)!, st.x + (e.clientX - st.px) / scale, st.y + (e.clientY - st.py) / scale);
    setDrag({ uid: pl.uid, x, y });
  };
  const onPointerUp = () => {
    if (drag) save(p.room.map((r) => (r.uid === drag.uid ? { ...r, x: drag.x, y: drag.y } : r)));
    dragStart.current = null;
    setDrag(null);
  };

  const sel = p.room.find((r) => r.uid === selected);
  const pos = (pl: Placement) => (drag?.uid === pl.uid ? drag : pl);
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
        <div class="room" style={{ width: `${ROOM_W * S}px`, height: `${ROOM_H * S}px` }} onPointerDown={() => (setSelected(null), setHint(null))}>
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
            <RoomPet key={p.equipped.pet} path={item(p.equipped.pet)!.sprite!} startX={PET_SPOT.x} floorY={PET_SPOT.y} scale={S} />
          )}
          {wizUrl && (
            <img
              class="px actor"
              src={wizUrl}
              alt=""
              style={{ left: `${(WIZARD_SPOT.x - WIZ.headX) * S}px`, top: `${(WIZARD_SPOT.y - WIZ.feetY - WIZ.padTop) * S}px`, width: `${(WIZ_CANVAS.w + 16) * S}px`, zIndex: 2000 + WIZARD_SPOT.y }}
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
        <p class="small muted tray-help">Tap to place. Drag to move.</p>
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
