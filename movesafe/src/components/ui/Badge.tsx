'use client';

import { HTMLAttributes, forwardRef } from 'react';

type BadgeVariant = 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'info';
type BadgeSize = 'sm' | 'md' | 'lg';

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
    variant?: BadgeVariant;
    size?: BadgeSize;
    dot?: boolean;
    pulse?: boolean;
}

const variants: Record<BadgeVariant, string> = {
    default: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300',
    primary: 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300',
    success: 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300',
    warning: 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300',
    danger: 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300',
    info: 'bg-cyan-100 dark:bg-cyan-900/40 text-cyan-700 dark:text-cyan-300',
};

const dotColors: Record<BadgeVariant, string> = {
    default: 'bg-slate-500',
    primary: 'bg-blue-500',
    success: 'bg-green-500',
    warning: 'bg-amber-500',
    danger: 'bg-red-500',
    info: 'bg-cyan-500',
};

const sizes: Record<BadgeSize, string> = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-xs',
    lg: 'px-3 py-1.5 text-sm',
};

export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
    ({ variant = 'default', size = 'md', dot = false, pulse = false, className = '', children, ...props }, ref) => {
        return (
            <span
                ref={ref}
                className={`
          inline-flex items-center gap-1.5 font-medium rounded-full
          ${variants[variant]}
          ${sizes[size]}
          ${className}
        `}
                {...props}
            >
                {dot && (
                    <span className={`w-1.5 h-1.5 rounded-full ${dotColors[variant]} ${pulse ? 'animate-pulse' : ''}`} />
                )}
                {children}
            </span>
        );
    }
);

Badge.displayName = 'Badge';
