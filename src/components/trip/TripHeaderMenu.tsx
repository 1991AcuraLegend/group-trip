'use client';

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';

type Props = {
  isOwner: boolean;
  onEditTrip: () => void;
  costBreakdownHref: string;
  onExport: () => void;
  onShare: () => void;
  onDelete: () => void;
  isDeleting: boolean;
};

export function TripHeaderMenu({ isOwner, onEditTrip, costBreakdownHref, onExport, onShare, onDelete, isDeleting }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setIsOpen(false);
    }
    function onMouseDown(e: MouseEvent) {
      if (
        menuRef.current && !menuRef.current.contains(e.target as Node) &&
        buttonRef.current && !buttonRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    function onScroll() {
      setIsOpen(false);
    }

    document.addEventListener('keydown', onKey);
    document.addEventListener('mousedown', onMouseDown);
    window.addEventListener('scroll', onScroll, true);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('scroll', onScroll, true);
    };
  }, [isOpen]);

  function getMenuPosition() {
    if (!buttonRef.current) return { top: 0, right: 0 };
    const rect = buttonRef.current.getBoundingClientRect();
    const MARGIN = 4;
    return {
      top: rect.bottom + MARGIN,
      right: window.innerWidth - rect.right,
    };
  }

  const pos = isOpen ? getMenuPosition() : { top: 0, right: 0 };

  const menu = isOpen ? (
    <div
      ref={menuRef}
      className="fixed z-50 w-48 rounded-lg glass bg-white border border-sand-200 shadow-xl py-1"
      style={{ top: pos.top, right: pos.right }}
      role="menu"
    >
      {isOwner && (
        <button
          role="menuitem"
          className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-sand-800 hover:bg-sand-100 transition-colors"
          onClick={() => { setIsOpen(false); onEditTrip(); }}
        >
          <svg className="h-4 w-4 shrink-0 text-sand-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
          Edit Trip
        </button>
      )}
      <Link
        href={costBreakdownHref}
        role="menuitem"
        className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-sand-800 hover:bg-sand-100 transition-colors"
        onClick={() => setIsOpen(false)}
      >
        <svg className="h-4 w-4 shrink-0 text-sand-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        Cost Breakdown
      </Link>
      <button
        role="menuitem"
        className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-sand-800 hover:bg-sand-100 transition-colors"
        onClick={() => { setIsOpen(false); onExport(); }}
      >
        <svg className="h-4 w-4 shrink-0 text-sand-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        Export Trip
      </button>
      <button
        role="menuitem"
        className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-sand-800 hover:bg-sand-100 transition-colors"
        onClick={() => { setIsOpen(false); onShare(); }}
      >
        <svg className="h-4 w-4 shrink-0 text-sand-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
        </svg>
        Share
      </button>
      {isOwner && (
        <>
          <div className="my-1 border-t border-sand-200" />
          <button
            role="menuitem"
            disabled={isDeleting}
            className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-coral-600 hover:bg-coral-50 transition-colors disabled:opacity-50 disabled:pointer-events-none"
            onClick={() => { setIsOpen(false); onDelete(); }}
          >
            <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            Delete Trip
          </button>
        </>
      )}
    </div>
  ) : null;

  return (
    <>
      <button
        ref={buttonRef}
        aria-label="Trip actions"
        aria-expanded={isOpen}
        onClick={() => setIsOpen((o) => !o)}
        className="flex h-8 w-8 items-center justify-center rounded-lg border border-sand-300 bg-sand-100 text-sand-700 hover:bg-sand-200 transition-colors"
      >
        <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <circle cx="12" cy="5" r="2" />
          <circle cx="12" cy="12" r="2" />
          <circle cx="12" cy="19" r="2" />
        </svg>
      </button>
      {typeof document !== 'undefined' && createPortal(menu, document.body)}
    </>
  );
}
