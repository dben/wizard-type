/**
 * Save data: several kid profiles on one device, stored in localStorage.
 * Profiles can be copied to another device with a save code (export/import).
 */
import { STARTER_ITEMS, item } from '../content/items';
import { ROOM_H, ROOM_MOVE, ROOM_VERSION, ROOM_W } from '../content/world/room';

export type HairStyle = 'short' | 'long' | 'pigtails' | 'curly' | 'bun' | 'spiky' | 'braid';

export interface WizardLook {
  hair: HairStyle;
  hairColor: string;
  skin: string;
}

export interface LessonRecord {
  stars: number;
  bestAccuracy: number;
  bestWpm: number;
  plays: number;
}

export interface Placement {
  uid: string;
  item: string;
  x: number;
  y: number;
  flip?: boolean;
}

export interface Equipped {
  hat: string | null;
  robe: string;
  wand: string;
  pet: string | null;
}

export interface Profile {
  id: string;
  name: string;
  look: WizardLook;
  createdAt: number;
  gold: number;
  lessons: Record<string, LessonRecord>;
  owned: string[];
  equipped: Equipped;
  room: Placement[];
  /** Which room layout the placements were made in (content/world/room.ts). */
  roomVersion: number;
  /** Style of the big tower window (shows once the window is fixed). */
  window: string;
  settings: { hands: boolean; sound: boolean };
}

export interface SaveData {
  version: 1;
  profiles: Profile[];
  current?: string;
}

const KEY = 'wizard-type/save';
const CODE_PREFIX = 'WIZ1-';

export const emptySave = (): SaveData => ({ version: 1, profiles: [] });

export function newProfile(name: string, look: WizardLook, id: string = crypto.randomUUID()): Profile {
  return {
    id,
    name: name.trim().slice(0, 16) || 'Wizard',
    look,
    createdAt: Date.now(),
    gold: 0,
    lessons: {},
    owned: [...STARTER_ITEMS],
    equipped: { hat: 'hat-plain-navy', robe: 'robe-sky', wand: 'wand-twig', pet: null },
    room: [],
    roomVersion: ROOM_VERSION,
    window: 'wall-window',
    settings: { hands: true, sound: true },
  };
}

/** The room got wider: slide things from the old, smaller room to the same spot on the new floor. */
const moveToNewRoom = (r: Placement): Placement => ({
  ...r,
  x: Math.max(0, Math.min(ROOM_W, r.x + ROOM_MOVE.dx)),
  y: Math.max(0, Math.min(ROOM_H, r.y + ROOM_MOVE.dy)),
});

/** Fill in fields that older saves may be missing. */
function normalize(p: Profile): Profile {
  const base = newProfile(p.name, p.look, p.id);
  const moved = (p.roomVersion ?? 1) < ROOM_VERSION;
  return {
    ...base,
    ...p,
    equipped: { ...base.equipped, ...p.equipped },
    settings: { ...base.settings, ...p.settings },
    owned: [...new Set([...STARTER_ITEMS, ...(p.owned ?? [])])],
    // The window used to be a placeable wall item; it's part of the wall now.
    room: (p.room ?? []).filter((r) => item(r.item) && item(r.item)!.category !== 'window').map((r) => (moved ? moveToNewRoom(r) : r)),
    roomVersion: ROOM_VERSION,
  };
}

export function loadSave(storage: Pick<Storage, 'getItem'> | undefined = globalThis.localStorage): SaveData {
  try {
    const raw = storage?.getItem(KEY);
    if (!raw) return emptySave();
    const data = JSON.parse(raw) as SaveData;
    if (data.version !== 1 || !Array.isArray(data.profiles)) return emptySave();
    return { ...data, profiles: data.profiles.map(normalize) };
  } catch {
    return emptySave();
  }
}

export function writeSave(data: SaveData, storage: Pick<Storage, 'setItem'> | undefined = globalThis.localStorage) {
  try {
    storage?.setItem(KEY, JSON.stringify(data));
  } catch {
    // Private mode or full storage: the game still works, it just won't remember.
  }
}

export function exportCode(p: Profile): string {
  const json = JSON.stringify(p);
  const b64 = btoa(String.fromCharCode(...new TextEncoder().encode(json)));
  return CODE_PREFIX + b64;
}

export function importCode(code: string): Profile | null {
  try {
    const trimmed = code.trim();
    if (!trimmed.startsWith(CODE_PREFIX)) return null;
    const bytes = Uint8Array.from(atob(trimmed.slice(CODE_PREFIX.length)), (c) => c.charCodeAt(0));
    const p = JSON.parse(new TextDecoder().decode(bytes)) as Profile;
    if (typeof p.name !== 'string' || !p.look || typeof p.gold !== 'number') return null;
    return normalize(p);
  } catch {
    return null;
  }
}
