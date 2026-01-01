'use client';

import { AlertTriangle } from 'lucide-react';
import { Modal, ModalFooter } from '@/components/ui/Modal';

interface ConfirmDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    description: string;
    confirmText?: string;
    cancelText?: string;
    variant?: 'danger' | 'default';
    loading?: boolean;
}

export function ConfirmDialog({
    isOpen,
    onClose,
    onConfirm,
    title,
    description,
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    variant = 'default',
    loading = false,
}: ConfirmDialogProps) {
    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={title}
            description={description}
            size="sm"
        >
            <div className="space-y-4">
                {variant === 'danger' && (
                    <div className="flex items-start gap-3 p-3 bg-red-500/10 border border-red-500/20 rounded-xl">
                        <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                        <p className="text-sm text-red-200">
                            This action cannot be undone. Please be certain.
                        </p>
                    </div>
                )}

                <ModalFooter>
                    <button
                        onClick={onConfirm}
                        disabled={loading}
                        className={`
              px-4 py-2 font-medium rounded-xl transition-colors disabled:opacity-50 cursor-pointer
              ${variant === 'danger'
                                ? 'bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-500/20'
                                : 'bg-white hover:bg-zinc-200 text-black shadow-lg shadow-white/5'
                            }
            `}
                    >
                        {loading ? 'Processing...' : confirmText}
                    </button>
                </ModalFooter>
            </div>
        </Modal>
    );
}
