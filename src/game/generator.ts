import type { Recipe } from '../content/types';
import { NAMES_LEFT_HAND, NAMES_RIGHT_HAND, WORDS } from '../content/words/words';
import { FILLS, SENTENCE_SETS } from '../content/words/sentences';
import { strokeFor } from './keyboard';
import type { Rng } from './rng';

export interface GenContext {
  /** Every character the player may be asked to type. */
  allowed: ReadonlySet<string>;
  /** Characters introduced in this lesson (used for drills and to favor words). */
  focus: readonly string[];
  rng: Rng;
}

export const isTypeable = (text: string, allowed: ReadonlySet<string>) =>
  text.length > 0 && [...text].every((c) => allowed.has(c));

const capitalize = (w: string) => w[0].toUpperCase() + w.slice(1);

/** Picks from a list without repeating until the list runs out. */
function deck<T>(items: readonly T[], rng: Rng) {
  let pile: T[] = [];
  return () => {
    if (pile.length === 0) pile = rng.shuffle(items);
    return pile.pop()!;
  };
}

function join(parts: string[], allowed: ReadonlySet<string>) {
  // Before Space is learned, multi-part spells are glued together.
  return parts.join(allowed.has(' ') ? ' ' : '');
}

function keyDrills(r: Extract<Recipe, { kind: 'keys' }>, ctx: GenContext): string[] {
  const pool = [...(r.keys ?? ctx.focus.join(''))].filter((c) => c !== ' ' && ctx.allowed.has(c));
  if (pool.length === 0) throw new Error('keys recipe has no typeable keys');
  const [smin, smax] = r.size ?? [1, 3];
  const [gmin, gmax] = ctx.allowed.has(' ') ? (r.groups ?? [1, 2]) : [1, 1];
  const out: string[] = [];
  for (let i = 0; i < r.count; i++) {
    const groups = Array.from({ length: ctx.rng.int(gmin, gmax) }, () =>
      Array.from({ length: ctx.rng.int(smin, smax) }, () => ctx.rng.pick(pool)).join(''),
    );
    out.push(join(groups, ctx.allowed));
  }
  return out;
}

export function typeableWords(allowed: ReadonlySet<string>, maxLength = 99) {
  return WORDS.filter((w) => w.length <= maxLength && isTypeable(w, allowed));
}

function words(r: Extract<Recipe, { kind: 'words' }>, ctx: GenContext): string[] {
  const all = typeableWords(ctx.allowed, r.maxLength);
  if (all.length === 0) throw new Error('words recipe: no typeable words');
  const focusChars = ctx.focus.filter((c) => c.length === 1 && c !== ' ');
  const focused = all.filter((w) => focusChars.some((c) => w.includes(c)));
  const drawAll = deck(all, ctx.rng);
  const drawFocus = focused.length ? deck(focused, ctx.rng) : drawAll;
  const [pmin, pmax] = ctx.allowed.has(' ') ? (r.perSpell ?? [1, 1]) : [1, 1];
  const focusRate = r.focus ?? 0.7;
  return Array.from({ length: r.count }, () => {
    const parts = Array.from({ length: ctx.rng.int(pmin, pmax) }, () =>
      ctx.rng.next() < focusRate ? drawFocus() : drawAll(),
    );
    return join(parts, ctx.allowed);
  });
}

function names(r: Extract<Recipe, { kind: 'names' }>, ctx: GenContext): string[] {
  const list = r.hand === 'left' ? NAMES_LEFT_HAND : r.hand === 'right' ? NAMES_RIGHT_HAND : [...NAMES_LEFT_HAND, ...NAMES_RIGHT_HAND];
  const ok = list.filter((n) => isTypeable(n, ctx.allowed));
  if (ok.length === 0) throw new Error('names recipe: no typeable names');
  const draw = deck(ok, ctx.rng);
  const [pmin, pmax] = r.perSpell ?? [1, 1];
  return Array.from({ length: r.count }, () => join(Array.from({ length: ctx.rng.int(pmin, pmax) }, draw), ctx.allowed));
}

/** A random number (never exactly 1) written only with learned digits. */
function number(ctx: GenContext): string | undefined {
  const digits = [...'0123456789'].filter((d) => ctx.allowed.has(d));
  if (digits.length === 0) return undefined;
  const nonZero = digits.filter((d) => d !== '0');
  const first = ctx.rng.pick(nonZero.length ? nonZero : digits);
  const n = ctx.rng.next() < 0.5 || digits.length === 1 ? first : first + ctx.rng.pick(digits);
  // "1 cats" reads wrong; use a two-digit number instead when possible.
  return n === '1' && digits.length > 1 ? '1' + ctx.rng.pick(digits) : n;
}

export function fillTemplate(template: string, ctx: GenContext): string | undefined {
  let failed = false;
  const text = template.replace(/\{(\w+)\}/g, (_, slot: string) => {
    if (slot === 'n') {
      const n = number(ctx);
      if (!n) failed = true;
      return n ?? '';
    }
    const key = slot.toLowerCase();
    const options = (FILLS[key] ?? []).map((w) => (slot[0] !== key[0] ? capitalize(w) : w));
    const ok = options.filter((w) => isTypeable(w, ctx.allowed));
    if (ok.length === 0) {
      failed = true;
      return '';
    }
    return ctx.rng.pick(ok);
  });
  return failed || !isTypeable(text, ctx.allowed) ? undefined : text;
}

function sentences(r: Extract<Recipe, { kind: 'sentences' }>, ctx: GenContext): string[] {
  const templates = SENTENCE_SETS[r.set];
  const out: string[] = [];
  const seen = new Set<string>();
  const draw = deck(templates, ctx.rng);
  for (let tries = 0; out.length < r.count && tries < r.count * 60; tries++) {
    const text = fillTemplate(draw(), ctx);
    if (text && (!seen.has(text) || tries > r.count * 30)) {
      seen.add(text);
      out.push(text);
    }
  }
  if (out.length < r.count) throw new Error(`sentences "${r.set}": only made ${out.length}/${r.count}`);
  return out;
}

function list(r: Extract<Recipe, { kind: 'list' }>, ctx: GenContext): string[] {
  const ok = r.items.filter((t) => isTypeable(t, ctx.allowed));
  if (ok.length === 0) throw new Error('list recipe: no typeable items');
  const draw = deck(ok, ctx.rng);
  return Array.from({ length: r.count }, draw);
}

export function generate(recipe: Recipe, ctx: GenContext): string[] {
  switch (recipe.kind) {
    case 'keys': return keyDrills(recipe, ctx);
    case 'words': return words(recipe, ctx);
    case 'names': return names(recipe, ctx);
    case 'sentences': return sentences(recipe, ctx);
    case 'list': return list(recipe, ctx);
  }
}

export function generateSpells(recipes: readonly Recipe[], ctx: GenContext): string[] {
  return recipes.flatMap((r) => generate(r, ctx));
}

/** Every character in the text has a key on the keyboard. */
export const isOnKeyboard = (text: string) => [...text].every((c) => !!strokeFor(c));
