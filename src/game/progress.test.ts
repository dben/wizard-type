import { describe, expect, it } from 'vitest';
import { LESSONS } from '../content/curriculum';
import { buy, equip, finishLesson, isOpen, nextLesson, roomClutter, shopState } from './progress';
import { exportCode, importCode, loadSave, newProfile, writeSave, type Profile } from './save';
import { FLOOR_TOP, ROOM_MOVE } from '../content/world/room';
import { item } from '../content/items';

const look = { hair: 'short' as const, hairColor: '#333', skin: '#f5c49c' };
const score = (stars: 1 | 2 | 3) => ({ accuracy: 0.97, wpm: 10, stars, perfectSpells: 5, spells: 10 });

describe('progress', () => {
  it('opens lessons one at a time', () => {
    let p = newProfile('Ada', look);
    expect(isOpen(p, LESSONS[0].lesson.id)).toBe(true);
    expect(isOpen(p, LESSONS[1].lesson.id)).toBe(false);
    p = finishLesson(p, LESSONS[0].lesson.id, score(1)).profile;
    expect(isOpen(p, LESSONS[1].lesson.id)).toBe(true);
    expect(nextLesson(p).index).toBe(1);
  });

  it('pays stars once and gives gifts on the first win only', () => {
    const p0 = newProfile('Ada', look);
    const first = finishLesson(p0, 'wake-wand', score(2));
    expect(first.payout.starGold).toBe(50);
    expect(first.gifts).toEqual(['decor-candles']);
    const again = finishLesson(first.profile, 'wake-wand', score(2));
    expect(again.payout.starGold).toBe(0);
    expect(again.gifts).toEqual([]);
    expect(again.profile.lessons['wake-wand'].plays).toBe(2);
  });

  it('puts fixed furniture back where the broken one was', () => {
    const p = finishLesson(newProfile('Ada', look), 'fix-chair', score(1)).profile;
    expect(p.room.some((r) => r.item === 'furniture-chair')).toBe(true);
    expect(roomClutter(p).some((c) => c.sprite === 'fixtures/chair-broken')).toBe(false);
  });

  it('keeps creatures out of the room', () => {
    const clutter = roomClutter(newProfile('Ada', look));
    expect(clutter.some((c) => c.sprite === 'fixtures/chair-broken')).toBe(true);
    expect(clutter.some((c) => c.sprite.startsWith('creatures/'))).toBe(false);
  });

  it('equips the first pet automatically', () => {
    const p = finishLesson(newProfile('Ada', look), 'spider', score(1)).profile;
    expect(p.equipped.pet).toBe('pet-kitten');
  });

  it('locks shop items behind lessons and gold', () => {
    let p = newProfile('Ada', look);
    const hat = item('hat-starry-blue')!;
    expect(shopState(p, hat)).toBe('locked');
    p = { ...finishLesson(p, 'broom', score(1)).profile, gold: 0 };
    expect(shopState(p, hat)).toBe('poor');
    p = { ...p, gold: 100 };
    expect(shopState(p, hat)).toBe('buy');
    p = buy(p, hat.id);
    expect(p.gold).toBe(100 - hat.price);
    expect(shopState(p, hat)).toBe('owned');
    p = equip(p, hat.id, 'hat');
    expect(p.equipped.hat).toBe(hat.id);
  });

  it('will not equip things you do not own', () => {
    const p = newProfile('Ada', look);
    expect(equip(p, 'hat-crown', 'hat')).toBe(p);
  });
});

describe('save', () => {
  it('round-trips through storage', () => {
    const store = new Map<string, string>();
    const storage = { getItem: (k: string) => store.get(k) ?? null, setItem: (k: string, v: string) => void store.set(k, v) };
    const p = newProfile('Zoë', look);
    writeSave({ version: 1, profiles: [p], current: p.id }, storage);
    expect(loadSave(storage).profiles[0]).toEqual(p);
  });

  it('moves furniture from the old small room onto the new floor', () => {
    const old = { ...newProfile('Zoë', look), room: [{ uid: 'a', item: 'furniture-chair', x: 165, y: 240 }] } as Partial<Profile>;
    delete old.roomVersion;
    const storage = { getItem: () => JSON.stringify({ version: 1, profiles: [old] }) };
    const [p] = loadSave(storage).profiles;
    expect(p.room[0]).toMatchObject({ x: 165 + ROOM_MOVE.dx, y: 240 + ROOM_MOVE.dy });
    expect(p.room[0].y).toBeGreaterThan(FLOOR_TOP);
    // Loading again must not move it twice.
    expect(loadSave({ getItem: () => JSON.stringify({ version: 1, profiles: [p] }) }).profiles[0].room).toEqual(p.room);
  });

  it('survives garbage', () => {
    expect(loadSave({ getItem: () => '{nope' }).profiles).toEqual([]);
  });

  it('exports and imports a save code', () => {
    const p = { ...newProfile('Zoë ✨', look), gold: 42 };
    expect(importCode(exportCode(p))).toEqual(p);
    expect(importCode('hello')).toBeNull();
  });
});
