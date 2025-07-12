'use client';

import { ReactNode, useState } from 'react';
import { cn } from '@/lib/utils';

interface GlassCardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
  glow?: boolean;
  variant?: 'default' | 'strong' | 'subtle';
}

export function GlassCard({
  children,
  className = '',
  hover = true,
  glow = false,
  variant = 'default'
}: GlassCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  const getVariantClasses = () => {
    switch (variant) {
      case 'strong':
        return 'bg-white/20 backdrop-blur-lg border border-white/30';
      case 'subtle':
        return 'bg-white/5 backdrop-blur-sm border border-white/10';
      default:
        return 'bg-white/10 backdrop-blur-md border border-white/20';
    }
  };

  const getHoverClasses = () => {
    if (!hover) return '';
    return 'transition-all duration-300 hover:bg-white/15 hover:border-white/40 hover:shadow-xl hover:shadow-blue-500/10 hover:-translate-y-1';
  };

  const getGlowClasses = () => {
    if (!glow) return '';
    return isHovered 
      ? 'shadow-2xl shadow-blue-500/20' 
      : 'shadow-lg shadow-blue-500/10';
  };

  return (
    <div
      className={cn(
        'rounded-xl',
        getVariantClasses(),
        getHoverClasses(),
        getGlowClasses(),
        className
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {children}
    </div>
  );
}