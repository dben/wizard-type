import { useState } from 'preact/hooks';
import { sfx } from '../../audio/sfx';
import { currentProfile, update } from '../../app/store';
import { lessonInfo } from '../../content/curriculum';
import { item } from '../../content/items';
import type { ItemCategory } from '../../content/types';
import { buy, equip, shopItems, shopState } from '../../game/progress';
import { Icon, Sprite } from '../components/Sprite';
import { WizardPortrait } from '../components/WizardPortrait';

const TABS: { cat: ItemCategory; label: string }[] = [
  { cat: 'hat', label: 'Hats' },
  { cat: 'robe', label: 'Robes' },
  { cat: 'wand', label: 'Wands' },
  { cat: 'pet', label: 'Pet clothes' },
  { cat: 'furniture', label: 'Furniture' },
  { cat: 'decor', label: 'Little things' },
  { cat: 'wall', label: 'Wall' },
  { cat: 'rug', label: 'Rugs' },
];

const WEAR: Partial<Record<ItemCategory, 'hat' | 'robe' | 'wand' | 'pet'>> = { hat: 'hat', robe: 'robe', wand: 'wand', pet: 'pet' };

export function ShopScreen() {
  const p = currentProfile()!;
  const [tab, setTab] = useState<ItemCategory>('hat');
  const items = shopItems().filter((i) => i.category === tab);
  // Sort: things you can buy first, then too pricey, then locked, then owned.
  const order = { buy: 0, poor: 1, locked: 2, owned: 3 };
  const sorted = [...items].sort((a, b) => order[shopState(p, a)] - order[shopState(p, b)] || a.price - b.price);

  return (
    <main class="screen shop">
      <div class="panel shop-panel">
        <div class="tabs wrap">
          {TABS.map((t) => (
            <button key={t.cat} class={`tab ${tab === t.cat ? 'on' : ''}`} onClick={() => setTab(t.cat)}>
              {t.label}
            </button>
          ))}
        </div>
        <div class="item-grid shop-grid">
          {sorted.map((it) => {
            const state = shopState(p, it);
            const slot = WEAR[it.category];
            const wearing = slot && p.equipped[slot] === it.id;
            return (
              <div key={it.id} class={`item-card shop-card ${state}`}>
                <div class="shop-pic">
                  {it.category === 'robe' ? (
                    <WizardPortrait look={p.look} equipped={{ hat: null, wand: p.equipped.wand, robe: it.id }} scale={0.75} />
                  ) : (
                    <Sprite path={it.sprite!} fit={64} />
                  )}
                </div>
                <small>{it.name}</small>
                {state === 'buy' && (
                  <button
                    class="price"
                    onClick={() => {
                      sfx.buy();
                      update((x) => {
                        const bought = buy(x, it.id);
                        return slot ? equip(bought, it.id, slot) : bought;
                      });
                    }}
                  >
                    <Icon name="coin" size={20} /> {it.price}
                  </button>
                )}
                {state === 'poor' && (
                  <span class="price dim">
                    <Icon name="coin" size={20} /> {it.price}
                  </span>
                )}
                {state === 'locked' && <LockLabel unlock={it.unlock} requires={it.requires} />}
                {state === 'owned' && (
                  <span class="owned">
                    <Icon name="check" size={18} /> {wearing ? 'Wearing' : 'Yours'}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </main>
  );
}

function LockLabel({ unlock, requires }: { unlock?: string; requires?: string }) {
  const info = unlock ? lessonInfo(unlock) : undefined;
  const need = requires ? item(requires) : undefined;
  return (
    <span class="locked-label">
      <Icon name="lock" size={18} />
      {info && !need ? `Lesson ${info.index + 1}` : need ? `Need ${need.name}` : ''}
    </span>
  );
}
