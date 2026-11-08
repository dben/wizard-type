/**
 * Playing a lesson: intro card -> type each spell -> results.
 * Game rules live in game/; this screen wires keys to them and to the scene.
 */
import { useEffect, useMemo, useRef, useState } from 'preact/hooks';
import { sfx } from '../../audio/sfx';
import { currentProfile, go, update } from '../../app/store';
import { LESSONS, lessonInfo, type LessonInfo } from '../../content/curriculum';
import { item } from '../../content/items';
import { generateSpells } from '../../game/generator';
import { strokeFor } from '../../game/keyboard';
import { finishLesson, roomClutter, windowSprite, type LessonOutcome } from '../../game/progress';
import { isCreature } from '../../content/world/room';
import { createRng } from '../../game/rng';
import type { Profile } from '../../game/save';
import { scoreLesson, type LessonScore } from '../../game/scoring';
import { Spell, type SpellResult } from '../../game/spell';
import { bodyCanvas } from '../../render/portrait';
import { LessonScene } from '../../render/scene';
import { Keyboard } from '../components/Keyboard';
import { Icon, Sprite } from '../components/Sprite';
import { Button } from '../components/bits';
import { Results } from './Results';

type Phase = 'intro' | 'play' | 'cheer' | 'done';

const IGNORE_MODIFIERS = (e: KeyboardEvent) => e.ctrlKey || e.metaKey || e.altKey;

export function LessonScreen({ lessonId }: { lessonId: string }) {
  const info = lessonInfo(lessonId)!;
  const [round, setRound] = useState(0); // bump to replay
  return <LessonRun key={`${lessonId}-${round}`} info={info} onReplay={() => setRound((r) => r + 1)} />;
}

function LessonRun({ info, onReplay }: { info: LessonInfo; onReplay: () => void }) {
  const profile = currentProfile()!;
  const { lesson } = info;
  const spells = useMemo(
    () => generateSpells(lesson.recipes, { allowed: info.allowed, focus: info.focus, rng: createRng(Date.now()) }),
    [],
  );
  const mode = info.canFix ? 'fix' : 'poof';
  const [phase, setPhase] = useState<Phase>('intro');
  const [index, setIndex] = useState(0);
  const spell = useRef(new Spell(spells[0], mode));
  const results = useRef<SpellResult[]>([]);
  const scene = useRef<LessonScene | null>(null);
  const [, rerender] = useState(0);
  const [pressed, setPressed] = useState<Set<string>>(new Set());
  const [caps, setCaps] = useState(false);
  const [shake, setShake] = useState(0);
  const [result, setResult] = useState<{ outcome: LessonOutcome; score: LessonScore }>();

  // Keyboard input.
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (IGNORE_MODIFIERS(e)) return;
      setCaps(e.getModifierState?.('CapsLock') ?? false);
      setPressed((s) => new Set(s).add(e.code));
      if (e.key === 'Escape') return go({ name: 'map' });
      if (phase === 'intro') {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          setPhase('play');
        }
        return;
      }
      if (phase !== 'play') return;
      if (e.key.length === 1 || e.key === 'Backspace') e.preventDefault();
      const s = spell.current;
      const ev = s.press(e.key, performance.now());
      const sc = scene.current;
      switch (ev.type) {
        case 'correct':
          sfx.key(s.typed.length);
          sc?.keySparkle();
          break;
        case 'wrong':
          sfx.oops();
          sc?.oops();
          break;
        case 'poof':
          sfx.poof();
          sc?.poof();
          setShake((n) => n + 1);
          break;
        case 'blocked':
          sfx.oops();
          setShake((n) => n + 1);
          break;
        case 'erase':
          sfx.erase();
          break;
        case 'cast':
          sfx.cast(ev.result.potency);
          sc?.cast(ev.result.potency);
          results.current.push(ev.result);
          if (index + 1 < spells.length) {
            spell.current = new Spell(spells[index + 1], mode);
            setIndex(index + 1);
          } else {
            setPhase('cheer');
          }
          break;
      }
      rerender((n) => n + 1);
    };
    const up = (e: KeyboardEvent) =>
      setPressed((s) => {
        const n = new Set(s);
        n.delete(e.code);
        return n;
      });
    const blur = () => setPressed(new Set());
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    window.addEventListener('blur', blur);
    return () => {
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
      window.removeEventListener('blur', blur);
    };
  }, [phase, index]);

  // Finish: cheer in the scene, then score and save.
  useEffect(() => {
    if (phase !== 'cheer') return;
    void (async () => {
      sfx.win();
      await scene.current?.celebrate();
      const score = scoreLesson(results.current, lesson.goalWpm);
      const outcome = finishLesson(currentProfile()!, lesson.id, score);
      update(() => outcome.profile);
      setResult({ outcome, score });
      setPhase('done');
    })();
  }, [phase]);

  const s = spell.current;
  const next = phase === 'play' ? s.expected : '';

  return (
    <main class="screen lesson">
      <div class="lesson-top">
        <Button onClick={() => go({ name: 'map' })} icon="back" title="Back to map" class="quit" />
        <div class="lesson-title">
          <small>Lesson {info.index + 1}</small> {lesson.title}
        </div>
        <SpellDots total={spells.length} done={results.current.length} />
        <button
          class={`icon-btn hands-toggle ${profile.settings.hands ? 'on' : ''}`}
          title={profile.settings.hands ? 'Hide hands' : 'Show hands'}
          onClick={() => update((p) => ({ ...p, settings: { ...p.settings, hands: !p.settings.hands } }))}
        >
          <Icon name="hand" size={28} />
        </button>
      </div>

      <SceneView info={info} profile={profile} spells={spells.length} onReady={(sc) => (scene.current = sc)} />

      <div class="prompt-area">
        {phase === 'play' && <Prompt spell={s} shake={shake} />}
        {caps && phase === 'play' && <div class="caps-warning">Caps Lock is on!</div>}
        {phase === 'play' && s.wrongAt >= 0 && <div class="hint">Press ⌫ to fix it</div>}
      </div>

      <Keyboard
        next={next}
        pressed={pressed}
        allowed={info.allowed}
        canFix={info.canFix}
        hands={profile.settings.hands && phase === 'play'}
        skin={profile.look.skin}
      />

      {phase === 'intro' && <Intro info={info} onStart={() => setPhase('play')} />}
      {phase === 'done' && result && (
        <Results info={info} outcome={result.outcome} score={result.score} onReplay={onReplay} />
      )}
    </main>
  );
}

