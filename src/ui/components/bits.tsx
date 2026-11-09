import type { ComponentChildren } from 'preact';
import { sfx } from '../../audio/sfx';
import { Icon } from './Sprite';

/** Five-point star, outer radius 10, inner radius 4.4, inside a 24 x 24 box so the border fits. */
const STAR_POINTS = Array.from({ length: 10 }, (_, i) => {
  const r = i % 2 === 0 ? 10 : 4.4;
  const a = -Math.PI / 2 + (i * Math.PI) / 5;
  return `${(12 + r * Math.cos(a)).toFixed(2)},${(12.6 + r * Math.sin(a)).toFixed(2)}`;
}).join(' ');

/** A star drawn as a shape, not a sprite: the same black border at every size and on every background. */
export function StarShape({ filled, size = 28 }: { filled: boolean; size?: number }) {
  return (
    <svg class={`star ${filled ? 'star-on' : 'star-off'}`} viewBox="0 0 24 24" width={size} height={size} aria-hidden="true">
      <polygon points={STAR_POINTS} />
    </svg>
  );
}

export function Stars({ count, size = 28, of = 3 }: { count: number; size?: number; of?: number }) {
  return (
    <span class="stars" aria-label={`${count} of ${of} stars`}>
      {Array.from({ length: of }, (_, i) => (
        <StarShape key={i} filled={i < count} size={size} />
      ))}
    </span>
  );
}

export function Gold({ amount, size = 24 }: { amount: number; size?: number }) {
  return (
    <span class="gold">
      <Icon name="coin" size={size} />
      <b>{amount}</b>
    </span>
  );
}

interface ButtonProps {
  onClick: () => void;
  children?: ComponentChildren;
  kind?: 'primary' | 'plain' | 'danger';
  icon?: string;
  title?: string;
  disabled?: boolean;
  class?: string;
}

export function Button({ onClick, children, kind = 'plain', icon, title, disabled, class: cls }: ButtonProps) {
  return (
    <button
      class={`btn btn-${kind} ${cls ?? ''}`}
      title={title}
      aria-label={title}
      disabled={disabled}
      onClick={() => {
        sfx.click();
        onClick();
      }}
    >
      {icon && <Icon name={icon} size={26} />}
      {children}
    </button>
  );
}

export function Panel({ children, class: cls }: { children: ComponentChildren; class?: string }) {
  return <div class={`panel ${cls ?? ''}`}>{children}</div>;
}
