interface EyebrowProps {
  label: string;
  number?: string;
  className?: string;
}

export default function Eyebrow({ label, number, className = '' }: EyebrowProps) {
  return (
    <div
      className={`flex items-baseline gap-3 font-mono text-[10px] tracking-[0.2em] uppercase text-[var(--dim)] ${className}`}
    >
      {number && <span className="text-[var(--accent)]">{number}</span>}
      <span>{label}</span>
    </div>
  );
}
