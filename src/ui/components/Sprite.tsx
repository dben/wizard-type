import { useState } from 'preact/hooks';
import { spriteUrl } from '../../render/sprites';

interface Props {
  path: string;
  /** Screen pixels per sprite pixel. */
  scale?: number;
  /** Fit inside a box of this many screen pixels instead of a fixed scale. */
  fit?: number;
  class?: string;
  alt?: string;
  style?: Record<string, string | number>;
  src?: string;
}

/** A pixel-art image drawn at a whole-number scale so it stays crisp. */
export function Sprite({ path, scale, fit, class: cls, alt = '', style, src }: Props) {
  const [size, setSize] = useState<[number, number] | null>(null);
  let w: number | undefined;
  if (size) {
    let s = scale ?? 1;
    if (fit) {
      const ratio = fit / Math.max(size[0], size[1]);
      s = ratio >= 1 ? Math.min(4, Math.floor(ratio)) : ratio;
    }
    w = size[0] * s;
  }
  return (
    <img
      class={`px ${cls ?? ''}`}
      src={src ?? spriteUrl(path)}
      alt={alt}
      draggable={false}
      style={{ width: w ? `${w}px` : undefined, visibility: size ? 'visible' : 'hidden', ...style }}
      onLoad={(e) => {
        const img = e.currentTarget as HTMLImageElement;
        setSize([img.naturalWidth, img.naturalHeight]);
      }}
    />
  );
}

export const Icon = ({ name, size = 28 }: { name: string; size?: number }) => (
  <img class="px icon" src={spriteUrl(`ui/${name}`)} alt="" draggable={false} style={{ width: `${size}px`, height: `${size}px` }} />
);
