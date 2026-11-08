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
  item('furniture', 'furniture/mushroom-stool', 'Mushroom Stool', 10, 'first-words'),
  item('furniture', 'furniture/bed', 'Cozy Bed', 20, 'spider'),
  item('furniture', 'furniture/armchair', 'Armchair', 20, 'fix-chair'),
  item('furniture', 'furniture/round-table', 'Round Table', 20, 'fix-table'),
  item('furniture', 'furniture/fern', 'Big Fern', 15, 'fix-shelf'),
  item('furniture', 'furniture/desk', 'Writing Desk', 20, 'fix-window'),
  item('furniture', 'furniture/rocking-chair', 'Rocking Chair', 20, 'fix-cauldron'),
  item('furniture', 'furniture/bookshelf', 'Bookshelf', 25, 'mouse'),
  item('furniture', 'furniture/star-lamp', 'Star Lamp', 20, 'well'),
  item('furniture', 'furniture/bean-bag', 'Bean Bag', 20, 'wagon'),
  item('furniture', 'furniture/toy-chest', 'Toy Chest', 20, 'flowers'),
  item('furniture', 'furniture/wardrobe', 'Wardrobe', 30, 'lanterns'),
  item('furniture', 'furniture/globe', 'Big Globe', 25, 'fence'),
  item('furniture', 'furniture/grandfather-clock', 'Tall Clock', 30, 'bulldog'),
  item('furniture', 'furniture/fish-tank', 'Fish Tank', 30, 'scarecrow'),
  item('furniture', 'furniture/telescope', 'Telescope', 30, 'apples'),
  item('furniture', 'furniture/alchemy-table', 'Potion Table', 35, 'goose'),
  item('furniture', 'furniture/crystal-pedestal', 'Crystal Ball', 40, 'golem'),
];

export const DECOR: ItemDef[] = [
  item('decor', 'decor/candles', 'Candles', 0),
  item('decor', 'decor/books', 'Book Stack', 0),
  item('decor', 'decor/teapot', 'Teapot', 0),
  item('decor', 'decor/flower-pot', 'Flower Pot', 0),
  item('decor', 'decor/hourglass', 'Hourglass', 0),
  item('decor', 'decor/duck', 'Rubber Duck', 0),
  item('decor', 'decor/cactus', 'Happy Cactus', 10, 'broom'),
  item('decor', 'decor/hanging-plant', 'Hanging Plant', 10, 'first-words'),
  item('decor', 'decor/love-potion', 'Heart Potion', 10, 'cobwebs'),
  item('decor', 'decor/firefly-jar', 'Firefly Jar', 10, 'fix-chair'),
  item('decor', 'decor/crystal-ball', 'Little Crystal Ball', 10, 'fix-shelf'),
  item('decor', 'decor/globe-small', 'Little Globe', 10, 'fix-window'),
  item('decor', 'decor/snow-globe', 'Snow Globe', 15, 'well'),
  item('decor', 'decor/music-box', 'Music Box', 15, 'lanterns'),
  item('decor', 'decor/rocket', 'Toy Rocket', 20, 'scarecrow'),
];

export const WALL: ItemDef[] = [
  item('wall', 'decor/star-bunting', 'Star Bunting', 0),
  item('wall', 'decor/paper-lantern', 'Paper Lantern', 0),
  item('wall', 'decor/moon-clock', 'Moon Clock', 0),
  item('wall', 'decor/painting-mountains', 'Mountain Painting', 10, 'dust-bunnies'),
  item('wall', 'decor/painting-cat', 'Cat Portrait', 15, 'spider'),
  item('wall', 'decor/wreath', 'Leaf Wreath', 10, 'fix-table'),
  item('wall', 'decor/moon-banner', 'Moon Banner', 15, 'fix-cauldron'),
  item('wall', 'decor/mirror', 'Mirror', 20, 'mouse'),
  item('wall', 'decor/potion-shelf', 'Potion Shelf', 20, 'wagon'),
  item('wall', 'decor/map-scroll', 'Treasure Map', 15, 'fence'),
  item('wall', 'decor/butterflies', 'Butterflies', 20, 'bulldog'),
  item('wall', 'decor/tapestry', 'Tapestry', 20, 'hay'),
  item('wall', 'decor/star-shield', 'Star Shield', 20, 'goose'),
  item('wall', 'decor/cuckoo-clock', 'Cuckoo Clock', 20, 'raccoon'),
  item('wall', 'decor/kite', 'Kite', 20, 'crow'),
  item('wall', 'decor/rainbow-drawing', 'Rainbow Drawing', 20, 'ghost'),
];

export const RUGS: ItemDef[] = [
  item('rug', 'rugs/checkers', 'Checker Rug', 0),
  item('rug', 'rugs/stars', 'Star Rug', 10, 'cobwebs'),
  item('rug', 'rugs/leaf', 'Leaf Rug', 15, 'fix-window'),
  item('rug', 'rugs/rainbow', 'Rainbow Rug', 20, 'flowers'),
  item('rug', 'rugs/moon', 'Moon Rug', 20, 'scarecrow'),
  item('rug', 'rugs/sheep', 'Sheep Rug', 25, 'crow'),
];

