// 赛博朋克风格输入框组件
'use client';

import { InputHTMLAttributes, forwardRef } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, className = '', ...props }, ref) => {
    return (
      <div className="flex flex-col gap-2">
        {label && (
          <label className="text-cyan-400 font-mono text-sm uppercase tracking-wider">
            {label}
          </label>
        )}
        <input
          ref={ref}
          className={`
            bg-black/50 border-2 border-cyan-400/50 text-cyan-400 
            px-4 py-2 font-mono
            focus:outline-none focus:border-cyan-400 focus:shadow-[0_0_15px_rgba(0,240,255,0.5)]
            transition-all duration-300
            placeholder:text-cyan-400/30
            ${className}
          `}
          {...props}
        />
      </div>
    );
  }
);

Input.displayName = 'Input';
