'use client';

import { useEffect } from 'react';
import { trackAdminSession } from '@/lib/adminAudit';

export default function AdminSessionTracker() {
  useEffect(() => {
    trackAdminSession();
  }, []);
  return null;
}
