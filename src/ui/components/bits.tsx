import type { ComponentChildren } from 'preact';
import { sfx } from '../../audio/sfx';
import { Icon } from './Sprite';

const STAR_PATH = 'M12 2.2l2.9 6.2 6.8.9-5 4.7 1.3 6.7-6-3.3-6 3.3 1.3-6.7-5-4.7 6.8-.9z';

/** Drawn as shapes with a dark outline, so stars stay readable at any size and on any background. */
export function Stars({ count, size = 28, of = 3 }: { count: number; size?: number; of?: number }) {
  return (
    <span class="stars" aria-label={`${count} of ${of} stars`}>
      {Array.from({ length: of }, (_, i) => (
        <svg key={i} class={`star ${i < count ? 'on' : 'off'}`} viewBox="0 0 24 24" width={size} height={size} aria-hidden="true">
          <path d={STAR_PATH} />
        </svg>
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
