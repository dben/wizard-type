import type { ChapterDef } from '../types';

/** Chapter 1: the home row. The tower is dusty, so every spell tidies something. */
export const chapter1: ChapterDef = {
  id: 'tower',
  title: 'The Dusty Tower',
  icon: 'props/wizard-tower',
  lessons: [
    {
      id: 'wake-wand',
      title: 'Wake the Wand',
      newKeys: ['f', 'j', ' '],
      intro: 'Find the bumps on F and J. Thumbs on Space!',
      outro: 'Your wand is awake!',
      scene: { location: 'tower', mode: 'chore', targets: [{ sprite: 'clutter/dust-2' }, { sprite: 'clutter/dust-1' }, { sprite: 'clutter/dust-3' }] },
      recipes: [
        { kind: 'list', count: 4, items: ['f', 'j', 'ff', 'jj'] },
        { kind: 'keys', count: 5, size: [2, 3], groups: [1, 2] },
      ],
      goalWpm: 4,
      gifts: ['decor-candles'],
    },
    {
      id: 'broom',
      title: 'Magic Broom',
      newKeys: ['d', 'k'],
      intro: 'Middle fingers: D and K.',
      outro: 'Swish swish! So tidy.',
      scene: {
        location: 'tower',
        mode: 'chore',
        targets: [
          { sprite: 'clutter/dust-3', helper: 'clutter/broom' },
          { sprite: 'clutter/dust-4', helper: 'clutter/broom' },
          { sprite: 'clutter/dust-2', helper: 'clutter/broom' },
        ],
      },
      recipes: [
        { kind: 'keys', count: 4, keys: 'dk', size: [1, 2], groups: [1, 2] },
        { kind: 'keys', count: 6, keys: 'dfjk', size: [2, 3], groups: [2, 2] },
      ],
      goalWpm: 5,
      gifts: ['wall-star-bunting'],
    },
    {
      id: 'dust-bunnies',
      title: 'Dust Bunnies',
      newKeys: ['s', 'l'],
      intro: 'Ring fingers: S and L.',
      outro: 'The dust bunnies hopped away!',
      scene: { location: 'tower', mode: 'chore', targets: [{ sprite: 'clutter/dust-bunny-1' }, { sprite: 'clutter/dust-bunny-2' }] },
      recipes: [
        { kind: 'keys', count: 4, keys: 'sl', size: [1, 2], groups: [1, 2] },
        { kind: 'keys', count: 6, keys: 'sdfjkl', size: [2, 3], groups: [2, 3] },
      ],
      goalWpm: 5,
      gifts: ['decor-books'],
    },
    {
      id: 'first-words',
      title: 'First Words',
      newKeys: ['a', ';'],
      intro: 'Pinkies: A and ;. Now you can spell words!',
      outro: 'You cast real word spells!',
      scene: { location: 'tower', mode: 'chore', targets: [{ sprite: 'clutter/paper-pile' }, { sprite: 'clutter/plate-broken' }] },
      recipes: [
        { kind: 'keys', count: 3, keys: 'a;', size: [1, 2], groups: [1, 2] },
        { kind: 'words', count: 8, focus: 0.6 },
      ],
      goalWpm: 6,
      gifts: ['rug-checkers'],
    },
    {
      id: 'cobwebs',
      title: 'Cobweb Sweep',
      newKeys: ['g', 'h'],
      intro: 'Reach in with your pointers: G and H.',
      outro: 'No more cobwebs!',
      scene: { location: 'tower', mode: 'chore', targets: [{ sprite: 'clutter/cobweb-corner', helper: 'clutter/broom' }, { sprite: 'clutter/cobweb', helper: 'clutter/broom' }] },
      recipes: [
        { kind: 'keys', count: 3, keys: 'gh', size: [1, 2], groups: [1, 2] },
        { kind: 'words', count: 8, focus: 0.7 },
      ],
      goalWpm: 6,
      gifts: ['decor-teapot'],
    },
    {
      id: 'spider',
      title: 'Shoo, Spider!',
      newKeys: [],
      intro: 'A grumpy spider! Cheer it up.',
      outro: 'The spider waved bye-bye.',
      scene: { location: 'tower', mode: 'battle', targets: [{ sprite: 'creatures/spider-grumpy', done: 'creatures/spider-happy' }] },
      recipes: [
        { kind: 'words', count: 6, focus: 0 },
        { kind: 'words', count: 4, perSpell: [2, 2], focus: 0 },
      ],
      goalWpm: 7,
      gifts: ['pet-kitten'],
    },
  ],
};
