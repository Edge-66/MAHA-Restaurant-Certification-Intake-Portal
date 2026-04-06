'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

interface Props {
  accountHref: string;
  /** 'dark' = admin sidebar (green bg), 'light' = dashboard header (white bg) */
  variant?: 'dark' | 'light';
  /** Which direction the dropdown opens */
  dropDirection?: 'up' | 'down';
}

function getInitials(email: string) {
  const local = email.split('@')[0];
  const parts = local.split(/[._-]/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return local.slice(0, 2).toUpperCase();
}

export default function ProfileDropdown({
  accountHref,
  variant = 'light',
  dropDirection = 'down',
}: Props) {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState('');
  const ref = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    createClient()
      .auth.getUser()
      .then(({ data }) => {
        if (data.user?.email) setEmail(data.user.email);
      });
  }, []);

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    if (open) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  async function handleSignOut() {
    await createClient().auth.signOut();
    router.push('/login');
    router.refresh();
  }

  const initials = email ? getInitials(email) : '…';

  const avatarClass =
    variant === 'dark'
      ? 'bg-[#2d6a4f] text-white border border-[#52b788] hover:bg-[#40916c]'
      : 'bg-stone-200 text-stone-700 hover:bg-stone-300';

  const dropPos =
    dropDirection === 'up'
      ? 'bottom-full mb-2 left-0'
      : 'top-full mt-2 right-0';

  const panelClass =
    variant === 'dark'
      ? 'bg-[#112d21] border-[#2d6a4f] text-white'
      : 'bg-white border-stone-200 text-stone-900';

  const itemClass =
    variant === 'dark'
      ? 'text-green-200 hover:bg-[#2d6a4f]/50 hover:text-white'
      : 'text-stone-700 hover:bg-stone-50 hover:text-stone-900';

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        title={email || 'Account'}
        className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors border ${avatarClass}`}
      >
        {initials}
      </button>

      {open && (
        <div
          className={`absolute ${dropPos} z-50 w-56 rounded-xl shadow-lg border overflow-hidden ${panelClass}`}
        >
          {/* Email header */}
          <div className={`px-4 py-3 border-b ${variant === 'dark' ? 'border-[#2d6a4f]' : 'border-stone-100'}`}>
            <p className={`text-xs mb-0.5 ${variant === 'dark' ? 'text-green-400' : 'text-stone-400'}`}>
              Signed in as
            </p>
            <p className="text-sm font-medium truncate">{email}</p>
          </div>

          {/* Links */}
          <nav className="py-1">
            <Link
              href={accountHref}
              onClick={() => setOpen(false)}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm transition-colors ${itemClass}`}
            >
              Account Settings
            </Link>
            <div className={`my-1 border-t ${variant === 'dark' ? 'border-[#2d6a4f]' : 'border-stone-100'}`} />
            <button
              onClick={handleSignOut}
              className={`w-full flex items-center gap-2 px-4 py-2.5 text-sm transition-colors ${
                variant === 'dark' ? 'text-red-400 hover:bg-red-900/30' : 'text-red-600 hover:bg-red-50'
              }`}
            >
              Sign Out
            </button>
          </nav>
        </div>
      )}
    </div>
  );
}
