'use client';

import Link from 'next/link';
import { Great_Vibes } from 'next/font/google';
import { useState } from 'react';

const greatVibes = Great_Vibes({ subsets: ['latin'], weight: '400' });

export default function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="bg-white border-b border-stone-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-xl font-bold text-[#2d6a4f]">
              MAHA{' '}
              <span className={`${greatVibes.className} text-2xl font-normal text-stone-600`}>
                From the Farm
              </span>
            </span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden sm:flex items-center gap-6">
            <Link
              href="/directory"
              className="text-stone-600 hover:text-[#2d6a4f] transition-colors text-sm font-medium"
            >
              Directory
            </Link>
            <Link
              href="/apply"
              className="bg-[#2d6a4f] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#1b4332] transition-colors"
            >
              Apply Now
            </Link>
          </nav>

          {/* Mobile hamburger */}
          <button
            className="sm:hidden p-2 text-stone-600 hover:text-stone-900 transition-colors"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? (
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="sm:hidden border-t border-stone-100 bg-white px-4 py-3 flex flex-col gap-1">
          <Link
            href="/directory"
            onClick={() => setMobileOpen(false)}
            className="block px-3 py-3 text-sm font-medium text-stone-700 hover:bg-stone-50 rounded-lg transition-colors"
          >
            Directory
          </Link>
          <Link
            href="/apply"
            onClick={() => setMobileOpen(false)}
            className="block px-3 py-3 text-sm font-medium text-white bg-[#2d6a4f] hover:bg-[#1b4332] rounded-lg text-center transition-colors"
          >
            Apply Now
          </Link>
        </div>
      )}
    </header>
  );
}
