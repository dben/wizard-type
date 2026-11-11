/**
 * The side-scrolling picture at the top of a lesson.
 *
 * The lesson screen tells the scene what happened (a key was typed, a spell
 * was cast, a spell went poof) and the scene animates it. It never decides
 * game rules.
 */
import type { LessonDef, TargetDef } from '../content/types';
import { item } from '../content/items';
import { LOCATIONS, type LocationDef } from '../content/world/locations';
import type { Placement } from '../game/save';
import { ROOM_H, ROOM_W, WINDOW_SPOT, clutterFor, type StoryClutter } from '../content/world/room';
import { idleFrame, IDLE, petMotion } from '../content/world/animations';
import { createRng } from '../game/rng';
import { loadSprite, preload, sprite } from './sprites';
import { WALK_FPS, WIZ, WIZ_CANVAS, drawWand, walkFrames, wandRest, wandTipAt } from './wizard';

export const VIEW_W = 480;
export const VIEW_H = 200;
const K = 2; // canvas pixels per scene pixel
const GROUND = 186;
const WIZ_X = 92;
const TARGET_GAP = 240;
const FIRST_TARGET_X = 330;
const ROOM_SHIFT = VIEW_H - ROOM_H; // the room is taller than the view; show its bottom part

interface TargetState {
  def: TargetDef;
  x: number; // world x
  y: number; // feet y
  need: number;
  hits: number;
  done: boolean;
  vanish: number; // 0..1 fade-out progress
  shake: number;
  hop: number;
  leave: number; // battle: walks off after the win
}

interface Particle {
  x: number; y: number; vx: number; vy: number; life: number; max: number; color: string; size: number; gravity: number;
}

interface Floater { text: string; x: number; y: number; life: number; color: string }

interface Bolt { x0: number; y0: number; target: TargetState; t: number; power: number }

interface Helper { sprite: string; target: TargetState; t: number }

export interface SceneSetup {
  lesson: LessonDef;
  spells: number;
  wizard: HTMLCanvasElement;
  wand: string;
  /** The wand is a tall staff, held upright. */
  staff?: boolean;
  pet: string | null;
  sparkle: string;
  room?: Placement[];
  /** Tower only: the big window's sprite once it's fixed. */
  windowSprite?: string | null;
  /** Tower only: mess that isn't part of this lesson, drawn greyed out. */
  clutter?: StoryClutter[];
}

const SPARKS = ['#fff7b0', '#ffe066', '#ffffff', '#b8f2ff'];

export class LessonScene {
  private ctx: CanvasRenderingContext2D;
  private loc: LocationDef;
  private targets: TargetState[] = [];
  private current = 0;
  private particles: Particle[] = [];
  private floaters: Floater[] = [];
  private bolts: Bolt[] = [];
  private helpers: Helper[] = [];
  private props: { far: { s: string; x: number }[]; near: { s: string; x: number }[] } = { far: [], near: [] };
  private camX = 0;
  private camGoal = 0;
  private npcX = 0;
  private wandKick = 0;
  private wandDroop = 0;
  private jump = 0;
  private time = 0;
  private last = 0;
  private raf = 0;
  private celebrating = false;
  private walk: HTMLCanvasElement[];

  constructor(canvas: HTMLCanvasElement, private setup: SceneSetup) {
    canvas.width = VIEW_W * K;
    canvas.height = VIEW_H * K;
    this.ctx = canvas.getContext('2d')!;
    this.loc = LOCATIONS[setup.lesson.scene.location];
    this.walk = walkFrames(setup.wizard);
    this.layoutTargets();
    this.layoutProps();
    this.camX = this.camGoal = this.camFor(this.targets[0]);
    this.npcX = this.targets[0].x + 90;
  }

