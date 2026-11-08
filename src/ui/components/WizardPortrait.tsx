import { useEffect, useState } from 'preact/hooks';
import type { Equipped, WizardLook } from '../../game/save';
import { portraitUrl } from '../../render/portrait';
import { WIZ_CANVAS } from '../../render/wizard';

interface Props {
  look: WizardLook;
  equipped: Pick<Equipped, 'hat' | 'robe' | 'wand'>;
  scale?: number;
  class?: string;
}

export function WizardPortrait({ look, equipped, scale = 2, class: cls }: Props) {
  const [url, setUrl] = useState<string>();
  useEffect(() => {
    let live = true;
    void portraitUrl(look, equipped).then((u) => live && setUrl(u));
    return () => void (live = false);
  }, [JSON.stringify(look), equipped.hat, equipped.robe, equipped.wand]);
  return (
    <div class={`portrait ${cls ?? ''}`} style={{ width: `${(WIZ_CANVAS.w + 16) * scale}px`, height: `${WIZ_CANVAS.h * scale}px` }}>
      {url && <img class="px" src={url} alt="Your wizard" style={{ width: '100%', height: '100%' }} />}
    </div>
  );
}
