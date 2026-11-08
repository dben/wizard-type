import type { ItemCategory, ItemDef } from '../types';

/**
 * Things for the wizard's room.
 *  furniture: stands on the floor
 *  decor:     small things, drawn on top of furniture (put them on tables!)
 *  wall:      hangs on the wall
 *  rug:       lies flat under everything
 */
const item = (category: ItemCategory, sprite: string, name: string, price: number, unlock?: string): ItemDef => ({
  id: `${category}-${sprite.split('/')[1]}`, name, category, sprite, price, unlock,
});

export const FURNITURE: ItemDef[] = [
  // Gifts from fixing the tower (chapter 2).
  { id: 'furniture-chair', name: 'Wooden Chair', category: 'furniture', sprite: 'fixtures/chair-fixed', price: 0 },
  { id: 'furniture-table', name: 'Tea Table', category: 'furniture', sprite: 'fixtures/table-fixed', price: 0 },
  { id: 'furniture-old-bookshelf', name: 'Old Bookshelf', category: 'furniture', sprite: 'fixtures/bookshelf-fixed', price: 0 },
  { id: 'furniture-cauldron', name: 'Cauldron', category: 'furniture', sprite: 'fixtures/cauldron-fixed', price: 0 },
  item('furniture', 'furniture/mushroom-stool', 'Mushroom Stool', 25, 'first-words'),
  item('furniture', 'furniture/bed', 'Cozy Bed', 40, 'spider'),
  item('furniture', 'furniture/armchair', 'Armchair', 40, 'fix-chair'),
  item('furniture', 'furniture/round-table', 'Round Table', 35, 'fix-table'),
  item('furniture', 'furniture/fern', 'Big Fern', 30, 'fix-shelf'),
  item('furniture', 'furniture/desk', 'Writing Desk', 45, 'fix-window'),
  item('furniture', 'furniture/rocking-chair', 'Rocking Chair', 45, 'fix-cauldron'),
  item('furniture', 'furniture/bookshelf', 'Bookshelf', 50, 'mouse'),
  item('furniture', 'furniture/star-lamp', 'Star Lamp', 40, 'well'),
  item('furniture', 'furniture/bean-bag', 'Bean Bag', 40, 'wagon'),
  item('furniture', 'furniture/toy-chest', 'Toy Chest', 45, 'flowers'),
  item('furniture', 'furniture/wardrobe', 'Wardrobe', 55, 'lanterns'),
  item('furniture', 'furniture/globe', 'Big Globe', 50, 'fence'),
  item('furniture', 'furniture/grandfather-clock', 'Tall Clock', 60, 'bulldog'),
  item('furniture', 'furniture/fish-tank', 'Fish Tank', 60, 'scarecrow'),
  item('furniture', 'furniture/telescope', 'Telescope', 65, 'apples'),
  item('furniture', 'furniture/alchemy-table', 'Potion Table', 70, 'goose'),
  item('furniture', 'furniture/crystal-pedestal', 'Crystal Ball', 80, 'golem'),
];

export const DECOR: ItemDef[] = [
  item('decor', 'decor/candles', 'Candles', 0),
  item('decor', 'decor/books', 'Book Stack', 0),
  item('decor', 'decor/teapot', 'Teapot', 0),
  item('decor', 'decor/flower-pot', 'Flower Pot', 0),
  item('decor', 'decor/hourglass', 'Hourglass', 0),
  item('decor', 'decor/duck', 'Rubber Duck', 0),
  item('decor', 'decor/cactus', 'Happy Cactus', 15, 'broom'),
  item('decor', 'decor/hanging-plant', 'Hanging Plant', 15, 'first-words'),
  item('decor', 'decor/love-potion', 'Heart Potion', 20, 'cobwebs'),
  item('decor', 'decor/firefly-jar', 'Firefly Jar', 25, 'fix-chair'),
  item('decor', 'decor/crystal-ball', 'Little Crystal Ball', 25, 'fix-shelf'),
  item('decor', 'decor/globe-small', 'Little Globe', 20, 'fix-window'),
  item('decor', 'decor/snow-globe', 'Snow Globe', 30, 'well'),
  item('decor', 'decor/music-box', 'Music Box', 30, 'lanterns'),
  item('decor', 'decor/rocket', 'Toy Rocket', 35, 'scarecrow'),
];

export const WALL: ItemDef[] = [
  { id: 'wall-window', name: 'Round Window', category: 'wall', sprite: 'fixtures/window-fixed', price: 0 },
  item('wall', 'decor/star-bunting', 'Star Bunting', 0),
  item('wall', 'decor/paper-lantern', 'Paper Lantern', 0),
  item('wall', 'decor/moon-clock', 'Moon Clock', 0),
  item('wall', 'decor/painting-mountains', 'Mountain Painting', 25, 'dust-bunnies'),
  item('wall', 'decor/painting-cat', 'Cat Portrait', 30, 'spider'),
  item('wall', 'decor/wreath', 'Leaf Wreath', 20, 'fix-table'),
  item('wall', 'decor/moon-banner', 'Moon Banner', 30, 'fix-cauldron'),
  item('wall', 'decor/mirror', 'Mirror', 35, 'mouse'),
  item('wall', 'decor/potion-shelf', 'Potion Shelf', 35, 'wagon'),
  item('wall', 'decor/map-scroll', 'Treasure Map', 30, 'fence'),
  item('wall', 'decor/butterflies', 'Butterflies', 35, 'bulldog'),
  item('wall', 'decor/tapestry', 'Tapestry', 40, 'hay'),
  item('wall', 'decor/star-shield', 'Star Shield', 45, 'goose'),
  item('wall', 'decor/cuckoo-clock', 'Cuckoo Clock', 45, 'raccoon'),
  item('wall', 'decor/kite', 'Kite', 35, 'crow'),
  item('wall', 'decor/rainbow-drawing', 'Rainbow Drawing', 40, 'ghost'),
];

export const RUGS: ItemDef[] = [
  item('rug', 'rugs/checkers', 'Checker Rug', 0),
  item('rug', 'rugs/stars', 'Star Rug', 25, 'cobwebs'),
  item('rug', 'rugs/leaf', 'Leaf Rug', 30, 'fix-window'),
  item('rug', 'rugs/rainbow', 'Rainbow Rug', 40, 'flowers'),
  item('rug', 'rugs/moon', 'Moon Rug', 40, 'scarecrow'),
  item('rug', 'rugs/sheep', 'Sheep Rug', 50, 'crow'),
];