  private layoutTargets() {
    const defs = this.setup.lesson.scene.targets;
    const n = defs.length;
    const base = Math.floor(this.setup.spells / n);
    const extra = this.setup.spells % n;
    // In the tower, each target stands where its mess is in the room.
    const spots = this.loc.indoor ? clutterFor(this.setup.lesson.id) : [];
    this.targets = defs.map((def, i) => {
      let x: number;
      let y = GROUND;
      if (spots[i]) {
        x = spots[i].x;
        y = spots[i].y + ROOM_SHIFT;
      } else if (this.loc.indoor) x = Math.round(ROOM_W / 2 + ((i + 0.5) * 210) / n);
      else x = FIRST_TARGET_X + i * TARGET_GAP;
      return {
        def, x, y, need: base + (i < extra ? 1 : 0),
        hits: 0, done: false, vanish: 0, shake: 0, hop: 0, leave: 0,
      };
    });
  }

  /** Camera position that puts a target in front of the wizard. The room stops at its side walls. */
  private camFor(t: TargetState) {
    const x = t.x - FIRST_TARGET_X;
    return this.loc.indoor ? Math.max(0, Math.min(ROOM_W - VIEW_W, x)) : x;
  }

  private layoutProps() {
    if (this.loc.indoor) return;
    const rng = createRng(this.setup.lesson.id.length * 977 + 13);
    const span = FIRST_TARGET_X + this.targets.length * TARGET_GAP + VIEW_W;
    for (let x = -60; x < span * 0.6; x += rng.int(110, 190)) this.props.far.push({ s: rng.pick(this.loc.far), x });
    for (let x = -40; x < span; x += rng.int(60, 130)) {
      const nearTarget = this.targets.some((t) => Math.abs(t.x - x) < 70) || Math.abs(x - WIZ_X) < 50;
      if (!nearTarget) this.props.near.push({ s: rng.pick(this.loc.near), x });
    }
  }

  async load() {
    const s = this.setup;
    const paths = [
      ...this.props.far.map((p) => p.s), ...this.props.near.map((p) => p.s),
      ...s.lesson.scene.targets.flatMap((t) => [t.sprite, t.done, t.helper].filter(Boolean) as string[]).flatMap((p) => IDLE[p]?.frames ?? [p]),
      s.wand, ...(s.pet ? [s.pet, ...(petMotion(s.pet)?.move ?? [])] : []), ...(s.lesson.scene.npc ? [s.lesson.scene.npc] : []),
      ...(this.loc.indoor
        ? ['backgrounds/tower', s.windowSprite ?? '', ...(s.clutter ?? []).map((c) => c.sprite), ...(s.room ?? []).map((p) => item(p.item)?.sprite ?? '')]
        : []),
      ...(this.loc.river ? ['props/bridge'] : []),
    ].filter(Boolean);
    await preload(paths).catch(() => undefined);
  }

  start() {
    const loop = (t: number) => {
      const dt = this.last ? Math.min(0.05, (t - this.last) / 1000) : 0;
      this.last = t;
      this.update(dt);
      this.draw();
      this.raf = requestAnimationFrame(loop);
    };
    this.raf = requestAnimationFrame(loop);
  }

  stop() {
    cancelAnimationFrame(this.raf);
  }

  // ---------- events from the lesson ----------

  /** A correct key: a little sparkle at the wand tip. */
  keySparkle() {
    const [x, y] = this.wandTip();
    this.burst(x, y, 3, SPARKS, 30);
  }

  /** Wrong key in fix mode: a small grey puff and a droopy wand. */
  oops() {
    const [x, y] = this.wandTip();
    this.burst(x, y, 6, ['#9a9aa6', '#c4c4cc'], 20, -10);
    this.wandDroop = 1;
  }

  /** Wrong key in poof mode: the spell fizzles. */
  poof() {
    const [x, y] = this.wandTip();
    this.burst(x, y, 26, ['#8c8c99', '#b5b5c0', '#d8d8e0'], 35, -15, 3);
    this.floaters.push({ text: 'Poof!', x, y: y - 10, life: 1.1, color: '#ffffff' });
    this.wandDroop = 1.4;
  }

