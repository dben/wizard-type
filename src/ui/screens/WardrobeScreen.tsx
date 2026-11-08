import { useState } from 'preact/hooks';
import { sfx } from '../../audio/sfx';
import { currentProfile, go, update } from '../../app/store';
import { item } from '../../content/items';
import type { ItemDef } from '../../content/types';
import { equip } from '../../game/progress';
import type { Equipped } from '../../game/save';
import { Sprite } from '../components/Sprite';
import { WizardPortrait } from '../components/WizardPortrait';
import { Button } from '../components/bits';

type Slot = keyof Equipped;
const TABS: { slot: Slot; label: string }[] = [
  { slot: 'hat', label: 'Hats' },
  { slot: 'robe', label: 'Robes' },
  { slot: 'wand', label: 'Wands' },
  { slot: 'pet', label: 'Pets' },
];

export function WardrobeScreen() {
  const p = currentProfile()!;
  const [slot, setSlot] = useState<Slot>('hat');
  const owned = p.owned.map(item).filter((i): i is ItemDef => !!i && i.category === slot);
  const wear = (id: string | null) => {
    sfx.click();
    update((x) => equip(x, id, slot));
  };
  const pet = p.equipped.pet ? item(p.equipped.pet) : null;

  return (
    <main class="screen wardrobe">
      <div class="wardrobe-preview panel">
        <WizardPortrait look={p.look} equipped={p.equipped} scale={3} />
        {pet?.sprite && (
          <div class="wardrobe-pet">
            <Sprite path={pet.sprite} scale={2} />
          </div>
        )}
        <Button onClick={() => go({ name: 'create', editing: p.id })}>Change look</Button>
      </div>
      <div class="wardrobe-items panel">
        <div class="tabs">
          {TABS.map((t) => (
            <button key={t.slot} class={`tab ${slot === t.slot ? 'on' : ''}`} onClick={() => setSlot(t.slot)}>
              {t.label}
            </button>
          ))}
        </div>
        <div class="item-grid">
          {(slot === 'hat' || slot === 'pet') && (
            <button class={`item-card ${p.equipped[slot] === null ? 'on' : ''}`} onClick={() => wear(null)}>
              <span class="none">✕</span>
              <small>{slot === 'hat' ? 'No hat' : 'No pet'}</small>
            </button>
          )}
          {owned.map((it) => (
            <button key={it.id} class={`item-card ${p.equipped[slot] === it.id ? 'on' : ''}`} onClick={() => wear(it.id)}>
              {it.category === 'robe' ? (
                <WizardPortrait look={p.look} equipped={{ hat: null, wand: p.equipped.wand, robe: it.id }} scale={0.75} />
              ) : (
                <Sprite path={it.sprite!} fit={64} />
              )}
              <small>{it.name}</small>
            </button>
          ))}
          {slot === 'pet' && owned.length === 0 && <p class="small muted">Pets come from big lessons. Keep going!</p>}
        </div>
        <Button onClick={() => go({ name: 'shop' })} icon="bag">
          More in the shop
        </Button>
      </div>
    </main>
  );
}
