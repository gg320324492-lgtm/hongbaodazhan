// 赛博朋克风格按钮组件
'use client';

import { ButtonHTMLAttributes, forwardRef } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger';
  glow?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ children, variant = 'primary', glow = true, className = '', ...props }, ref) => {
    const baseStyles = 'px-6 py-3 font-mono font-bold text-sm uppercase tracking-wider transition-all duration-300 relative overflow-hidden';
    
    const variantStyles = {
      primary: 'bg-transparent border-2 border-cyan-400 text-cyan-400 hover:bg-cyan-400 hover:text-black',
      secondary: 'bg-transparent border-2 border-pink-500 text-pink-500 hover:bg-pink-500 hover:text-black',
      danger: 'bg-transparent border-2 border-red-500 text-red-500 hover:bg-red-500 hover:text-black',
    };

    const glowStyles = glow
      ? variant === 'primary'
        ? 'shadow-[0_0_20px_rgba(0,240,255,0.5)] hover:shadow-[0_0_30px_rgba(0,240,255,0.8)]'
        : variant === 'secondary'
        ? 'shadow-[0_0_20px_rgba(255,0,255,0.5)] hover:shadow-[0_0_30px_rgba(255,0,255,0.8)]'
        : 'shadow-[0_0_20px_rgba(255,0,0,0.5)] hover:shadow-[0_0_30px_rgba(255,0,0,0.8)]'
      : '';

    return (
      <button
        ref={ref}
        className={`${baseStyles} ${variantStyles[variant]} ${glowStyles} ${className}`}
        {...props}
      >
        <span className="relative z-10">{children}</span>
        <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700"></span>
      </button>
    );
  }
);

Button.displayName = 'Button';
