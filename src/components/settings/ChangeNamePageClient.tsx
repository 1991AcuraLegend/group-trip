'use client';

import Link from 'next/link';
import { ChangeNameForm } from './ChangeNameForm';

export function ChangeNamePageClient() {
  return (
    <div className="min-h-screen bg-sand-50">
      <div className="mx-auto max-w-md px-4 py-10 sm:px-6">
        <Link
          href="/settings"
          className="mb-6 inline-flex items-center gap-1 text-sm text-sand-500 hover:text-ocean-600 transition-colors"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Settings
        </Link>

        <h1 className="mb-8 font-display text-3xl font-bold text-ocean-900">Change Name</h1>

        <div className="glass rounded-xl border border-sand-200 bg-white p-6 shadow-sm">
          <ChangeNameForm />
        </div>
      </div>
    </div>
  );
}
