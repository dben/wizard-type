import type { ChapterDef } from '../types';

/** Chapter 5: numbers and symbols, up Dragon Mountain. */
export const chapter5: ChapterDef = {
  id: 'mountain',
  title: 'Dragon Mountain',
  icon: 'creatures/dragon-happy',
  lessons: [
    {
      id: 'raccoon',
      title: 'Raccoon Count',
      newKeys: ['1', '2', '3', '4', '5'],
      intro: 'Numbers live on the top row. 1 2 3 4 5!',
      outro: 'The raccoon learned to count!',
      scene: { location: 'forest', mode: 'battle', targets: [{ sprite: 'creatures/raccoon-grumpy', done: 'creatures/raccoon-happy' }] },
      recipes: [
        { kind: 'keys', count: 3, keys: '12345', size: [1, 2], groups: [1, 2] },
        { kind: 'sentences', count: 7, set: 'numbers' },
      ],
      goalWpm: 9,
      gifts: ['wand-star'],
    },
    {
      id: 'crow',
      title: "Crow's Riddle",
      newKeys: ['6', '7', '8', '9', '0'],
      intro: '6 7 8 9 0. Reach up high!',
      outro: 'The crow loves your numbers.',
      scene: { location: 'forest', mode: 'battle', targets: [{ sprite: 'creatures/crow-grumpy', done: 'creatures/crow-happy' }] },
      recipes: [
        { kind: 'keys', count: 3, keys: '67890', size: [1, 2], groups: [1, 2] },
        { kind: 'sentences', count: 7, set: 'numbers' },
      ],
      goalWpm: 9,
      gifts: ['wall-moon-clock'],
    },
    {
      id: 'golem',
      title: 'Wake the Golem',
      newKeys: ['!', '?'],
      intro: 'Shift + 1 is ! and Shift + / is ?',
      outro: 'The golem gives you a big hug!',
      scene: { location: 'mountain', mode: 'battle', targets: [{ sprite: 'creatures/golem-grumpy', done: 'creatures/golem-happy' }] },
      recipes: [
        { kind: 'list', count: 3, items: ['Wow!', 'Yes!', 'Who?', 'Hi!', 'Why?', 'Ha!'] },
        { kind: 'sentences', count: 7, set: 'exclaimAsk' },
      ],
      goalWpm: 10,
      gifts: ['wand-crystal'],
    },
    {
      id: 'ghost',
      title: 'Ghost Notes',
      newKeys: ["'", '"'],
      intro: "' is next to Enter. Shift makes it \".",
      outro: 'The ghost says boo-hoo-hooray!',
      scene: { location: 'mountain', mode: 'battle', targets: [{ sprite: 'creatures/ghost-grumpy', done: 'creatures/ghost-happy' }] },
      recipes: [
        { kind: 'list', count: 3, items: ["it's", "I'm", "can't", "don't", '"Boo!"', '"Hi!"'] },
        { kind: 'sentences', count: 7, set: 'quotes' },
      ],
      goalWpm: 10,
      gifts: ['hat-candle'],
    },
    {
      id: 'dragon',
      title: 'The Dragon',
      newKeys: [],
      intro: 'The dragon is SO grumpy. Use every spell!',
      outro: 'You made friends with the dragon!',
      scene: { location: 'mountain', mode: 'battle', targets: [{ sprite: 'creatures/dragon-grumpy', done: 'creatures/dragon-happy' }] },
      recipes: [
        { kind: 'sentences', count: 4, set: 'exclaimAsk' },
        { kind: 'sentences', count: 4, set: 'quotes' },
        { kind: 'sentences', count: 6, set: 'dragon' },
      ],
      goalWpm: 11,
      gifts: ['pet-dragon', 'hat-crown'],
    },
  ],
};
