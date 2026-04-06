'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import ProfileDropdown from '@/components/ProfileDropdown';

const navItems = [
  { href: '/admin', label: 'Dashboard' },
  { href: '/admin/submissions', label: 'Submissions' },
  { href: '/admin/farms', label: 'Farms' },
];

const publicItems = [
  { href: '/directory', label: 'Directory' },
  { href: '/about-certification', label: 'How It Works' },
];

export default function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="bg-[#1b4332] text-white md:w-64 md:min-h-screen flex-shrink-0">
      {/* Brand */}
      <div className="px-4 md:px-6 py-4 md:py-6 border-b border-[#2d6a4f] flex items-center justify-between md:block">
        <Link href="/admin">
          <div className="font-bold text-sm">MAHA Admin</div>
          <div className="text-xs text-green-300 hidden md:block">From the Farm</div>
        </Link>
        <Link href="/" className="md:hidden text-green-300 hover:text-white text-xs transition-colors">
          ← Site
        </Link>
      </div>

      {/* Nav */}
      <nav className="p-2 md:flex-1 md:p-4 overflow-x-auto">
        <ul className="flex md:flex-col gap-1 md:space-y-1">
          {navItems.map((item) => {
            const isActive =
              item.href === '/admin'
                ? pathname === '/admin'
                : pathname.startsWith(item.href);
            return (
              <li key={item.href} className="flex-shrink-0">
                <Link
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2 md:py-2.5 rounded-lg text-sm transition-colors whitespace-nowrap ${
                    isActive
                      ? 'bg-[#2d6a4f] text-white'
                      : 'text-green-200 hover:bg-[#2d6a4f]/50 hover:text-white'
                  }`}
                >
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Public site links — desktop only */}
      <div className="hidden md:block px-4 pb-2 pt-4 border-t border-[#2d6a4f]">
        <p className="text-xs font-semibold text-green-500 uppercase tracking-wider mb-2 px-1">Public Site</p>
        <ul className="space-y-1">
          {publicItems.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-green-200 hover:bg-[#2d6a4f]/50 hover:text-white transition-colors"
              >
                {item.label}
                <svg className="w-3 h-3 ml-auto opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
              </Link>
            </li>
          ))}
        </ul>
      </div>

      {/* Desktop footer */}
      <div className="hidden md:block p-4 border-t border-[#2d6a4f]">
        <Link
          href="/"
          className="flex items-center gap-2 text-green-300 hover:text-white text-sm transition-colors mb-4"
        >
          ← Back to Site
        </Link>
        <div className="flex items-center gap-3">
          <ProfileDropdown accountHref="/admin/account" variant="dark" dropDirection="up" />
          <span className="text-xs text-green-400 truncate">Account</span>
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