  /** A finished spell flies to the current target. */
  cast(potency: number) {
    const target = this.targets[Math.min(this.current, this.targets.length - 1)];
    const [x, y] = this.wandTip();
    this.wandKick = 1;
    this.bolts.push({ x0: x + this.camX, y0: y, target, t: 0, power: potency });
    // Count the hit now so a fast typist's next spell aims at the next target.
    target.hits++;
    if (target.hits >= target.need && this.current < this.targets.length - 1) this.current++;
  }

  /** Everything is done: cheer, then resolve. */
  async celebrate(): Promise<void> {
    while (this.bolts.length || Math.abs(this.camGoal - this.camX) > 1) await wait(100);
    await wait(400);
    this.celebrating = true;
    const battle = this.setup.lesson.scene.mode === 'battle';
    for (let i = 0; i < 3; i++) {
      this.jump = 1;
      for (let k = 0; k < 18; k++) this.confetti();
      await wait(450);
    }
    if (battle) {
      const t = this.targets[0];
      for (let k = 0; k < 10; k++) this.floaters.push({ text: '♥', x: t.x - this.camX + rand(-20, 20), y: t.y - 60 - k * 6, life: 1 + k * 0.1, color: '#ff6b8a' });
    }
    await wait(500);
  }

  // ---------- simulation ----------

  private update(dt: number) {
    this.time += dt;
    this.camX += (this.camGoal - this.camX) * Math.min(1, dt * 2.5);
    // The villager walks along to whichever target is being worked on.
    const npcGoal = (this.targets.find((t) => !t.done) ?? this.targets.at(-1)!).x + 90;
    this.npcX += (npcGoal - this.npcX) * Math.min(1, dt * 1.5);
    this.wandKick = Math.max(0, this.wandKick - dt * 3);
    this.wandDroop = Math.max(0, this.wandDroop - dt * 1.5);
    this.jump = Math.max(0, this.jump - dt * 2.4);

    for (const b of this.bolts) b.t += dt / 0.38;
    for (const b of this.bolts.filter((b) => b.t >= 1)) this.hit(b);
    this.bolts = this.bolts.filter((b) => b.t < 1);

    for (const t of this.targets) {
      t.shake = Math.max(0, t.shake - dt * 3);
      t.hop = Math.max(0, t.hop - dt * 2);
      if (t.done && !t.def.done) t.vanish = Math.min(1, t.vanish + dt * 1.6);
      if (this.celebrating && this.setup.lesson.scene.mode === 'battle') t.hop = t.hop || (Math.sin(this.time * 8) > 0.9 ? 1 : 0);
    }
    for (const h of this.helpers) h.t += dt / 1.4;
    this.helpers = this.helpers.filter((h) => h.t < 1);

    for (const p of this.particles) {
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += p.gravity * dt;
      p.life -= dt;
    }
    this.particles = this.particles.filter((p) => p.life > 0);
    for (const f of this.floaters) {
      f.y -= 22 * dt;
      f.life -= dt;
    }
    this.floaters = this.floaters.filter((f) => f.life > 0);
  }

  private hit(b: Bolt) {
    const t = b.target;
    const sx = t.x - this.camX;
    const cy = t.y - this.targetHeight(t) / 2;
    t.shake = 0.6 + b.power * 0.4;
    this.burst(sx, cy, Math.round(10 + 22 * b.power), SPARKS, 70 * b.power + 20);
    if (this.setup.lesson.scene.mode === 'battle') {
      this.floaters.push({ text: '♥', x: sx + rand(-14, 14), y: cy - 20, life: 0.9, color: '#ff6b8a' });
    }
    if (!t.done && this.countLanded(t) >= t.need) this.finishTarget(t);
  }

  /** Hits that have actually arrived (cast() counts them early). */
  private countLanded(t: TargetState) {
    return t.hits - this.bolts.filter((b) => b.target === t && b.t < 1).length;
  }

  private finishTarget(t: TargetState) {
    t.done = true;
    t.hop = 1;
    const sx = t.x - this.camX;
    const cy = t.y - this.targetHeight(t) / 2;
    this.burst(sx, cy, 40, SPARKS, 110, -20, 2);
    if (t.def.helper) this.helpers.push({ sprite: t.def.helper, target: t, t: 0 });
    const next = this.targets.find((o) => !o.done);
    if (next) setTimeout(() => (this.camGoal = this.camFor(next)), 500);
  }

