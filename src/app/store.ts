/**
 * App-wide state: the save file and which screen is showing.
 * Screens read with useGame() and change things with the actions below.
 */
import { useEffect, useState } from 'preact/hooks';
import { setSound } from '../audio/sfx';
import { loadSave, writeSave, type Profile, type SaveData } from '../game/save';

export type Screen =
  | { name: 'profiles' }
  | { name: 'create'; editing?: string }
  | { name: 'map' }
  | { name: 'lesson'; lessonId: string }
  | { name: 'room' }
  | { name: 'wardrobe' }
  | { name: 'shop' };

interface State {
  save: SaveData;
  screen: Screen;
}

let state: State = (() => {
  const save = loadSave();
  const current = save.profiles.find((p) => p.id === save.current);
  if (current) setSound(current.settings.sound);
  return { save, screen: current ? { name: 'map' } : { name: 'profiles' } };
})();

const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

function set(next: Partial<State>) {
  state = { ...state, ...next };
  if (next.save) writeSave(state.save);
  emit();
}

export function useGame() {
  const [, force] = useState(0);
  useEffect(() => {
    const l = () => force((n) => n + 1);
    listeners.add(l);
    return () => void listeners.delete(l);
  }, []);
  return state;
}

export const getState = () => state;

export const currentProfile = (): Profile | undefined => state.save.profiles.find((p) => p.id === state.save.current);

export function go(screen: Screen) {
  set({ screen });
  window.scrollTo(0, 0);
}

export function selectProfile(id: string) {
  const p = state.save.profiles.find((x) => x.id === id);
  if (p) setSound(p.settings.sound);
  set({ save: { ...state.save, current: id }, screen: { name: 'map' } });
}

export function saveProfile(p: Profile) {
  const exists = state.save.profiles.some((x) => x.id === p.id);
  const profiles = exists ? state.save.profiles.map((x) => (x.id === p.id ? p : x)) : [...state.save.profiles, p];
  setSound(p.settings.sound);
  set({ save: { ...state.save, profiles } });
}

/** Change the current profile with a pure function from game/progress.ts. */
export function update(fn: (p: Profile) => Profile) {
  const p = currentProfile();
  if (p) saveProfile(fn(p));
}

export function deleteProfile(id: string) {
  const profiles = state.save.profiles.filter((p) => p.id !== id);
  set({ save: { ...state.save, profiles, current: state.save.current === id ? undefined : state.save.current }, screen: { name: 'profiles' } });
}
