import type { ItemDef, RobeStyle } from '../types';

/**
 * Things the wizard wears. `unlock` = lesson id that puts the item in the shop.
 * Starter items (price 0, no unlock) are given to every new wizard.
 */
const hat = (id: string, name: string, price: number, unlock?: string, hatOffset?: number): ItemDef => ({
  id: `hat-${id}`, name, category: 'hat', sprite: `hats/${id}`, price, unlock, hatOffset,
});

export const HATS: ItemDef[] = [
  hat('plain-navy', 'Plain Hat', 0),
  hat('starry-blue', 'Starry Hat', 10, 'broom'),
  hat('jingle-red', 'Jingle Hat', 10, 'dust-bunnies'),
  hat('buckle-yellow', 'Sunny Hat', 10, 'first-words'),
  hat('moon-purple', 'Moon Hat', 15, 'spider'),
  hat('tall-blue', 'Tall Hat', 10, 'fix-chair'),
  hat('mushroom', 'Mushroom Cap', 20, 'fix-table', 4),
  hat('mushroom-red', 'Red Mushroom', 20, 'well', 4),
  hat('mushroom-blue', 'Blue Mushroom', 25, 'lanterns', 4),
  hat('mushroom-yellow', 'Yellow Mushroom', 25, 'apples', 4),
  hat('polka-purple', 'Polka Hat', 15, 'fix-shelf'),
  hat('frog', 'Frog Hat', 20, 'fix-window', 2),
  hat('snowy', 'Snowy Hat', 20, 'mouse', 4),
  hat('rainbow', 'Rainbow Hat', 20, 'well'),
  hat('pumpkin', 'Pumpkin Hat', 20, 'wagon', 2),
  hat('cat', 'Kitty Hat', 20, 'flowers', 1),
  hat('star-gold', 'Gold Star Hat', 25, 'lanterns'),
  hat('toad', 'Spotty Frog Hat', 20, 'bulldog', 2),
  hat('leafy', 'Leafy Hat', 0),
  hat('acorn', 'Acorn Hat', 0),
  hat('flower-pink', 'Flower Hat', 0),
  hat('cloud', 'Cloud Hat', 30, 'hay'),
  hat('buckle-red', 'Red Buckle Hat', 20, 'apples'),
  hat('sun', 'Sunshine Hat', 30, 'goose'),
  hat('dragon', 'Dragon Hat', 35, 'golem', 2),
  hat('candle', 'Candle Hat', 0),
  hat('crown', 'Crown', 0, undefined, 2),
];

const robe = (id: string, name: string, main: string, trim: string, pattern: RobeStyle['pattern'], price: number, unlock?: string): ItemDef => ({
  id: `robe-${id}`, name, category: 'robe', price, unlock, robe: { main, trim, pattern },
});

export const ROBES: ItemDef[] = [
  robe('sky', 'Sky Robe', '#5b8fd6', '#f2d36b', undefined, 0),
  robe('moss', 'Moss Robe', '#5e9c55', '#e8c86a', undefined, 10, 'wake-wand'),
  robe('berry', 'Berry Robe', '#b04a7a', '#f5c1d6', 'dots', 10, 'dust-bunnies'),
  robe('night', 'Night Robe', '#2f3270', '#f2d36b', 'stars', 20, 'cobwebs'),
  robe('sunset', 'Sunset Robe', '#e07a3c', '#ffe08a', 'stripes', 15, 'fix-chair'),
  robe('lilac', 'Lilac Robe', '#9a7bd1', '#ffffff', 'moons', 20, 'fix-shelf'),
  robe('cherry', 'Cherry Robe', '#d8434a', '#ffffff', 'hearts', 20, 'fix-cauldron'),
  robe('forest', 'Forest Robe', '#3d6b3a', '#c99a5b', 'leaves', 20, 'well'),
  robe('snow', 'Snow Robe', '#e9eef5', '#7fb3e6', 'stars', 20, 'flowers'),
  robe('honey', 'Honey Robe', '#e8b23a', '#7a4a1e', 'dots', 20, 'fence'),
  robe('ocean', 'Ocean Robe', '#2a8c9c', '#bff0ec', 'stripes', 20, 'scarecrow'),
  robe('rose', 'Rose Robe', '#f08fb0', '#ffffff', 'hearts', 20, 'apples'),
  robe('cocoa', 'Cocoa Robe', '#7b4f35', '#f0d7b0', 'leaves', 20, 'raccoon'),
  robe('midnight', 'Midnight Robe', '#1d1d3a', '#b98cf0', 'moons', 30, 'golem'),
  robe('ember', 'Ember Robe', '#a8322d', '#f6b73c', 'stars', 35, 'dragon'),
  robe('rainbow', 'Party Robe', '#6c5ce7', '#ffd166', 'dots', 30, 'ghost'),
];

const wand = (id: string, name: string, price: number, unlock?: string): ItemDef => ({
  id: `wand-${id}`, name, category: 'wand', sprite: `wands/${id}`, price, unlock,
});

export const WANDS: ItemDef[] = [
  wand('twig', 'Twig Wand', 0),
  wand('daisy', 'Daisy Wand', 10, 'first-words'),
  wand('feather', 'Feather Wand', 10, 'fix-table'),
  wand('candy-cane', 'Candy Wand', 15, 'fix-window'),
  wand('mushroom-staff', 'Mushroom Staff', 20, 'mouse'),
  wand('vine-staff', 'Vine Staff', 20, 'wagon'),
  wand('moon-staff', 'Moon Staff', 30, 'bulldog'),
  wand('lightning-staff', 'Zap Staff', 30, 'hay'),
  wand('sun-staff', 'Sun Staff', 30, 'goose'),
  wand('ice-staff', 'Ice Staff', 30, 'crow'),
  wand('star', 'Star Wand', 0),
  wand('crystal', 'Crystal Wand', 0),
];

/** Pets come from big lessons. Their outfits are sold once you have the pet. */
const PET_SPECIES: [id: string, name: string][] = [
  ['kitten', 'Kitten'], ['owl', 'Owl'], ['bunny', 'Bunny'], ['frog', 'Frog'], ['fox', 'Fox'], ['dragon', 'Baby Dragon'],
];
const OUTFITS: [id: string, name: string, price: number][] = [
  ['scarf', 'Scarf', 15], ['hat', 'Wizard Hat', 20], ['flowers', 'Flower Crown', 20],
];

export const PETS: ItemDef[] = PET_SPECIES.flatMap(([id, name]) => [
  { id: `pet-${id}`, name, category: 'pet' as const, sprite: `pets/${id}-plain`, price: 0 },
  ...OUTFITS.map(([o, oname, price]) => ({
    id: `pet-${id}-${o}`, name: `${name} ${oname}`, category: 'pet' as const, sprite: `pets/${id}-${o}`, price, requires: `pet-${id}`,
  })),
]);

export const STARTER_ITEMS = ['hat-plain-navy', 'robe-sky', 'wand-twig'];
