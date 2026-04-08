'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import ProfileDropdown from '@/components/ProfileDropdown';

const STORAGE_KEY = 'maha-admin-sidebar-collapsed';

type NavItem = { href: string; label: string; icon: React.ReactNode };

function IconDashboard({ className = 'w-5 h-5 shrink-0' }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25A2.25 2.25 0 0113.5 8.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25v-2.25z" />
    </svg>
  );
}

function IconInbox({ className = 'w-5 h-5 shrink-0' }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
    </svg>
  );
}

function IconShield({ className = 'w-5 h-5 shrink-0' }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
    </svg>
  );
}

function IconUsers({ className = 'w-5 h-5 shrink-0' }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.09 9.09 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 004.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
    </svg>
  );
}

/** Building / venue — restaurant admin */
function IconRestaurant({ className = 'w-5 h-5 shrink-0' }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21"
      />
    </svg>
  );
}

/** Home / farmstead — farmer admin */
function IconFarmer({ className = 'w-5 h-5 shrink-0' }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75"
      />
    </svg>
  );
}

/** Archive / ledger — canonical application archive */
function IconArchive({ className = 'w-5 h-5 shrink-0' }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z"
      />
    </svg>
  );
}

/** Minimal list lines — stays crisp at 16px (no tall pin stem) */
function IconGlobe({ className = 'w-4 h-4 shrink-0' }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 7.5h6M4.5 12h15M4.5 16.5h10" />
    </svg>
  );
}

/** Small help circle */
function IconBook({ className = 'w-4 h-4 shrink-0' }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
    </svg>
  );
}

const navItems: NavItem[] = [
  { href: '/admin/review-queue', label: 'Review queue', icon: <IconInbox /> },
  { href: '/admin', label: 'Dashboard', icon: <IconDashboard /> },
  { href: '/admin/restaurants', label: 'Restaurant admin', icon: <IconRestaurant /> },
  { href: '/admin/farmers', label: 'Farmer admin', icon: <IconFarmer /> },
];

const archiveNavItem: NavItem = {
  href: '/admin/submissions',
  label: 'All applications',
  icon: <IconArchive />,
};

const tier3Items: NavItem[] = [
  { href: '/admin/permissions', label: 'Permissions', icon: <IconShield /> },
  { href: '/admin/accounts', label: 'Accounts', icon: <IconUsers /> },
];

const publicItems: NavItem[] = [
  { href: '/directory', label: 'Directory', icon: <IconGlobe /> },
  { href: '/about-certification', label: 'How It Works', icon: <IconBook /> },
];

