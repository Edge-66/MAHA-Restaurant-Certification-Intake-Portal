'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

const navItems = [
  { href: '/admin', label: 'Dashboard' },
  { href: '/admin/submissions', label: 'Submissions' },
  { href: '/admin/farms', label: 'Farms' },
];

export default function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  }

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

      {/* Nav — horizontal scroll on mobile, vertical on desktop */}
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

      {/* Back to site + sign out — desktop */}
      <div className="hidden md:block p-4 border-t border-[#2d6a4f] space-y-2">
        <Link
          href="/"
          className="flex items-center gap-2 text-green-300 hover:text-white text-sm transition-colors"
        >
          ← Back to Site
        </Link>
        <button
          type="button"
          onClick={handleSignOut}
          className="w-full text-left text-green-300 hover:text-white text-sm transition-colors"
        >
          Sign Out
        </button>
      </div>

      {/* Mobile sign out */}
      <div className="md:hidden p-2 border-t border-[#2d6a4f]">
        <button
          type="button"
          onClick={handleSignOut}
          className="w-full px-3 py-2 rounded-lg text-sm text-green-200 hover:bg-[#2d6a4f]/50 hover:text-white transition-colors text-left"
        >
          Sign Out
        </button>
      </div>
    </aside>
  );
}