function SceneView({ info, profile, spells, onReady }: { info: LessonInfo; profile: Profile; spells: number; onReady: (s: LessonScene) => void }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    let sc: LessonScene | null = null;
    let dead = false;
    void (async () => {
      const wizard = await bodyCanvas(profile.look, profile.equipped);
      if (dead || !ref.current) return;
      sc = new LessonScene(ref.current, {
        lesson: info.lesson,
        spells,
        wizard,
        wand: item(profile.equipped.wand)?.sprite ?? 'wands/twig',
        pet: profile.equipped.pet ? (item(profile.equipped.pet)?.sprite ?? null) : null,
        sparkle: item(profile.equipped.robe)?.robe?.trim ?? '#ffd166',
        room: profile.room,
        windowSprite: windowSprite(profile),
        clutter: roomClutter(profile).filter((c) => !isCreature(c) && c.until !== info.lesson.id),
      });
      await sc.load();
      if (dead) return;
      sc.start();
      onReady(sc);
    })();
    return () => {
      dead = true;
      sc?.stop();
    };
  }, []);
  return (
    <div class="scene-wrap">
      <canvas ref={ref} class="scene px" />
    </div>
  );
}

function Prompt({ spell, shake }: { spell: Spell; shake: number }) {
  const chars = [...spell.text];
  const at = spell.typed.length;
  return (
    <div class={`prompt ${shake % 2 ? 'shake-a' : shake ? 'shake-b' : ''} ${spell.mode === 'fix' && spell.mistakes ? 'weaker' : ''}`} aria-live="polite">
      {chars.map((c, i) => {
        let cls = 'todo';
        if (i < at) cls = i === spell.wrongAt ? 'wrong' : 'done';
        else if (i === at && spell.wrongAt < 0) cls = 'current';
        const shown = i === spell.wrongAt ? spell.typed[i] : c;
        return (
          <span key={i} class={`ch ${cls} ${c === ' ' ? 'space' : ''}`}>
            {shown === ' ' ? ' ' : shown}
          </span>
        );
      })}
    </div>
  );
}

function SpellDots({ total, done }: { total: number; done: number }) {
  return (
    <div class="spell-dots" aria-label={`${done} of ${total} spells`}>
      {Array.from({ length: total }, (_, i) => (
        <span key={i} class={i < done ? 'on' : ''} />
      ))}
    </div>
  );
}

function KeyCap({ k }: { k: string }) {
  const label = k === ' ' ? 'Space' : k === 'Backspace' ? '⌫ Oops' : k === 'Shift' ? '⇧ Shift' : k.toUpperCase();
  return <span class={`keycap ${label.length > 1 ? 'wide' : ''}`}>{label}</span>;
}

function Intro({ info, onStart }: { info: LessonInfo; onStart: () => void }) {
  const { lesson } = info;
  const target = lesson.scene.targets[0].sprite;
  const shiftHint = lesson.newKeys.some((k) => k.length === 1 && strokeFor(k)?.shift);
  return (
    <div class="overlay">
      <div class="panel intro">
        <div class="intro-pic">
          <Sprite path={target} fit={120} />
        </div>
        <h2>{lesson.title}</h2>
        {lesson.newKeys.length > 0 && (
          <div class="new-keys">
            {lesson.newKeys.map((k) => (
              <KeyCap key={k} k={k} />
            ))}
            {shiftHint && <KeyCap k="Shift" />}
          </div>
        )}
        <p class="intro-text">{lesson.intro}</p>
        {info.introducesBackspace && <p class="small">Mistakes make spells weaker. Fix them with ⌫!</p>}
        <Button kind="primary" icon="check" onClick={onStart}>
          Start
        </Button>
        <p class="small muted">or press Enter</p>
      </div>
    </div>
  );
}

export const lessonNumber = (id: string) => (LESSONS.find((l) => l.lesson.id === id)?.index ?? 0) + 1;
