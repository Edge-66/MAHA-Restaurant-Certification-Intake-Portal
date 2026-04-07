'use client';

import { useEffect, useRef, useState } from 'react';
import { getMyNotifications, markAllNotificationsRead, type AppNotification } from '@/lib/actions';

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loaded, setLoaded] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    getMyNotifications().then((n) => { setNotifications(n); setLoaded(true); });
  }, []);

  // Close on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    if (open) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const unread = notifications.filter((n) => !n.read).length;

  function handleOpen() {
    setOpen((v) => !v);
    if (!open && unread > 0) {
      markAllNotificationsRead().then(() => {
        setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      });
    }
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={handleOpen}
        aria-label="Notifications"
        className="relative flex items-center justify-center w-9 h-9 rounded-lg hover:bg-stone-100 transition-colors text-stone-500 hover:text-stone-700"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0" />
        </svg>
        {loaded && unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex items-center justify-center w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full leading-none">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-white border border-stone-200 rounded-xl shadow-xl overflow-hidden z-50">
          <div className="px-4 py-3 border-b border-stone-100 flex items-center justify-between">
            <span className="text-sm font-semibold text-stone-900">Notifications</span>
            {unread > 0 && (
              <span className="text-xs text-stone-400">{unread} unread</span>
            )}
          </div>

          {!loaded ? (
            <div className="px-4 py-8 text-center text-sm text-stone-400">Loading…</div>
          ) : notifications.length === 0 ? (
            <div className="px-4 py-8 text-center">
              <svg className="w-8 h-8 text-stone-200 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0" />
              </svg>
              <p className="text-sm text-stone-400">No notifications yet</p>
            </div>
          ) : (
            <ul className="max-h-80 overflow-y-auto divide-y divide-stone-50">
              {notifications.map((n) => (
                <li key={n.id}>
                  {n.link ? (
                    <a href={n.link} onClick={() => setOpen(false)} className={`block px-4 py-3.5 hover:bg-stone-50 transition-colors ${!n.read ? 'bg-[#2d6a4f]/[0.03]' : ''}`}>
                      <NotifItem n={n} />
                    </a>
                  ) : (
                    <div className={`px-4 py-3.5 ${!n.read ? 'bg-[#2d6a4f]/[0.03]' : ''}`}>
                      <NotifItem n={n} />
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

function NotifItem({ n }: { n: AppNotification }) {
  return (
    <>
      <div className="flex items-start justify-between gap-2">
        <p className={`text-sm leading-snug ${n.read ? 'text-stone-600' : 'text-stone-900 font-medium'}`}>{n.title}</p>
        {!n.read && <span className="w-2 h-2 rounded-full bg-[#2d6a4f] flex-shrink-0 mt-1.5" />}
      </div>
      {n.body && <p className="text-xs text-stone-500 mt-0.5 line-clamp-2 leading-relaxed">{n.body}</p>}
      <p className="text-xs text-stone-400 mt-1">{timeAgo(n.created_at)}</p>
    </>
  );
}
