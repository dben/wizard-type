import { useState } from 'preact/hooks';
import { sfx } from '../../audio/sfx';
import { currentProfile, go, saveProfile, selectProfile, update } from '../../app/store';
import { HAIR_COLORS, HAIR_STYLES, SKIN_TONES } from '../../content/world/looks';
import { newProfile, type WizardLook } from '../../game/save';
import { WizardPortrait } from '../components/WizardPortrait';
import { Button } from '../components/bits';

const STARTER = { hat: null, robe: 'robe-sky', wand: 'wand-twig' };

export function CreateScreen({ editing }: { editing?: string }) {
  const existing = editing ? currentProfile() : undefined;
  const [name, setName] = useState(existing?.name ?? '');
  const [look, setLook] = useState<WizardLook>(
    existing?.look ?? { hair: 'short', hairColor: HAIR_COLORS[1], skin: SKIN_TONES[1] },
  );
  const set = (patch: Partial<WizardLook>) => {
    sfx.click();
    setLook({ ...look, ...patch });
  };
  const done = () => {
    if (!name.trim()) return;
    if (existing) {
      update((p) => ({ ...p, name: name.trim(), look }));
      go({ name: 'wardrobe' });
    } else {
      const p = newProfile(name, look);
      saveProfile(p);
      selectProfile(p.id);
    }
  };

  return (
    <main class="screen create">
      <h1>{existing ? 'Change your look' : 'Make your wizard'}</h1>
      <div class="create-body">
        <div class="create-preview">
          <WizardPortrait look={look} equipped={existing?.equipped ?? { ...STARTER, hat: 'hat-plain-navy' }} scale={3} />
        </div>
        <div class="create-options">
          <label class="field">
            <span>Name</span>
            <input
              class="name-input"
              maxLength={16}
              value={name}
              placeholder="Your name"
              onInput={(e) => setName(e.currentTarget.value)}
              onKeyDown={(e) => e.key === 'Enter' && done()}
              autoFocus
            />
          </label>
          <div class="field">
            <span>Hair</span>
            <div class="choices">
              {HAIR_STYLES.map((h) => (
                <button key={h} class={`choice hair ${look.hair === h ? 'on' : ''}`} onClick={() => set({ hair: h })} aria-label={h}>
                  <WizardPortrait look={{ ...look, hair: h }} equipped={STARTER} scale={0.75} />
                </button>
              ))}
            </div>
          </div>
          <div class="field">
            <span>Hair color</span>
            <div class="choices">
              {HAIR_COLORS.map((c) => (
                <button key={c} class={`swatch ${look.hairColor === c ? 'on' : ''}`} style={{ background: c }} onClick={() => set({ hairColor: c })} aria-label="hair color" />
              ))}
            </div>
          </div>
          <div class="field">
            <span>Skin</span>
            <div class="choices">
              {SKIN_TONES.map((c) => (
                <button key={c} class={`swatch ${look.skin === c ? 'on' : ''}`} style={{ background: c }} onClick={() => set({ skin: c })} aria-label="skin color" />
              ))}
            </div>
          </div>
          <div class="row">
            <Button onClick={() => go(existing ? { name: 'wardrobe' } : { name: 'profiles' })} icon="back">
              Back
            </Button>
            <Button kind="primary" icon="check" onClick={done} disabled={!name.trim()}>
              {existing ? 'Done' : "Let's go!"}
            </Button>
          </div>
        </div>
      </div>
    </main>
  );
}