  // ---------- drawing ----------

  private draw() {
    const c = this.ctx;
    c.setTransform(K, 0, 0, K, 0, 0);
    c.imageSmoothingEnabled = false;
    if (this.loc.indoor) this.drawRoom();
    else this.drawOutdoors();

    const npc = this.setup.lesson.scene.npc;
    if (npc) {
      const walking = Math.abs(this.npcX - ((this.targets.find((t) => !t.done) ?? this.targets.at(-1)!).x + 90)) > 2;
      const bob = walking ? Math.round(Math.abs(Math.sin(this.time * 9)) * 2) : Math.sin(this.time * 2) > 0.6 ? 1 : 0;
      this.drawSprite(npc, this.npcX - this.camX, GROUND + 2, { bob });
    }

    for (const t of this.targets) this.drawTarget(t);
    this.drawWizard();
    this.drawBolts();
    this.drawHelpers();
    for (const p of this.particles) {
      c.globalAlpha = Math.min(1, p.life / p.max * 2);
      c.fillStyle = p.color;
      c.fillRect(Math.round(p.x), Math.round(p.y), p.size, p.size);
    }
    c.globalAlpha = 1;
    this.drawFloaters();
  }

  private drawRoom() {
    const c = this.ctx;
    const bg = sprite('backgrounds/tower');
    c.fillStyle = '#7a6a66';
    c.fillRect(0, 0, VIEW_W, VIEW_H);
    c.save();
    c.translate(-Math.round(this.camX * K) / K, 0);
    // The background has two pixels per room pixel, which is one per canvas pixel here.
    if (bg) c.drawImage(bg, 0, ROOM_SHIFT, ROOM_W, ROOM_H);
    const windowIsTarget = this.targets.some((t) => t.def.sprite.startsWith('windows/'));
    if (this.setup.windowSprite && !windowIsTarget) this.drawSprite(this.setup.windowSprite, WINDOW_SPOT.x, WINDOW_SPOT.y + ROOM_SHIFT, {});
    const room = [...(this.setup.room ?? [])].sort((a, b) => layer(a) - layer(b) || a.y - b.y);
    for (const p of room) {
      const it = item(p.item);
      if (it?.sprite) this.drawSprite(it.sprite, p.x, p.y + ROOM_SHIFT, { flip: p.flip });
    }
    // Other unfinished mess, greyed out: it belongs to other lessons.
    c.save();
    c.filter = 'grayscale(1) brightness(0.85)';
    c.globalAlpha = 0.55;
    for (const m of this.setup.clutter ?? []) this.drawSprite(m.sprite, m.x, m.y + ROOM_SHIFT, {});
    c.restore();
    c.restore();
  }