export default function AdminSidebar({ adminTier = 1 }: { adminTier?: number }) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      setCollapsed(localStorage.getItem(STORAGE_KEY) === '1');
    } catch {
      /* ignore */
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(STORAGE_KEY, collapsed ? '1' : '0');
    } catch {
      /* ignore */
    }
  }, [collapsed, hydrated]);

  function isActive(href: string) {
    if (href === '/admin/review-queue') {
      return (
        pathname === '/admin/review-queue' ||
        pathname === '/admin/farms/pending' ||
        /^\/admin\/farms\/[^/]+\/review\/?$/.test(pathname)
      );
    }
    if (href === '/admin') {
      return pathname === '/admin';
    }
    if (href === '/admin/restaurants') {
      return pathname === '/admin/restaurants' || pathname.startsWith('/admin/restaurants/');
    }
    if (href === '/admin/farmers') {
      return pathname === '/admin/farmers' || pathname.startsWith('/admin/farms');
    }
    if (href === '/admin/submissions') {
      return pathname.startsWith('/admin/submissions');
    }
    return pathname.startsWith(href);
  }

  const linkClass = (href: string) =>
    `flex items-center gap-3 px-3 py-2 md:py-2.5 rounded-lg text-sm transition-colors whitespace-nowrap ${
      collapsed ? 'md:justify-center md:px-2 md:gap-0' : ''
    } ${
      isActive(href)
        ? 'bg-[#2d6a4f] text-white'
        : 'text-green-200 hover:bg-[#2d6a4f]/50 hover:text-white'
    }`;

  const asideWidth = collapsed
    ? 'md:w-[4.25rem] md:min-w-[4.25rem]'
    : 'md:w-64 md:min-w-[16rem]';

  return (
    <aside
      className={`bg-[#1b4332] text-white md:min-h-screen flex-shrink-0 transition-[width,min-width] duration-200 ease-out ${asideWidth}`}
    >
      {/* Brand + toggle */}
      <div className="px-4 md:px-3 py-4 md:py-4 border-b border-[#2d6a4f] flex items-center gap-2 justify-between">
        <Link
          href="/admin/review-queue"
          title="MAHA Admin"
          className="min-w-0 flex-1 md:flex-1 text-left"
        >
          <div className="md:hidden">
            <div className="font-bold text-sm">MAHA Admin</div>
          </div>
          <div className={`hidden md:block ${collapsed ? 'md:hidden' : ''}`}>
            <div className="font-bold text-sm">MAHA Admin</div>
            <div className="text-xs text-green-300">From the Farm</div>
          </div>
          <div
            className={`hidden ${collapsed ? 'md:flex' : ''} md:mx-auto md:w-9 md:h-9 md:rounded-lg md:bg-[#2d6a4f] md:items-center md:justify-center md:text-sm md:font-bold`}
            aria-hidden
          >
            M
          </div>
        </Link>
        <button
          type="button"
          onClick={() => setCollapsed((c) => !c)}
          className="hidden md:inline-flex shrink-0 items-center justify-center rounded-lg p-2 text-green-300 hover:bg-[#2d6a4f]/50 hover:text-white transition-colors"
          aria-expanded={!collapsed}
          aria-controls="admin-sidebar-nav"
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? (
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
            </svg>
          ) : (
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
          )}
        </button>
        <Link href="/" className="md:hidden text-green-300 hover:text-white text-xs transition-colors shrink-0">
          ← Site
        </Link>
      </div>

      {/* Nav */}
      <nav id="admin-sidebar-nav" className="p-2 md:flex-1 md:p-3 overflow-x-auto">
        <ul className="flex md:flex-col gap-1 md:space-y-1">
          {navItems.map((item) => (
            <li key={item.href} className="flex-shrink-0">
              <Link href={item.href} className={linkClass(item.href)} title={item.label}>
                {item.icon}
                <span className={collapsed ? 'md:hidden' : ''}>{item.label}</span>
              </Link>
            </li>
          ))}
        </ul>

        <div className={`mt-4 pt-4 border-t border-[#2d6a4f] ${collapsed ? 'md:mt-3 md:pt-3' : ''}`}>
          <ul className="flex md:flex-col gap-1 md:space-y-1">
            <li className="flex-shrink-0">
              <Link
                href={archiveNavItem.href}
                className={linkClass(archiveNavItem.href)}
                title={archiveNavItem.label}
              >
                {archiveNavItem.icon}
                <span className={collapsed ? 'md:hidden' : ''}>{archiveNavItem.label}</span>
              </Link>
            </li>
          </ul>
        </div>

        {adminTier >= 3 && (
          <div className={`hidden md:block mt-6 ${collapsed ? 'md:mt-4' : ''}`}>
            <p
              className={`text-xs font-semibold text-green-500 uppercase tracking-wider mb-2 px-1 ${
                collapsed ? 'md:hidden' : ''
              }`}
            >
              Super Admin
            </p>
            <ul className="space-y-1">
              {tier3Items.map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className={linkClass(item.href)} title={item.label}>
                    {item.icon}
                    <span className={collapsed ? 'md:hidden' : ''}>{item.label}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}

        {adminTier >= 3 && (
          <ul className="flex md:hidden gap-1 mt-1">
            {tier3Items.map((item) => (
              <li key={item.href} className="flex-shrink-0">
                <Link href={item.href} className={linkClass(item.href)} title={item.label}>
                  {item.icon}
                  <span className={collapsed ? 'md:hidden' : ''}>{item.label}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </nav>

      {/* Public site links — desktop only */}
      <div className={`hidden md:block px-3 pb-2 pt-4 border-t border-[#2d6a4f] ${collapsed ? 'px-2' : 'px-3'}`}>
        <p
          className={`text-xs font-semibold text-green-500 uppercase tracking-wider mb-2 px-1 ${
            collapsed ? 'md:hidden' : ''
          }`}
        >
          Public Site
        </p>
        <ul className="space-y-px">
          {publicItems.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                target="_blank"
                rel="noopener noreferrer"
                title={`${item.label} (opens in new tab)`}
                className={`flex w-full items-center rounded-lg text-sm text-green-200/95 hover:bg-[#2d6a4f]/50 hover:text-white transition-colors ${
                  collapsed
                    ? 'justify-center px-2 py-2'
                    : 'gap-2 px-3 py-1.5'
                }`}
              >
                {item.icon}
                <span
                  className={`truncate text-left leading-tight ${
                    collapsed ? 'md:hidden' : 'inline-flex items-baseline gap-1'
                  }`}
                >
                  {item.label}
                  {!collapsed && (
                    <span className="text-[0.65rem] text-green-400/70 font-normal" aria-hidden>
                      ↗
                    </span>
                  )}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>

      {/* Desktop footer */}
      <div className={`hidden md:block p-3 border-t border-[#2d6a4f] ${collapsed ? 'px-2' : ''}`}>
        <Link
          href="/"
          title="Back to site"
          className={`flex items-center gap-2 text-green-300 hover:text-white text-sm transition-colors mb-4 ${
            collapsed ? 'md:justify-center md:mb-3' : ''
          }`}
        >
          <span className={collapsed ? 'md:hidden' : ''}>← Back to Site</span>
          <svg
            className={`w-5 h-5 shrink-0 ${collapsed ? 'hidden md:block' : 'hidden'}`}
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.75}
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
          </svg>
        </Link>
        <div className={`flex items-center gap-3 min-w-0 ${collapsed ? 'md:justify-center' : ''}`}>
          <ProfileDropdown accountHref="/admin/account" variant="dark" dropDirection="up" />
          <Link
            href="/admin/account"
            className={`text-xs text-green-400 hover:text-white truncate transition-colors underline-offset-2 hover:underline ${collapsed ? 'md:hidden' : ''}`}
          >
            Account
          </Link>
        </div>
      </div>

      {/* Mobile footer */}
      <div className="md:hidden p-2 border-t border-[#2d6a4f] flex items-center justify-between px-3">
        <Link href="/" className="text-sm text-green-200 hover:text-white transition-colors">
          ← Site
        </Link>
        <ProfileDropdown accountHref="/admin/account" variant="dark" dropDirection="up" />
      </div>
    </aside>
  );
}
