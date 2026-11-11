/**
 * "Install app" support. Chrome and Edge fire `beforeinstallprompt` when the
 * site can be installed; we keep that event so a button can show the prompt later.
 * Other browsers never fire it, so the button stays hidden there.
 * Imported from main.tsx so the listener is in place before the event fires.
 */
import { useEffect, useState } from 'preact/hooks';

interface InstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

let deferred: InstallPromptEvent | null = null;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault(); // we show our own button instead of the browser's mini-infobar
  deferred = e as InstallPromptEvent;
  emit();
});

window.addEventListener('appinstalled', () => {
  deferred = null;
  emit();
});

/** True when the game can be installed right now. */
export function useCanInstall() {
  const [, force] = useState(0);
  useEffect(() => {
    const l = () => force((n) => n + 1);
    listeners.add(l);
    return () => void listeners.delete(l);
  }, []);
  return deferred !== null;
}

export async function installApp() {
  const e = deferred;
  if (!e) return;
  deferred = null; // a prompt event can only be used once
  emit();
  await e.prompt();
}