  private drawOutdoors() {
    const c = this.ctx;
    const L = this.loc;
    const g = c.createLinearGradient(0, 0, 0, GROUND);
    g.addColorStop(0, L.sky[0]);
    g.addColorStop(1, L.sky[1]);
    c.fillStyle = g;
    c.fillRect(0, 0, VIEW_W, VIEW_H);

    // Clouds
    c.fillStyle = 'rgba(255,255,255,0.85)';
    for (let i = 0; i < 5; i++) {
      const x = mod(i * 137 - this.camX * 0.08 + this.time * 4, VIEW_W + 80) - 40;
      const y = 18 + ((i * 53) % 50);
      pixelBlob(c, x, y, 22 + (i % 3) * 8, 6);
    }

    this.drawHills(L.hills[0], 0.15, 120, 18, 0.011);
    this.drawHills(L.hills[1], 0.3, 140, 14, 0.019);

    for (const p of this.props.far) this.drawSprite(p.s, p.x - this.camX * 0.55, GROUND - 16, {});
    c.fillStyle = hazeOf(L.sky[1]);
    c.fillRect(0, 0, VIEW_W, GROUND);

    // Ground
    c.fillStyle = L.grass;
    c.fillRect(0, GROUND - 8, VIEW_W, VIEW_H);
    c.fillStyle = L.path;
    c.fillRect(0, GROUND - 2, VIEW_W, 10);
    c.fillStyle = 'rgba(0,0,0,0.12)';
    for (let x = -mod(this.camX, 9); x < VIEW_W; x += 9) c.fillRect(Math.round(x), GROUND - 8, 2, 2);
    for (let x = -mod(this.camX, 13); x < VIEW_W; x += 13) c.fillRect(Math.round(x), GROUND + 3, 3, 1);

    if (L.river) {
      const rx = this.targets[0].x - this.camX;
      c.fillStyle = '#4f9fe0';
      c.fillRect(rx - 80, GROUND - 4, 160, VIEW_H);
      c.fillStyle = '#9fd6ff';
      for (let i = 0; i < 6; i++) c.fillRect(rx - 70 + i * 26 + Math.round(Math.sin(this.time * 2 + i) * 3), GROUND + 6 + (i % 2) * 4, 8, 1);
      this.drawSprite('props/bridge', rx, GROUND + 10, {});
    }
    for (const p of this.props.near) this.drawSprite(p.s, p.x - this.camX, GROUND - 3, {});
  }

  private drawHills(color: string, parallax: number, base: number, amp: number, freq: number) {
    const c = this.ctx;
    c.fillStyle = color;
    for (let x = 0; x < VIEW_W; x += 2) {
      const wx = x + this.camX * parallax;
      const h = base - amp * (Math.sin(wx * freq) + 0.5 * Math.sin(wx * freq * 2.3 + 1));
      c.fillRect(x, Math.round(h), 2, GROUND - h);
    }
  }

  private targetHeight(t: TargetState) {
    return sprite(t.def.sprite)?.height ?? 40;
  }

  private drawTarget(t: TargetState) {
    const c = this.ctx;
    const battle = this.setup.lesson.scene.mode === 'battle';
    if (t.vanish >= 1) return;
    const landed = this.countLanded(t);
    const s = idleFrame(t.done && t.def.done ? t.def.done : t.def.sprite, this.time, t.x * 0.37);
    let x = t.x - this.camX + (t.shake > 0 ? Math.round(Math.sin(this.time * 70) * 2 * t.shake) : 0);
    const y = t.y - Math.round(Math.sin(t.hop * Math.PI) * 8);
    if (battle && this.celebrating) x += Math.round(Math.sin(this.time * 3) * 2);

    if (t.done && t.def.glow) {
      const img = sprite(s);
      const gy = y - (img?.height ?? 40) + 12;
      const r = 26 + Math.sin(this.time * 4) * 2;
      const g = c.createRadialGradient(x, gy, 2, x, gy, r);
      g.addColorStop(0, 'rgba(255,190,60,0.95)');
      g.addColorStop(0.5, 'rgba(255,160,40,0.45)');
      g.addColorStop(1, 'rgba(255,140,30,0)');
      c.fillStyle = g;
      c.fillRect(x - r, gy - r, r * 2, r * 2);
      if (Math.random() < 0.08) this.burst(x, gy, 1, ['#ffe066', '#fff7b0'], 12, -8);
    }

    c.globalAlpha = 1 - t.vanish;
    const scale = 1 - t.vanish * 0.6;
    this.drawSprite(s, x, y, { scale });
    c.globalAlpha = 1;

    // Progress pips (hearts in battles) above unfinished targets.
    if (!t.done && t.need > 1 && t === this.targets[this.current]) {
      const top = Math.max(4, y - this.targetHeight(t) - 10); // tall targets (the window) reach past the top of the view
      const w = t.need * 8;
      for (let i = 0; i < t.need; i++) {
        const px = Math.round(x - w / 2 + i * 8);
        if (battle) drawHeart(c, px, top, i < landed);
        else drawPip(c, px + 1, top + 1, i < landed);
      }
    }
  }

