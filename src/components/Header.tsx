'use client';

import Link from 'next/link';
import { Fraunces, Great_Vibes } from 'next/font/google';
import { useState, useEffect, useRef } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

const mahaWordmark = Fraunces({
  subsets: ['latin'],
  weight: ['600', '700'],
});
const greatVibes = Great_Vibes({ subsets: ['latin'], weight: '400' });

const BASE_NAV = [
  { label: 'Directory', href: '/directory' },
  { label: 'How It Works', href: '/about-certification' },
] as const;

export default function Header() {
  const [open, setOpen] = useState(false);
  const [dashboardHref, setDashboardHref] = useState<string | null>(null);
  const [accountHref, setAccountHref] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const router = useRouter();
  const isHome = pathname === '/';

  const navLinks = [
    ...BASE_NAV,
    ...(dashboardHref === null ? [{ label: 'Apply Now' as const, href: '/apply' as const }] : []),
  ];

  // Close on route change
  useEffect(() => { setOpen(false); }, [pathname]);

  // Auth: dashboard link only; Apply Now is for signed-out visitors (avoids duplicating Dashboard for admins, etc.)
  useEffect(() => {
    const supabase = createClient();
    function setDashboardForRole(profileRole: string | undefined) {
      if (profileRole === 'restaurant') {
        setDashboardHref('/dashboard/restaurant');
        setAccountHref('/dashboard/account');
      } else if (profileRole === 'farm') {
        setDashboardHref('/dashboard/farm');
        setAccountHref('/dashboard/account');
      } else {
        setDashboardHref('/admin/review-queue');
        setAccountHref('/admin/account');
      }
    }

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) {
        setDashboardHref(null);
        setAccountHref(null);
        return;
      }
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', session.user.id)
        .single();
      setDashboardForRole(profile?.role);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        setDashboardHref(null);
        setAccountHref(null);
        return;
      }
      supabase.from('profiles').select('role').eq('id', session.user.id).single().then(({ data: profile }) => {
        setDashboardForRole(profile?.role);
      });
    });
    return () => subscription.unsubscribe();
  }, []);

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

  async function handleSignOut() {
    setOpen(false);
    await createClient().auth.signOut();
    router.push('/login');
    router.refresh();
  }

  const menuItemClass = (href: string) =>
    `block px-4 py-2.5 text-sm font-medium transition-colors ${
      pathname === href
        ? 'text-[#2d6a4f] bg-[#2d6a4f]/5'
        : 'text-stone-700 hover:bg-stone-50 hover:text-stone-900'
    }`;

  return (
    <header className={`${isHome ? 'absolute' : 'relative'} top-0 left-0 right-0 z-50 border-b ${isHome ? 'bg-transparent border-white/10' : 'bg-[#2d6a4f] border-[#1b4332]'}`}>
      <div className="w-full pl-2 pr-2 sm:pl-3 sm:pr-3 md:pl-4 md:pr-4">
        <div className="flex justify-between items-center h-16 gap-2">

          {/* Logo */}
          <Link href="/" className="flex items-center gap-1.5 min-w-0 shrink">
            <span
              className={`${mahaWordmark.className} text-xl sm:text-[1.35rem] font-semibold text-white tracking-tight`}
            >
              MAHA
            </span>
            <span className={`${greatVibes.className} text-2xl font-normal text-green-200 leading-none`}>
              From the Farm
            </span>
          </Link>

          <div ref={menuRef} className="relative ml-auto shrink-0 -mr-0.5 sm:-mr-1">
            <button
              type="button"
              onClick={() => setOpen(!open)}
              aria-label="Toggle menu"
              aria-expanded={open}
              className="flex flex-col justify-center gap-[5px] w-10 h-10 rounded-lg hover:bg-white/10 transition-colors px-1.5"
            >
              <span className="block w-full h-[2px] bg-white rounded-full" />
              <span className="block w-full h-[2px] bg-white rounded-full" />
              <span className="block w-full h-[2px] bg-white rounded-full" />
            </button>

            {open && (
              <div className="absolute right-0 top-[calc(100%+4px)] z-50 w-56 bg-white border border-stone-200 rounded-xl shadow-lg overflow-hidden">
                <nav className="py-2">
                  {navLinks.map(({ label, href }) => (
                    <Link key={href} href={href} className={menuItemClass(href)} onClick={() => setOpen(false)}>
                      {label}
                    </Link>
                  ))}
                  <div className="my-2 border-t border-stone-100" />
                  <Link
                    href={dashboardHref ?? '/login'}
                    className={menuItemClass(dashboardHref ?? '/login')}
                    onClick={() => setOpen(false)}
                  >
                    {dashboardHref ? 'Dashboard' : 'Sign In'}
                  </Link>
                  {accountHref && (
                    <>
                      <div className="my-2 border-t border-stone-100" />
                      <Link href={accountHref} className={menuItemClass(accountHref)} onClick={() => setOpen(false)}>
                        Account
                      </Link>
                      <button
                        type="button"
                        onClick={() => void handleSignOut()}
                        className="w-full text-left px-4 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
                      >
                        Sign out
                      </button>
                    </>
                  )}
                </nav>
              </div>
            )}
          </div>

        </div>
      </div>
    </header>
  );
}
