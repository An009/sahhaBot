'use client';

import { useEffect, useState } from 'react';

interface AnimatedBackgroundProps {
  variant?: 'gradient' | 'mesh' | 'waves';
  className?: string;
}

export function AnimatedBackground({ 
  variant = 'gradient', 
  className = '' 
}: AnimatedBackgroundProps) {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);
    
    const handleChange = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches);
    };
    
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  const getBackgroundStyle = () => {
    const baseClass = 'absolute inset-0 -z-10';
    
    if (prefersReducedMotion) {
      return `${baseClass} bg-gradient-to-br from-blue-50 to-indigo-100`;
    }

    switch (variant) {
      case 'gradient':
        return `${baseClass} bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 animate-gradient-shift`;
      case 'mesh':
        return `${baseClass} bg-gradient-mesh animate-mesh-float`;
      case 'waves':
        return `${baseClass} bg-gradient-waves animate-wave-motion`;
      default:
        return `${baseClass} bg-gradient-to-br from-blue-50 to-indigo-100`;
    }
  };

  return (
    <div className={`${getBackgroundStyle()} ${className}`}>
      {!prefersReducedMotion && variant === 'mesh' && (
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-0 left-0 w-72 h-72 bg-blue-300 rounded-full mix-blend-multiply filter blur-xl animate-blob"></div>
          <div className="absolute top-0 right-0 w-72 h-72 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl animate-blob animation-delay-2000"></div>
          <div className="absolute bottom-0 left-0 w-72 h-72 bg-indigo-300 rounded-full mix-blend-multiply filter blur-xl animate-blob animation-delay-4000"></div>
        </div>
      )}
    </div>
  );
}