  private drawWizard() {
    const c = this.ctx;
    const walking = Math.abs(this.camGoal - this.camX) > 2;
    // The walk frames lift the body themselves; standing still, the wizard breathes.
    const bob = walking ? 0 : Math.sin(this.time * 2.2) > 0.4 ? 1 : 0;
    const body = walking ? this.walk[Math.floor(this.time * WALK_FPS) % this.walk.length] : this.setup.wizard;
    const jump = Math.round(Math.sin(this.jump * Math.PI) * 14);
    const top = GROUND - WIZ.feetY - WIZ.padTop - bob - jump;
    const left = WIZ_X - WIZ.headX;

    if (this.setup.pet) {
      // Sit while the wizard casts; walk, hop or fly along when the wizard walks.
      const motion = petMotion(this.setup.pet);
      let frame = this.setup.pet;
      let lift = Math.sin(this.time * 1.3) > 0.97 ? 3 : 0;
      if (walking && motion) {
        frame = motion.move[Math.floor(this.time * motion.fps) % motion.move.length];
        lift = motion.style === 'fly' ? 16 + Math.round(Math.sin(this.time * 6) * 3) : motion.style === 'hop' ? Math.round(Math.abs(Math.sin(this.time * 6)) * 6) : 0;
      }
      this.drawSprite(frame, WIZ_X - 52, GROUND - lift - Math.round(jump / 2), {});
    }
    c.fillStyle = 'rgba(0,0,0,0.15)';
    c.fillRect(WIZ_X - 22, GROUND - 2, 44, 3);
    c.drawImage(body, left, top, WIZ_CANVAS.w, WIZ_CANVAS.h);

    const wand = sprite(this.setup.wand);
    if (wand) drawWand(c, wand, left + WIZ.handX, top + WIZ.padTop + WIZ.handY, this.wandAngle(), !!this.setup.staff);
  }

  private wandAngle() {
    // A staff rests upright and tips forward to cast; a wand flicks.
    const staff = !!this.setup.staff;
    return wandRest(staff) + this.wandKick * (staff ? 0.45 : 0.7) - this.wandDroop * (staff ? 0.25 : 0.6) + Math.sin(this.time * 2) * (staff ? 0.01 : 0.03);
  }

  /** Wand tip in screen coordinates. */
  private wandTip(): [number, number] {
    const hx = WIZ_X - WIZ.headX + WIZ.handX;
    const hy = GROUND - WIZ.feetY + WIZ.handY;
    return wandTipAt(sprite(this.setup.wand), hx, hy, this.wandAngle(), !!this.setup.staff);
  }

  private drawBolts() {
    const c = this.ctx;
    for (const b of this.bolts) {
      const tx = b.target.x - this.camX;
      const ty = b.target.y - this.targetHeight(b.target) / 2;
      const x0 = b.x0 - this.camX;
      const x = x0 + (tx - x0) * b.t;
      const y = b.y0 + (ty - b.y0) * b.t - Math.sin(b.t * Math.PI) * 30;
      const r = 2 + b.power * 3;
      c.fillStyle = this.setup.sparkle;
      c.fillRect(Math.round(x - r), Math.round(y - r), r * 2, r * 2);
      c.fillStyle = '#ffffff';
      c.fillRect(Math.round(x - r / 2), Math.round(y - r / 2), r, r);
      this.particles.push({ x, y, vx: rand(-15, 15), vy: rand(-15, 15), life: 0.35, max: 0.35, color: pick(SPARKS), size: 1 + Math.round(b.power), gravity: 0 });
    }
  }

  private drawHelpers() {
    for (const h of this.helpers) {
      const tx = h.target.x - this.camX;
      // Swoop in from the right, sweep back and forth over the target, fly off.
      const t = h.t;
      const x = t < 0.3 ? tx + 160 * (1 - t / 0.3) : t < 0.8 ? tx + Math.sin((t - 0.3) * 30) * 16 : tx - 200 * ((t - 0.8) / 0.2);
      const y = h.target.y + 4 - Math.round(Math.abs(Math.sin(t * 20)) * 4);
      this.drawSprite(h.sprite, x, y, { flip: t > 0.8 });
      if (t > 0.3 && t < 0.8 && Math.random() < 0.5) this.burst(x, y - 4, 1, ['#b5aca0', '#d8d0c4'], 25, -5);
    }
  }

