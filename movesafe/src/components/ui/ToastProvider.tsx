'use client';

import { Toaster as Sonner } from 'sonner';

export function ToastProvider({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <Sonner
        theme="dark"
        className="toaster group"
        toastOptions={{
          classNames: {
            toast: 'group toast group-[.toaster]:bg-zinc-900 group-[.toaster]:text-white group-[.toaster]:border-zinc-800 group-[.toaster]:shadow-lg whitespace-normal break-words',
            description: 'group-[.toast]:text-zinc-400',
            actionButton: 'group-[.toast]:bg-zinc-500 group-[.toast]:text-white',
            cancelButton: 'group-[.toast]:bg-zinc-800 group-[.toast]:text-zinc-400',
          },
        }}
        position="bottom-right"
        mobileOffset={{ bottom: '20px', left: '0px', right: '0px' }}
      />
    </>
  );
}
