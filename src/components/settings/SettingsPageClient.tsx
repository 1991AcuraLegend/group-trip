'use client';

import Link from 'next/link';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { useTheme } from '@/providers/ThemeProvider';
import type { Theme } from '@/providers/ThemeProvider';

export function SettingsPageClient() {
  const { theme, setTheme } = useTheme();

  function handleThemeChange(e: React.ChangeEvent<HTMLSelectElement>) {
    setTheme(e.target.value as Theme);
  }

  return (
    <div className="min-h-screen bg-sand-50">
      <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
        <Link
          href="/dashboard"
          className="mb-6 inline-flex items-center gap-1 text-sm text-sand-500 hover:text-ocean-600 transition-colors"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Dashboard
        </Link>

        <h1 className="mb-8 font-display text-3xl font-bold text-ocean-900">Settings</h1>

        <div className="space-y-4">
          {/* Theme section */}
          <div className="glass rounded-xl border border-sand-200 bg-white p-6 shadow-sm">
            <h2 className="mb-1 text-base font-semibold text-ocean-800">Appearance</h2>
            <p className="mb-4 text-sm text-sand-500">Customize how TravelPlanner looks.</p>
            <div className="max-w-xs">
              <Select
                label="Theme"
                value={theme}
                onChange={handleThemeChange}
              >
                <option value="coastal">Coastal</option>
                <option value="y2k">Y2K Aero</option>
              </Select>
            </div>
          </div>

          {/* Account section */}
          <div className="glass rounded-xl border border-sand-200 bg-white p-6 shadow-sm">
            <h2 className="mb-1 text-base font-semibold text-ocean-800">Account</h2>
            <p className="mb-4 text-sm text-sand-500">Manage your account credentials.</p>
            <div className="flex flex-wrap gap-2">
              <Link href="/settings/change-name">
                <Button variant="secondary">Change my Name</Button>
              </Link>
              <Link href="/settings/change-password">
                <Button variant="secondary">Change my Password</Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
