import { useEffect } from 'preact/hooks';
import { sfx } from '../../audio/sfx';
import { go } from '../../app/store';
import { LESSONS, type LessonInfo } from '../../content/curriculum';
import { ITEMS, item } from '../../content/items';
import type { LessonOutcome } from '../../game/progress';
import { THREE_STAR_ACCURACY, type LessonScore } from '../../game/scoring';
import { Icon, Sprite } from '../components/Sprite';
import { Button, Gold, Stars } from '../components/bits';

interface Props {
  info: LessonInfo;
  outcome: LessonOutcome;
  score: LessonScore;
  onReplay: () => void;
}

export function Results({ info, outcome, score, onReplay }: Props) {
  const { lesson } = info;
  const next = LESSONS[info.index + 1];
  const newInShop = outcome.firstWin ? ITEMS.filter((i) => i.unlock === lesson.id) : [];

  useEffect(() => {
    const timers = Array.from({ length: score.stars }, (_, i) => setTimeout(() => sfx.star(i), 400 + i * 450));
    timers.push(setTimeout(() => outcome.payout.total > 0 && sfx.coin(), 400 + score.stars * 450));
    const key = (e: KeyboardEvent) => {
      if (e.key === 'Enter') next ? go({ name: 'lesson', lessonId: next.lesson.id }) : go({ name: 'map' });
    };
    const t = setTimeout(() => window.addEventListener('keydown', key), 800);
    return () => {
      timers.forEach(clearTimeout);
      clearTimeout(t);
      window.removeEventListener('keydown', key);
    };
  }, []);

  const speedOk = score.wpm >= lesson.goalWpm;
  const aimOk = score.accuracy >= THREE_STAR_ACCURACY;

  return (
    <div class="overlay">
      <div class="panel results">
        <h2>{outcome.firstWin ? lesson.outro : 'Well done!'}</h2>
        <div class="big-stars">
          <Stars count={score.stars} size={64} />
        </div>

        <div class="meters">
          <Meter label="Aim" value={score.accuracy} goal={THREE_STAR_ACCURACY} ok={aimOk} />
          <Meter label="Speed" value={Math.min(1, score.wpm / (lesson.goalWpm * 1.5))} goal={1 / 1.5} ok={speedOk} />
        </div>
        {score.stars < 3 && <p class="small">{!aimOk ? 'Fewer oopsies for the next star!' : 'A little faster for the next star!'}</p>}

        <div class="loot">
          {outcome.payout.total > 0 && (
            <div class="loot-item">
              <Gold amount={outcome.payout.total} size={36} />
              <small>
                {outcome.payout.newStars.length > 0 && `${outcome.payout.starGold} for stars`}
                {outcome.payout.newStars.length > 0 && outcome.payout.spellGold > 0 && ' + '}
                {outcome.payout.spellGold > 0 && `${outcome.payout.spellGold} perfect spells`}
              </small>
            </div>
          )}
          {outcome.gifts.map((g) => {
            const it = item(g)!;
            return (
              <div class="loot-item gift" key={g}>
                <Sprite path={it.sprite ?? 'ui/gift'} fit={64} />
                <small>New! {it.name}</small>
              </div>
            );
          })}
        </div>

        {newInShop.length > 0 && (
          <div class="new-shop">
            <small>New in the shop:</small>
            <div class="new-shop-row">
              {newInShop.map((i) => (i.sprite ? <Sprite key={i.id} path={i.sprite} fit={40} /> : <span key={i.id} class="robe-dot" style={{ background: i.robe?.main }} />))}
            </div>
          </div>
        )}

        <div class="big-choices">
          <button class="big-choice" onClick={() => go({ name: 'room' })}>
            <Icon name="home" size={48} />
            <b>Room</b>
          </button>
          <button class="big-choice" onClick={() => go({ name: 'shop' })}>
            <Icon name="bag" size={48} />
            <b>Shop</b>
          </button>
          {next && (
            <button class="big-choice go" onClick={() => go({ name: 'lesson', lessonId: next.lesson.id })}>
              <span class="big-arrow">➜</span>
              <b>Next</b>
            </button>
          )}
        </div>
        <div class="row center">
          <Button onClick={onReplay}>Again</Button>
          <Button onClick={() => go({ name: 'map' })} icon="map">
            Map
          </Button>
        </div>
      </div>
    </div>
  );
}

function Meter({ label, value, goal, ok }: { label: string; value: number; goal: number; ok: boolean }) {
  return (
    <div class="meter">
      <span class="meter-label">{label}</span>
      <div class="meter-bar">
        <div class={`meter-fill ${ok ? 'ok' : ''}`} style={{ width: `${Math.round(Math.max(0.04, value) * 100)}%` }} />
        <div class="meter-goal" style={{ left: `${goal * 100}%` }} />
      </div>
    </div>
  );
}
