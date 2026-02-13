import clsx from 'clsx';

export function Card({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={clsx(
        'bg-mc-bg-secondary border border-mc-border rounded-lg',
        className
      )}
    >
      {children}
    </div>
  );
}

export function CardHeader({
  title,
  right,
}: {
  title: string;
  right?: React.ReactNode;
}) {
  return (
    <div className="px-4 py-3 border-b border-mc-border flex items-center justify-between gap-3">
      <h2 className="text-sm font-semibold text-mc-text">{title}</h2>
      {right}
    </div>
  );
}

export function Button({
  children,
  onClick,
  className,
  disabled,
  type,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
  disabled?: boolean;
  type?: 'button' | 'submit';
}) {
  return (
    <button
      type={type ?? 'button'}
      onClick={onClick}
      disabled={disabled}
      className={clsx(
        'px-3 py-2 text-xs rounded border border-mc-border bg-mc-bg-tertiary text-mc-text hover:border-mc-text-secondary transition',
        disabled && 'opacity-50 cursor-not-allowed',
        className
      )}
    >
      {children}
    </button>
  );
}

export function Input({
  value,
  onChange,
  placeholder,
  className,
  type,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  className?: string;
  type?: string;
}) {
  return (
    <input
      value={value}
      type={type ?? 'text'}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={clsx(
        'px-3 py-2 text-xs rounded border border-mc-border bg-mc-bg-tertiary text-mc-text placeholder:text-mc-text-secondary focus:outline-none focus:ring-2 focus:ring-mc-accent/40',
        className
      )}
    />
  );
}

export function Select({
  value,
  onChange,
  options,
  className,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  className?: string;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={clsx(
        'px-3 py-2 text-xs rounded border border-mc-border bg-mc-bg-tertiary text-mc-text focus:outline-none focus:ring-2 focus:ring-mc-accent/40',
        className
      )}
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

export function Badge({
  children,
  color,
}: {
  children: React.ReactNode;
  color:
    | 'green'
    | 'yellow'
    | 'red'
    | 'blue'
    | 'purple'
    | 'gray'
    | 'pink';
}) {
  const classes = {
    green: 'bg-mc-accent-green/20 text-mc-accent-green border-mc-accent-green/40',
    yellow: 'bg-mc-accent-yellow/20 text-mc-accent-yellow border-mc-accent-yellow/40',
    red: 'bg-mc-accent-red/20 text-mc-accent-red border-mc-accent-red/40',
    blue: 'bg-mc-accent/20 text-mc-accent border-mc-accent/40',
    purple: 'bg-mc-accent-purple/20 text-mc-accent-purple border-mc-accent-purple/40',
    pink: 'bg-mc-accent-pink/20 text-mc-accent-pink border-mc-accent-pink/40',
    gray: 'bg-mc-bg-tertiary text-mc-text-secondary border-mc-border',
  } as const;

  return (
    <span
      className={clsx(
        'inline-flex items-center px-2 py-0.5 text-[11px] rounded border',
        classes[color]
      )}
    >
      {children}
    </span>
  );
}
