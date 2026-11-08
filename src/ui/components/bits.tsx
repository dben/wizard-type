import type { ComponentChildren } from 'preact';
import { sfx } from '../../audio/sfx';
import { Icon } from './Sprite';

export function Stars({ count, size = 28, of = 3 }: { count: number; size?: number; of?: number }) {
  return (
    <span class="stars" aria-label={`${count} of ${of} stars`}>
      {Array.from({ length: of }, (_, i) => (
        <Icon key={i} name={i < count ? 'star' : 'star-empty'} size={size} />
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
