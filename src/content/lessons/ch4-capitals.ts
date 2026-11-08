import type { ChapterDef } from '../types';

/** Chapter 4: Shift and capital letters, on the farm. */
export const chapter4: ChapterDef = {
  id: 'farm',
  title: 'Big Letters',
  icon: 'props/windmill',
  lessons: [
    {
      id: 'scarecrow',
      title: 'Cheer the Scarecrow',
      newKeys: ['Shift'],
      intro: 'Hold Shift with the other hand for BIG letters.',
      outro: 'The scarecrow stands tall!',
      scene: { location: 'farm', mode: 'help', npc: 'villagers/farmer', targets: [{ sprite: 'village/scarecrow-sad', done: 'village/scarecrow-happy' }] },
      recipes: [
        { kind: 'names', count: 6, hand: 'right' },
        { kind: 'names', count: 4, hand: 'right', perSpell: [2, 2] },
      ],
      goalWpm: 9,
      gifts: ['hat-acorn'],
    },
    {
      id: 'hay',
      title: 'Stack the Hay',
      newKeys: [],
      intro: 'Now the other Shift key!',
      outro: 'Neat and tidy hay!',
      scene: { location: 'farm', mode: 'chore', npc: 'villagers/farmer', targets: [{ sprite: 'props/hay' }, { sprite: 'props/hay' }, { sprite: 'props/hay' }] },
      recipes: [
        { kind: 'names', count: 6, hand: 'left' },
        { kind: 'names', count: 4, hand: 'any', perSpell: [2, 2] },
      ],
      goalWpm: 9,
      gifts: ['decor-duck'],
    },
    {
      id: 'apples',
      title: 'Pick Apples',
      newKeys: [],
      intro: 'Big letter first, period last.',
      outro: 'A basket full of apples!',
      scene: { location: 'farm', mode: 'help', npc: 'villagers/grandma', targets: [{ sprite: 'props/apple-tree', done: 'props/oak' }, { sprite: 'props/apple-tree', done: 'props/oak' }] },
      recipes: [{ kind: 'sentences', count: 8, set: 'capitals' }],
      goalWpm: 10,
      gifts: ['hat-flower-pink'],
    },
    {
      id: 'goose',
      title: 'Grumpy Goose',
      newKeys: [],
      intro: 'HONK! A goose chases the chicks.',
      outro: 'The goose is happy now.',
      scene: { location: 'farm', mode: 'battle', targets: [{ sprite: 'creatures/goose-grumpy', done: 'creatures/goose-happy' }] },
      recipes: [
        { kind: 'names', count: 3, hand: 'any', perSpell: [2, 2] },
        { kind: 'sentences', count: 7, set: 'capitals' },
      ],
      goalWpm: 11,
      gifts: ['pet-fox'],
    },
  ],
};
