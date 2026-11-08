import { useState } from 'preact/hooks';
import { deleteProfile, go, saveProfile, selectProfile, useGame } from '../../app/store';
import { totalStars } from '../../game/progress';
import { exportCode, importCode } from '../../game/save';
import { WizardPortrait } from '../components/WizardPortrait';
import { Button, Panel, Stars } from '../components/bits';

export function ProfilesScreen() {
  const { save } = useGame();
  const [grownups, setGrownups] = useState(false);
  return (
    <main class="screen profiles">
      <h1 class="logo">Wizard Type</h1>
      <p class="tagline">Type to cast spells!</p>
      <div class="profile-grid">
        {save.profiles.map((p) => (
          <button key={p.id} class="profile-card" onClick={() => selectProfile(p.id)}>
            <WizardPortrait look={p.look} equipped={p.equipped} scale={1.5} />
            <b>{p.name}</b>
            <span class="mini-stars">
              <Stars count={1} of={1} size={18} /> {totalStars(p)}
            </span>
          </button>
        ))}
        <button class="profile-card new" onClick={() => go({ name: 'create' })}>
          <span class="plus">+</span>
          <b>New wizard</b>
        </button>
      </div>
      <button class="link" onClick={() => setGrownups(!grownups)}>
        Grown-ups
      </button>
      {grownups && <GrownUps />}
    </main>
  );
}

function GrownUps() {
  const { save } = useGame();
  const [code, setCode] = useState('');
  const [msg, setMsg] = useState('');
  return (
    <Panel class="grownups">
      <h2>Save codes</h2>
      <p class="small">Progress is saved in this browser. To move a wizard to another computer, copy its code and paste it there.</p>
      {save.profiles.map((p) => (
        <div class="row" key={p.id}>
          <b>{p.name}</b>
          <Button
            onClick={() => {
              void navigator.clipboard?.writeText(exportCode(p));
              setMsg(`Copied ${p.name}'s code.`);
            }}
          >
            Copy code
          </Button>
          <Button
            kind="danger"
            onClick={() => {
              if (confirm(`Delete ${p.name}? This can't be undone.`)) deleteProfile(p.id);
            }}
          >
            Delete
          </Button>
        </div>
      ))}
      <div class="row">
        <input class="code-input" placeholder="Paste a code (WIZ1-...)" value={code} onInput={(e) => setCode(e.currentTarget.value)} />
        <Button
          onClick={() => {
            const p = importCode(code);
            if (!p) return setMsg("That code didn't work.");
            const clash = save.profiles.some((x) => x.id === p.id);
            saveProfile(clash ? { ...p, id: crypto.randomUUID() } : p);
            setCode('');
            setMsg(`Added ${p.name}!`);
          }}
        >
          Add wizard
        </Button>
      </div>
      {msg && <p class="small ok">{msg}</p>}
    </Panel>
  );
}
