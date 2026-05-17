interface BadgeProps {
  label: string;
  variant?: 'outlined' | 'filled';
  /** Uses accent color for border+text (outlined) or background (filled). Falls back to hairline/ivory. */
  accent?: boolean;
  /** Direct color override — takes precedence over accent flag. */
  color?: string;
  className?: string;
}

export default function Badge({
  label,
  variant = 'outlined',
  accent = false,
  color,
  className = '',
}: BadgeProps) {
  const resolvedColor = color ?? (accent ? 'var(--accent)' : undefined);

  const filled = variant === 'filled';

  const style: React.CSSProperties = {
    background: filled ? (resolvedColor ?? 'var(--accent)') : 'transparent',
    color: filled
      ? 'var(--black)'
      : (resolvedColor ?? 'var(--ivory)'),
    border: filled
      ? 'none'
      : `1px solid ${resolvedColor ?? 'var(--hairline)'}`,
  };

  return (
    <span
      style={style}
      className={`inline-flex items-center px-[10px] py-[4px] font-mono text-[9px] tracking-[0.2em] font-semibold uppercase ${className}`}
    >
      {label}
    </span>
  );
}
