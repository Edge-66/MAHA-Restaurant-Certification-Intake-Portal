'use client';

import Link from 'next/link';
import { Great_Vibes } from 'next/font/google';
import { useState, useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';

const greatVibes = Great_Vibes({ subsets: ['latin'], weight: '400' });

const NAV_ITEMS = [
  { label: 'Directory', href: '/directory' },
  { label: 'How It Works', href: '/about-certification' },
  { label: 'Apply Now', href: '/apply' },
];

export default function Header() {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const isHome = pathname === '/';

  // Close on route change
  useEffect(() => { setOpen(false); }, [pathname]);

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  return (
    <header className={`${isHome ? 'absolute' : 'relative'} top-0 left-0 right-0 z-50 border-b ${isHome ? 'bg-transparent border-white/10' : 'bg-[#2d6a4f] border-[#1b4332]'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-4">
        <div className="flex justify-between items-center h-16">

          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <span className="text-xl font-bold text-white">
              MAHA{' '}
              <span className={`${greatVibes.className} text-2xl font-normal text-green-200`}>
                From the Farm
              </span>
            </span>
          </Link>

          {/* Hamburger button — three horizontal lines */}
          <div ref={menuRef} className="ml-auto">
            <button
              onClick={() => setOpen(!open)}
              aria-label="Toggle menu"
              aria-expanded={open}
              className="flex flex-col justify-center gap-[5px] w-10 h-10 rounded-lg hover:bg-white/10 transition-colors px-2"
            >
              <span className="block w-full h-[2px] bg-white rounded-full" />
              <span className="block w-full h-[2px] bg-white rounded-full" />
              <span className="block w-full h-[2px] bg-white rounded-full" />
            </button>

            {/* Dropdown */}
            {open && (
              <div className="absolute right-4 sm:right-6 lg:right-8 top-[calc(100%+4px)] w-56 bg-white border border-stone-200 rounded-xl shadow-lg overflow-hidden">
                <nav className="py-2">
                  {NAV_ITEMS.map(({ label, href }) => (
                    <Link
                      key={href}
                      href={href}
                      className={`block px-4 py-2.5 text-sm font-medium transition-colors ${
                        pathname === href
                          ? 'text-[#2d6a4f] bg-[#2d6a4f]/5'
                          : 'text-stone-700 hover:bg-stone-50 hover:text-stone-900'
                      }`}
                    >
                      {label}
                    </Link>
                  ))}
                  <div className="my-2 border-t border-stone-100" />
                  <Link
                    href="/login"
                    className="block px-4 py-2.5 text-sm font-medium text-stone-700 hover:bg-stone-50 hover:text-stone-900 transition-colors"
                  >
                    Sign In
                  </Link>
                </nav>
              </div>
            )}
          </div>

        </div>
      </div>
    </header>
  );
}