/** Styles for the big window in the tower wall. Only one shows at a time. */
export const WINDOWS: ItemDef[] = [
  // Kept the old id: it's in existing save files as the fix-window gift.
  { id: 'wall-window', name: 'Meadow Window', category: 'window', sprite: 'windows/meadow', price: 0 },
  item('window', 'windows/sunset', 'Sunset Window', 30, 'well'),
  item('window', 'windows/mountains', 'Mountain Window', 30, 'bulldog'),
  item('window', 'windows/frosty', 'Frosty Window', 35, 'goose'),
  item('window', 'windows/starry', 'Starry Window', 40, 'golem'),
];

/** More little things. Unlocks are spread over the whole course so every lesson opens something. */
export const MORE_DECOR: ItemDef[] = [
  // Plants
  item('decor', 'decor/succulents', 'Succulents', 5, 'wake-wand'),
  item('decor', 'decor/small-fern', 'Little Fern', 5, 'dust-bunnies'),
  item('decor', 'decor/tulips', 'Tulips', 5, 'first-words'),
  item('decor', 'decor/daisies', 'Daisy Jug', 10, 'spider'),
  item('decor', 'decor/snake-plant', 'Snake Plant', 10, 'fix-table'),
  item('decor', 'decor/cactus-flower', 'Flower Cactus', 10, 'fix-window'),
  item('decor', 'decor/violets', 'Teacup Violets', 10, 'fix-cauldron'),
  item('decor', 'decor/herb-box', 'Herb Box', 10, 'well'),
  item('decor', 'decor/lavender', 'Lavender', 10, 'flowers'),
  item('decor', 'decor/sunflower', 'Sunflower', 10, 'fence'),
  item('decor', 'decor/roses', 'Rose Vase', 10, 'bulldog'),
  item('decor', 'decor/bamboo', 'Lucky Bamboo', 10, 'hay'),
  item('decor', 'decor/monstera', 'Monstera', 10, 'goose'),
  item('decor', 'decor/tiny-pine', 'Tiny Pine', 10, 'crow'),
  item('decor', 'decor/orchid', 'Orchid', 10, 'golem'),
  item('decor', 'decor/bonsai', 'Bonsai Tree', 10, 'dragon'),
  // Knick-knacks
  item('decor', 'decor/quill', 'Quill and Ink', 5, 'wake-wand'),
  item('decor', 'decor/scrolls', 'Scrolls', 5, 'dust-bunnies'),
  item('decor', 'decor/bell', 'Little Bell', 5, 'first-words'),
  item('decor', 'decor/plush-owl', 'Plush Owl', 10, 'spider'),
  item('decor', 'decor/cookie-jar', 'Cookie Jar', 10, 'fix-table'),
  item('decor', 'decor/alarm-clock', 'Alarm Clock', 10, 'fix-window'),
  item('decor', 'decor/sailboat', 'Toy Boat', 10, 'fix-cauldron'),
  item('decor', 'decor/frog-statue', 'Frog Statue', 10, 'well'),
  item('decor', 'decor/candle-lantern', 'Candle Lantern', 10, 'flowers'),
  item('decor', 'decor/potions', 'Potion Set', 10, 'fence'),
  item('decor', 'decor/star-jar', 'Jar of Stars', 10, 'bulldog'),
  item('decor', 'decor/spell-book', 'Spell Book', 10, 'hay'),
  item('decor', 'decor/moon-lamp', 'Moon Lamp', 10, 'goose'),
  item('decor', 'decor/crystals', 'Crystals', 10, 'crow'),
  item('decor', 'decor/toy-dragon', 'Toy Dragon', 10, 'golem'),
  item('decor', 'decor/treasure-chest', 'Treasure Box', 10, 'dragon'),
  // Color twins of older decor
  item('decor', 'decor/candles-blue', 'Blue Candles', 5, 'wake-wand'),
  item('decor', 'decor/books-blue', 'Blue Books', 5, 'dust-bunnies'),
  item('decor', 'decor/duck-pink', 'Pink Duck', 5, 'first-words'),
  item('decor', 'decor/flowers-yellow', 'Yellow Flowers', 10, 'spider'),
  item('decor', 'decor/teapot-pink', 'Pink Teapot', 10, 'fix-table'),
  item('decor', 'decor/cactus-sleepy', 'Sleepy Cactus', 10, 'fix-window'),
  item('decor', 'decor/books-red', 'Red Books', 10, 'fix-cauldron'),
  item('decor', 'decor/flowers-purple', 'Purple Flowers', 10, 'well'),
  item('decor', 'decor/hourglass-blue', 'Blue Hourglass', 10, 'flowers'),
  item('decor', 'decor/star-potion', 'Star Potion', 10, 'fence'),
  item('decor', 'decor/firefly-jar-green', 'Green Fireflies', 10, 'bulldog'),
  item('decor', 'decor/music-box-wood', 'Wood Music Box', 10, 'hay'),
  item('decor', 'decor/rocket-blue', 'Blue Rocket', 10, 'goose'),
  item('decor', 'decor/crystal-ball-green', 'Green Crystal Ball', 10, 'crow'),
  item('decor', 'decor/snow-globe-castle', 'Castle Snow Globe', 10, 'golem'),
  item('decor', 'decor/mushroom-teapot', 'Mushroom Teapot', 10, 'dragon'),
];
