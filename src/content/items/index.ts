import type { ItemCategory, ItemDef } from '../types';
import { DECOR, FURNITURE, RUGS, WALL } from './room';
import { HATS, PETS, ROBES, WANDS } from './wardrobe';

export { STARTER_ITEMS } from './wardrobe';

export const ITEMS: readonly ItemDef[] = [...HATS, ...ROBES, ...WANDS, ...PETS, ...FURNITURE, ...DECOR, ...WALL, ...RUGS];

const byId = new Map(ITEMS.map((i) => [i.id, i]));
export const item = (id: string) => byId.get(id);
export const itemsIn = (category: ItemCategory) => ITEMS.filter((i) => i.category === category);

export const WEARABLE: readonly ItemCategory[] = ['hat', 'robe', 'wand', 'pet'];
export const ROOM_CATEGORIES: readonly ItemCategory[] = ['furniture', 'decor', 'wall', 'rug'];
