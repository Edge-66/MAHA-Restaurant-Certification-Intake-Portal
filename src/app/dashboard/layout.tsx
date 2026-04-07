'use client';

import Link from 'next/link';
import { Great_Vibes } from 'next/font/google';
import ProfileDropdown from '@/components/ProfileDropdown';
import NotificationBell from '@/components/NotificationBell';

const greatVibes = Great_Vibes({ subsets: ['latin'], weight: '400' });

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-stone-50">
      <header className="bg-white border-b border-stone-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
          <Link href="/" className="text-lg font-bold text-[#2d6a4f]">
            MAHA{' '}
            <span className={`${greatVibes.className} text-xl font-normal text-stone-600`}>
              From the Farm
            </span>
          </Link>
          <div className="flex items-center gap-3">
            <Link
              href="/directory"
              className="text-sm text-stone-500 hover:text-stone-700 transition-colors hidden sm:block"
            >
              Public Directory
            </Link>
            <NotificationBell />
            <ProfileDropdown accountHref="/dashboard/account" variant="light" dropDirection="down" />
          </div>
        </div>
      </header>
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        {children}
      </main>
    </div>
  );
}
