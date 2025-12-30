'use client';

import { HTMLAttributes, forwardRef } from 'react';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
    variant?: 'default' | 'glass' | 'outline' | 'elevated';
    hover?: boolean;
    padding?: 'none' | 'sm' | 'md' | 'lg';
}

const variants = {
    default: 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800',
    glass: 'bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200/50 dark:border-slate-700/50',
    outline: 'bg-transparent border border-slate-200 dark:border-slate-700',
    elevated: 'bg-white dark:bg-slate-900 shadow-xl shadow-slate-200/50 dark:shadow-slate-900/50',
};

const paddings = {
    none: '',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
};

export const Card = forwardRef<HTMLDivElement, CardProps>(
    ({ variant = 'default', hover = false, padding = 'md', className = '', children, ...props }, ref) => {
        return (
            <div
                ref={ref}
                className={`
          rounded-2xl transition-all duration-200
          ${variants[variant]}
          ${paddings[padding]}
          ${hover ? 'hover:shadow-xl hover:shadow-blue-500/10 hover:-translate-y-1 hover:border-blue-200 dark:hover:border-blue-800 cursor-pointer' : ''}
          ${className}
        `}
                {...props}
            >
                {children}
            </div>
        );
    }
);

Card.displayName = 'Card';

// Card Header
// Card Header
type CardHeaderProps = HTMLAttributes<HTMLDivElement>;

export const CardHeader = forwardRef<HTMLDivElement, CardHeaderProps>(
    ({ className = '', children, ...props }, ref) => {
        return (
            <div
                ref={ref}
                className={`flex items-center justify-between mb-4 ${className}`}
                {...props}
            >
                {children}
            </div>
        );
    }
);

CardHeader.displayName = 'CardHeader';

// Card Title
type CardTitleProps = HTMLAttributes<HTMLHeadingElement>;

export const CardTitle = forwardRef<HTMLHeadingElement, CardTitleProps>(
    ({ className = '', children, ...props }, ref) => {
        return (
            <h3
                ref={ref}
                className={`text-lg font-semibold text-slate-900 dark:text-white ${className}`}
                {...props}
            >
                {children}
            </h3>
        );
    }
);

CardTitle.displayName = 'CardTitle';

// Card Description
type CardDescriptionProps = HTMLAttributes<HTMLParagraphElement>;

export const CardDescription = forwardRef<HTMLParagraphElement, CardDescriptionProps>(
    ({ className = '', children, ...props }, ref) => {
        return (
            <p
                ref={ref}
                className={`text-sm text-slate-500 dark:text-slate-400 ${className}`}
                {...props}
            >
                {children}
            </p>
        );
    }
);

CardDescription.displayName = 'CardDescription';
