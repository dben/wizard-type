/**
 * The full course, in order. Lessons unlock one after another.
 * Each lesson's allowed keys = every key introduced up to and including it.
 */
import { chapter1 } from './lessons/ch1-tower';
import { chapter2 } from './lessons/ch2-repair';
import { chapter3 } from './lessons/ch3-village';
import { chapter4 } from './lessons/ch4-capitals';
import { chapter5 } from './lessons/ch5-dragon';
import type { ChapterDef, LessonDef } from './types';

export const CHAPTERS: readonly ChapterDef[] = [chapter1, chapter2, chapter3, chapter4, chapter5];

export interface LessonInfo {
  lesson: LessonDef;
  chapter: ChapterDef;
  /** 0-based position in the whole course. */
  index: number;
  /** Every character the lesson may ask for. */
  allowed: ReadonlySet<string>;
  /** Characters introduced in this lesson. */
  focus: string[];
  /** Backspace has been learned (mistakes can be fixed instead of poofing). */
  canFix: boolean;
  /** This lesson introduces Backspace. */
  introducesBackspace: boolean;
}

function buildInfo(): LessonInfo[] {
  const chars = new Set<string>();
  let shift = false;
  let backspace = false;
  const out: LessonInfo[] = [];
  for (const chapter of CHAPTERS) {
    for (const lesson of chapter.lessons) {
      const focus: string[] = [];
      for (const k of lesson.newKeys) {
        if (k === 'Shift') shift = true;
        else if (k === 'Backspace') backspace = true;
        else {
          chars.add(k);
          focus.push(k);
        }
      }
      const allowed = new Set(chars);
      if (shift) for (const c of chars) if (/[a-z]/.test(c)) allowed.add(c.toUpperCase());
      out.push({
        lesson,
        chapter,
        index: out.length,
        allowed,
        focus,
        canFix: backspace,
        introducesBackspace: lesson.newKeys.includes('Backspace'),
      });
    }
  }
  return out;
}

export const LESSONS: readonly LessonInfo[] = buildInfo();

const byId = new Map(LESSONS.map((l) => [l.lesson.id, l]));
export const lessonInfo = (id: string) => byId.get(id);
