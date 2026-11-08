import type { LocationId } from '../types';

/**
 * Outdoor places are drawn in layers that scroll at different speeds:
 * sky, two hill lines, far props (hazy), ground, near props.
 * The tower uses its painted background instead.
 */
export interface LocationDef {
  name: string;
  indoor?: boolean;
  sky: [top: string, bottom: string];
  hills: [far: string, near: string];
  grass: string;
  path: string;
  far: string[];
  near: string[];
  river?: boolean;
}

export const LOCATIONS: Record<LocationId, LocationDef> = {
  tower: { name: 'Tower', indoor: true, sky: ['#000', '#000'], hills: ['#000', '#000'], grass: '#000', path: '#000', far: [], near: [] },
  village: {
    name: 'Village',
    sky: ['#7cc8f5', '#d8f1ff'],
    hills: ['#9fd08a', '#7dbb63'],
    grass: '#6fb04a',
    path: '#c9a26b',
    far: ['props/cottage', 'props/bakery', 'props/stone-hut', 'props/market-stall', 'props/oak', 'props/cottage', 'props/windmill'],
    near: ['props/bush', 'props/flower-bush', 'props/fence', 'props/wildflowers', 'props/signpost', 'props/grass'],
  },
  farm: {
    name: 'Farm',
    sky: ['#8fd0f0', '#fff1d0'],
    hills: ['#c9d98a', '#a5c66a'],
    grass: '#86b84a',
    path: '#c49b62',
    far: ['props/windmill', 'props/apple-tree', 'props/cottage', 'props/oak', 'props/hay'],
    near: ['props/hay', 'props/fence', 'props/blue-flowers', 'props/grass', 'props/wildflowers'],
  },
  bridge: {
    name: 'River',
    sky: ['#79c2f0', '#dff4ff'],
    hills: ['#8fc77a', '#6aae5a'],
    grass: '#64a648',
    path: '#c29a66',
    far: ['props/oak', 'props/pine', 'props/birch', 'props/oak'],
    near: ['props/rocks', 'props/grass', 'props/bush', 'props/blue-flowers'],
    river: true,
  },
  forest: {
    name: 'Forest',
    sky: ['#6fb6a8', '#cfeccf'],
    hills: ['#5d9a5a', '#4b8549'],
    grass: '#4f9446',
    path: '#a88458',
    far: ['props/pine', 'props/oak', 'props/pine', 'props/birch', 'props/pine'],
    near: ['props/mushrooms', 'props/stump', 'props/bush', 'props/grass', 'props/rocks'],
  },
  mountain: {
    name: 'Dragon Mountain',
    sky: ['#7b6fc4', '#f2c6a8'],
    hills: ['#8c7a9e', '#6f6585'],
    grass: '#7b8f5a',
    path: '#a08870',
    far: ['props/cliff', 'props/pine', 'props/cliff', 'props/boulder'],
    near: ['props/boulder', 'props/rocks', 'props/grass', 'props/stump'],
  },
};
