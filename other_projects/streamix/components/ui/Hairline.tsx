interface HairlineProps {
  vertical?: boolean;
  color?: string;
  length?: string | number;
  opacity?: number;
  className?: string;
}

export default function Hairline({
  vertical = false,
  color = 'var(--hairline)',
  length,
  opacity = 1,
  className = '',
}: HairlineProps) {
  const resolvedLength = length != null ? (typeof length === 'number' ? `${length}px` : length) : '100%';

  return (
    <div
      className={`flex-shrink-0 ${className}`}
      style={{
        background: color,
        opacity,
        width: vertical ? 1 : resolvedLength,
        height: vertical ? resolvedLength : 1,
      }}
    />
  );
}
