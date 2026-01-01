'use client';

import { Fragment, ReactNode } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title?: string;
    description?: string;
    children: ReactNode;
    size?: 'sm' | 'md' | 'lg' | 'xl';
    showClose?: boolean;
}

const sizes = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
};

export function Modal({
    isOpen,
    onClose,
    title,
    description,
    children,
    size = 'md',
    showClose = true,
}: ModalProps) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
                onClick={onClose}
            />

            {/* Modal */}
            <div
                className={`
          relative w-full ${sizes[size]}
          bg-zinc-950
          rounded-2xl shadow-2xl
          transform transition-all
          border border-zinc-800
          animate-in fade-in zoom-in-95 duration-200
        `}
            >
                {/* Header */}
                {(title || showClose) && (
                    <div className="flex items-start justify-between p-6 pb-0">
                        <div>
                            {title && (
                                <h2 className="text-xl font-semibold text-zinc-100">
                                    {title}
                                </h2>
                            )}
                            {description && (
                                <p className="mt-1 text-sm text-zinc-400">
                                    {description}
                                </p>
                            )}
                        </div>
                        {showClose && (
                            <button
                                onClick={onClose}
                                className="p-2 -m-2 text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800 rounded-lg transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        )}
                    </div>
                )}

                {/* Content */}
                <div className="p-6">
                    {children}
                </div>
            </div>
        </div>
    );
}

// Modal Footer
interface ModalFooterProps {
    children: ReactNode;
}

export function ModalFooter({ children }: ModalFooterProps) {
    return (
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-800 mt-6 -mx-6 -mb-6 px-6 py-4 bg-zinc-900/50 rounded-b-2xl">
            {children}
        </div>
    );
}
