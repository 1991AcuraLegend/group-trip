'use client';

import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

type Props = {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
};

export function Modal({ isOpen, onClose, title, children }: Props) {
  const firstFocusableRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    document.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';

    // Focus first focusable element
    const timer = setTimeout(() => {
      const focusable = document.querySelector<HTMLElement>(
        '[data-modal] button, [data-modal] input, [data-modal] textarea, [data-modal] select'
      );
      if (focusable) {
        firstFocusableRef.current = focusable;
        focusable.focus();
      }
    }, 10);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
      clearTimeout(timer);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[1000] flex items-center justify-center p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="absolute inset-0 bg-ocean-900/40 backdrop-blur-sm" aria-hidden="true" />
      <div
        data-modal
        className="glass relative z-10 w-full max-w-lg rounded-2xl border border-sand-200 bg-white shadow-xl animate-fade-in-up"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        <div className="flex items-center justify-between border-b px-6 py-4">
          <h2 id="modal-title" className="text-lg font-semibold font-display text-gray-900">
            {title}
          </h2>
          <button
            onClick={onClose}
            className="rounded-md p-1 text-sand-400 hover:text-sand-600 focus:outline-none focus:ring-2 focus:ring-ocean-500"
            aria-label="Close"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="px-6 py-4">{children}</div>
      </div>
    </div>,
    document.body
  );
}
