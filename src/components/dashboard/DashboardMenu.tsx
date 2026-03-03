'use client';

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { signOut } from 'next-auth/react';

export function DashboardMenu() {
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
    return {
      top: rect.bottom + 4,
      right: window.innerWidth - rect.right,
    };
  }

  const pos = isOpen ? getMenuPosition() : { top: 0, right: 0 };

  const menu = isOpen ? (
    <div
      ref={menuRef}
      className="fixed z-50 w-44 rounded-lg glass bg-white border border-sand-200 shadow-xl py-1"
      style={{ top: pos.top, right: pos.right }}
      role="menu"
    >
      <Link
        href="/settings"
        role="menuitem"
        className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-sand-800 hover:bg-sand-100 transition-colors"
        onClick={() => setIsOpen(false)}
      >
        <svg className="h-4 w-4 shrink-0 text-sand-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
        Settings
      </Link>
      <button
        role="menuitem"
        className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-sand-800 hover:bg-sand-100 transition-colors"
        onClick={() => { setIsOpen(false); signOut({ callbackUrl: `${window.location.origin}/` }); }}
      >
        <svg className="h-4 w-4 shrink-0 text-sand-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
        </svg>
        Sign Out
      </button>
    </div>
  ) : null;

  return (
    <>
      <button
        ref={buttonRef}
        aria-label="Account options"
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
