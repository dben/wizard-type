import { setSound } from '../../audio/sfx';
import { currentProfile, go, update, useGame, type Screen } from '../../app/store';
import { WizardPortrait } from './WizardPortrait';
import { Icon } from './Sprite';
import { Gold } from './bits';

const NAV: { screen: Screen['name']; icon: string; label: string }[] = [
  { screen: 'map', icon: 'map', label: 'Map' },
  { screen: 'room', icon: 'home', label: 'Room' },
  { screen: 'wardrobe', icon: 'hanger', label: 'Clothes' },
  { screen: 'shop', icon: 'bag', label: 'Shop' },
];

export function TopBar() {
  const { screen } = useGame();
  const p = currentProfile();
  if (!p) return null;
  return (
    <header class="topbar">
      <button class="who" onClick={() => go({ name: 'profiles' })} title="Switch wizard">
        <span class="who-face">
          <WizardPortrait look={p.look} equipped={p.equipped} scale={0.5} />
        </span>
        <span class="who-name">{p.name}</span>
      </button>
      <nav class="nav">
        {NAV.map((n) => (
          <button key={n.screen} class={`nav-btn ${screen.name === n.screen ? 'on' : ''}`} onClick={() => go({ name: n.screen } as Screen)}>
            <Icon name={n.icon} size={30} />
            <span>{n.label}</span>
          </button>
        ))}
      </nav>
      <div class="right">
        <Gold amount={p.gold} size={26} />
        <button
          class="icon-btn"
          title={p.settings.sound ? 'Sound off' : 'Sound on'}
          onClick={() => {
            setSound(!p.settings.sound);
            update((x) => ({ ...x, settings: { ...x.settings, sound: !x.settings.sound } }));
          }}
        >
          <Icon name={p.settings.sound ? 'sound-on' : 'sound-off'} size={28} />
        </button>
      </div>
    </header>
  );
}
