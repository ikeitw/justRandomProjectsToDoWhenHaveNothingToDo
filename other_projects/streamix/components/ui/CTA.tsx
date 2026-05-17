import Link from 'next/link';
import React from 'react';

interface CTAProps {
  variant?: 'primary' | 'accent' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  icon?: React.ReactNode;
  href?: string;
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
  disabled?: boolean;
  className?: string;
  children: React.ReactNode;
}

const VARIANT: Record<string, string> = {
  primary: 'bg-[#e8e2d4] text-[#050505] border border-transparent hover:bg-[#d4cfc4]',
  accent:  'bg-[#c89b5a] text-[#050505] border border-transparent hover:bg-[#b08848]',
  outline: 'bg-white/[0.04] text-[#e8e2d4] border border-[#2a2520] hover:bg-white/10 backdrop-blur-[8px]',
  ghost:   'bg-transparent text-[#e8e2d4] border border-[#2a2520] hover:bg-white/[0.04]',
};

const SIZE: Record<string, string> = {
  sm: 'h-8 px-[14px] text-[11px] gap-2',
  md: 'h-10 px-[18px] text-[12px] gap-2.5',
  lg: 'h-12 px-6 text-[13px] gap-2.5',
};

export default function CTA({
  variant = 'primary',
  size = 'md',
  icon,
  href,
  onClick,
  type = 'button',
  disabled,
  className = '',
  children,
}: CTAProps) {
  const base = [
    'inline-flex items-center font-semibold uppercase tracking-[0.06em] rounded-[1px]',
    'transition-colors duration-150',
    'disabled:opacity-40 disabled:cursor-not-allowed',
    VARIANT[variant],
    SIZE[size],
    className,
  ].join(' ');

  if (href) {
    return (
      <Link href={href} className={base}>
        {icon && <span className="flex-shrink-0">{icon}</span>}
        {children}
      </Link>
    );
  }

  return (
    <button type={type} onClick={onClick} disabled={disabled} className={base}>
      {icon && <span className="flex-shrink-0">{icon}</span>}
      {children}
    </button>
  );
}
