'use client';

import { useEffect, useRef, useState, ReactNode } from 'react';

interface MotionWrapperProps {
  children: ReactNode;
  animation?: 'fadeIn' | 'slideUp' | 'slideLeft' | 'slideRight' | 'scale' | 'float';
  delay?: number;
  duration?: number;
  className?: string;
  threshold?: number;
}

export function MotionWrapper({
  children,
  animation = 'fadeIn',
  delay = 0,
  duration = 600,
  className = '',
  threshold = 0.1
}: MotionWrapperProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const elementRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);
    
    const handleChange = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches);
    };
    
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setTimeout(() => setIsVisible(true), delay);
        }
      },
      { threshold }
    );

    if (elementRef.current) {
      observer.observe(elementRef.current);
    }

    return () => observer.disconnect();
  }, [delay, threshold]);

  const getAnimationClasses = () => {
    if (prefersReducedMotion) {
      return 'opacity-100 transform-none';
    }

    const baseClasses = `transition-all duration-${duration} ease-out`;
    
    if (!isVisible) {
      switch (animation) {
        case 'fadeIn':
          return `${baseClasses} opacity-0`;
        case 'slideUp':
          return `${baseClasses} opacity-0 transform translate-y-8`;
        case 'slideLeft':
          return `${baseClasses} opacity-0 transform translate-x-8`;
        case 'slideRight':
          return `${baseClasses} opacity-0 transform -translate-x-8`;
        case 'scale':
          return `${baseClasses} opacity-0 transform scale-95`;
        case 'float':
          return `${baseClasses} opacity-0 transform translate-y-4`;
        default:
          return `${baseClasses} opacity-0`;
      }
    }

    return `${baseClasses} opacity-100 transform-none`;
  };

  const getFloatingAnimation = () => {
    if (prefersReducedMotion || animation !== 'float') return '';
    return isVisible ? 'animate-gentle-float' : '';
  };

  return (
    <div
      ref={elementRef}
      className={`${getAnimationClasses()} ${getFloatingAnimation()} ${className}`}
    >
      {children}
    </div>
  );
}