  private drawFloaters() {
    const c = this.ctx;
    c.save();
    c.setTransform(1, 0, 0, 1, 0, 0);
    c.textAlign = 'center';
    for (const f of this.floaters) {
      c.globalAlpha = Math.min(1, f.life * 2);
      c.font = `bold ${f.text.length > 1 ? 30 : 26}px system-ui, sans-serif`;
      c.lineWidth = 6;
      c.strokeStyle = '#3a2a4a';
      c.strokeText(f.text, f.x * K, f.y * K);
      c.fillStyle = f.color;
      c.fillText(f.text, f.x * K, f.y * K);
    }
    c.restore();
  }

  private drawSprite(path: string, x: number, footY: number, o: { flip?: boolean; scale?: number; bob?: number }) {
    const img = sprite(path);
    if (!img) {
      void loadSprite(path).catch(() => undefined);
      return;
    }
    const s = o.scale ?? 1;
    const w = img.width * s;
    const h = img.height * s;
    const c = this.ctx;
    const dx = Math.round(x - w / 2);
    const dy = Math.round(footY - h - (o.bob ?? 0));
    if (o.flip) {
      c.save();
      c.translate(dx + w, dy);
      c.scale(-1, 1);
      c.drawImage(img, 0, 0, w, h);
      c.restore();
    } else c.drawImage(img, dx, dy, w, h);
  }

  private burst(x: number, y: number, n: number, colors: string[], speed: number, gravity = 40, size = 1) {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2;
      const v = speed * (0.4 + Math.random() * 0.6);
      const life = 0.4 + Math.random() * 0.5;
      this.particles.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life, max: life, color: pick(colors), size: size + (Math.random() < 0.3 ? 1 : 0), gravity });
    }
  }

  private confetti() {
    const colors = ['#ff6b8a', '#ffd166', '#06d6a0', '#4cc9f0', '#b388ff'];
    this.particles.push({ x: rand(0, VIEW_W), y: -4, vx: rand(-20, 20), vy: rand(20, 60), life: 2.5, max: 2.5, color: pick(colors), size: 2, gravity: 30 });
  }
}

// ---------- helpers ----------

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
const rand = (a: number, b: number) => a + Math.random() * (b - a);
const pick = <T,>(l: T[]) => l[Math.floor(Math.random() * l.length)];
const mod = (a: number, n: number) => ((a % n) + n) % n;
const LAYERS: Record<string, number> = { window: 0, rug: 0, wall: 1, furniture: 2, decor: 3 };
export const layer = (p: Placement) => LAYERS[item(p.item)?.category ?? 'decor'] ?? 3;

function hazeOf(color: string) {
  const n = parseInt(color.slice(1), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},0.4)`;
}

function pixelBlob(c: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
  c.fillRect(Math.round(x), Math.round(y), w, h);
  c.fillRect(Math.round(x + w * 0.2), Math.round(y - h * 0.6), Math.round(w * 0.5), h);
}

const HEART = ['.##.##.', '#######', '#######', '.#####.', '..###..', '...#...'];
function drawHeart(c: CanvasRenderingContext2D, x: number, y: number, full: boolean) {
  HEART.forEach((row, j) =>
    [...row].forEach((ch, i) => {
      if (ch !== '#') return;
      c.fillStyle = full ? '#ff5c7a' : '#ffffff';
      c.fillRect(x + i, y + j, 1, 1);
    }),
  );
}

function drawPip(c: CanvasRenderingContext2D, x: number, y: number, full: boolean) {
  c.fillStyle = '#3a2a4a';
  c.fillRect(x - 1, y - 1, 6, 6);
  c.fillStyle = full ? '#ffd166' : '#ffffff';
  c.fillRect(x, y, 4, 4);
}
