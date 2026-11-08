/**
 * Sentence templates.
 *  - {slot} is filled from FILLS; {Slot} capitalizes the fill.
 *  - {n} is a number made only from learned digits (never exactly 1, so plurals read right).
 *  - The generator skips any result that uses a key the player has not learned yet,
 *    so templates can be written freely.
 *  - Adjectives start with a consonant so "a {adj}" always reads right.
 */
export const FILLS: Record<string, readonly string[]> = {
  animal: ['cat', 'dog', 'frog', 'owl', 'fox', 'pig', 'duck', 'goat', 'bee', 'bug', 'hen', 'cow', 'mouse', 'rabbit', 'snail', 'sheep', 'horse', 'tiger', 'zebra', 'dragon'],
  animals: ['cats', 'dogs', 'frogs', 'owls', 'pigs', 'ducks', 'goats', 'bees', 'bugs', 'hens', 'cows', 'mice', 'snails', 'sheep', 'horses', 'apples', 'stars', 'hats', 'cakes', 'kites', 'eggs'],
  adj: ['big', 'small', 'red', 'blue', 'green', 'happy', 'silly', 'sleepy', 'tiny', 'fuzzy', 'brave', 'kind', 'glad', 'soft', 'shiny', 'tall', 'fast', 'slow', 'new', 'good'],
  color: ['red', 'blue', 'green', 'pink', 'gold', 'purple', 'yellow', 'black', 'brown', 'silver'],
  verb: ['hop', 'run', 'sing', 'jump', 'swim', 'fly', 'dance', 'read', 'sleep', 'dig', 'play', 'eat', 'hide', 'smile'],
  thing: ['hat', 'cake', 'book', 'kite', 'ball', 'drum', 'map', 'key', 'cup', 'boat', 'bell', 'lamp', 'rug', 'sock', 'jar', 'pie', 'wand'],
  place: ['hill', 'tree', 'log', 'rug', 'bed', 'roof', 'road', 'pond', 'path', 'rock', 'desk', 'sofa'],
  name: ['Sam', 'Mia', 'Leo', 'Ava', 'Max', 'Ruby', 'Finn', 'Luna', 'Jo', 'Kim', 'Ted', 'Nora', 'Gus', 'Ivy'],
};

export const SENTENCE_SETS = {
  /** No capitals or punctuation. */
  lowerPhrases: [
    'a {adj} {animal}', 'the {adj} {thing}', 'my {animal} is {adj}', 'the {animal} is {adj}',
    'a {color} {thing}', 'the {animal} can {verb}', 'we see a {animal}', 'look at the {animal}',
    'a {thing} on the {place}', 'the {color} {animal}', 'we like the {thing}', 'it is a {adj} day',
  ],
  /** Lowercase lists with commas. */
  commas: [
    '{color}, {color}, {color}', 'a {animal}, a {animal}, a {animal}', '{thing}, {thing}, and {thing}',
    'red, gold, and green', 'hop, skip, and jump', 'a {adj}, {adj} {animal}',
  ],
  /** Lowercase sentences ending in a period. */
  periods: [
    'the {animal} can {verb}.', 'we see a {adj} {animal}.', 'a {thing} is on the {place}.', 'we like to {verb}.',
    'the {color} {thing} is mine.', 'my {animal} is {adj}.', 'the {animal} sat on the {place}.',
    'it is a {adj} day.', 'look at the {adj} {thing}.',
  ],
  /** First capital letters plus a period. */
  capitals: [
    'The {animal} can {verb}.', 'I see a {adj} {animal}.', '{Name} has a {thing}.', '{Name} can {verb}.',
    'The {thing} is on the {place}.', 'We like the {color} {thing}.', '{Name} and {Name} play.',
    'My {animal} is {adj}.', 'The {adj} {animal} sat on the {place}.', 'I like my {color} {thing}.',
  ],
  numbers: [
    '{n} {animals}', 'I see {n} {animals}.', '{Name} has {n} {animals}.', 'We have {n} {animals}.',
    'Look, {n} {animals}.', '{Name} sees {n} {animals}.', '{n} {animals} and {n} {animals}',
  ],
  exclaimAsk: [
    'Wow, a {adj} {animal}!', 'Can you see the {animal}?', 'Is it a {thing}?', 'Look at me!', 'Hello, {Name}!',
    'Do you like {animals}?', 'What a {adj} {thing}!', 'Can {Name} {verb}?', 'Yes! I can {verb}!',
    'Where is my {thing}?', 'Hooray for {Name}!',
  ],
  quotes: [
    '"Hi!" said {Name}.', "It's a {adj} {animal}.", '"Look!" said {Name}.', "I can't find my {thing}.",
    "{Name}'s {animal} is {adj}.", '"Wow!" said the {animal}.', "Let's {verb}!", '"Can we {verb}?" asked {Name}.',
    "Don't wake the {animal}.",
  ],
  /** Final battle: everything together. */
  dragon: [
    '"Go home, dragon!" said {Name}.', 'The dragon has {n} gold coins.', "Wow! It's {n} feet tall!",
    'Can {Name} and {Name} help? Yes!', 'I have {n} {animals}, {n} {animals}, and a wand.',
    '"Please be kind," said {Name}.', "The dragon's cave is {adj}.", 'Is the dragon {adj}? No, it is {adj}!',
    'At {n} o\'clock, we will {verb}.', '"Thank you!" said the {adj} dragon.',
  ],
} as const satisfies Record<string, readonly string[]>;

export type SentenceSet = keyof typeof SENTENCE_SETS;
