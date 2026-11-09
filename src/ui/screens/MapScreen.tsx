import { go } from '../../app/store';
import { currentProfile } from '../../app/store';
import { CHAPTERS, LESSONS } from '../../content/curriculum';
import { MAP_H, MAP_W, trailPoints } from '../../content/world/mapPath';
import { isDone, isOpen, nextLesson } from '../../game/progress';
import { spriteUrl } from '../../render/sprites';
import { Icon } from '../components/Sprite';
import { Button, Stars } from '../components/bits';

const POINTS = trailPoints(LESSONS.length);

export function MapScreen() {
  const p = currentProfile()!;
  const next = nextLesson(p);
  const allDone = LESSONS.every((l) => isDone(p, l.lesson.id));
  return (
    <main class="screen map-screen">
      <div class="map" style={{ aspectRatio: `${MAP_W} / ${MAP_H}` }}>
        <img class="map-bg" src={spriteUrl('backgrounds/map')} alt="" draggable={false} />
        <svg class="trail" viewBox={`0 0 ${MAP_W} ${MAP_H}`}>
          <polyline points={POINTS.map((pt) => pt.join(',')).join(' ')} />
        </svg>
        {LESSONS.map((info, i) => {
          const [x, y] = POINTS[i];
          const open = isOpen(p, info.lesson.id);
          const rec = p.lessons[info.lesson.id];
          const isNext = info === next && !allDone;
          const firstOfChapter = info.chapter.lessons[0] === info.lesson;
          return (
            <button
              key={info.lesson.id}
              class={`node ${open ? 'open' : 'locked'} ${isNext ? 'next' : ''} ${info.lesson.scene.mode === 'battle' ? 'battle' : ''}`}
              style={{ left: `${(x / MAP_W) * 100}%`, top: `${(y / MAP_H) * 100}%` }}
              onClick={() => open && go({ name: 'lesson', lessonId: info.lesson.id })}
              title={info.lesson.title}
              disabled={!open}
            >
              {firstOfChapter && <span class="chapter-flag">{CHAPTERS.indexOf(info.chapter) + 1}</span>}
              <span class="num">{open ? i + 1 : <Icon name="lock" size={16} />}</span>
              {rec && rec.stars > 0 && (
                <span class="node-stars">
                  <Stars count={rec.stars} size={20} />
                </span>
              )}
            </button>
          );
        })}
      </div>
      <div class="map-footer">
        <div class="next-card">
          <img class="px" src={spriteUrl(next.lesson.scene.targets[0].sprite)} alt="" />
          <div>
            <div class="small">{allDone ? 'You did it all! Play again?' : `Lesson ${next.index + 1}`}</div>
            <b>{next.lesson.title}</b>
          </div>
          <Button kind="primary" icon="check" onClick={() => go({ name: 'lesson', lessonId: next.lesson.id })}>
            Play
          </Button>
        </div>
      </div>
    </main>
  );
}
