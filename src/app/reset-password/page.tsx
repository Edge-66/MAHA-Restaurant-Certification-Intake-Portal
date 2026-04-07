'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';

function ResetForm() {
  const params = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState<'loading' | 'ready' | 'done' | 'error'>('loading');
  const [errorMsg, setErrorMsg] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const code = params.get('code');
    if (!code) {
      setErrorMsg('Invalid or missing reset link. Please request a new one.');
      setStatus('error');
      return;
    }
    createClient().auth.exchangeCodeForSession(code).then(({ error }) => {
      if (error) {
        setErrorMsg('This reset link has expired or already been used. Please request a new one.');
        setStatus('error');
      } else {
        setStatus('ready');
      }
    });
  }, [params]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg('');
    if (password.length < 8) { setErrorMsg('Password must be at least 8 characters.'); return; }
    if (password !== confirm) { setErrorMsg('Passwords do not match.'); return; }
    setSaving(true);
    const { error } = await createClient().auth.updateUser({ password });
    if (error) {
      setErrorMsg(error.message);
      setSaving(false);
      return;
    }
    setStatus('done');
    setTimeout(() => router.push('/login'), 3000);
  }

  const inp = 'w-full border border-stone-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#2d6a4f] focus:border-transparent outline-none';

  return (
    <div className="min-h-screen bg-stone-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-block text-lg font-bold text-[#2d6a4f]">MAHA From the Farm</Link>
        </div>

        <div className="bg-white border border-stone-200 rounded-2xl p-8 shadow-sm">
          {status === 'loading' && (
            <div className="flex items-center justify-center py-10 gap-3 text-stone-400">
              <div className="w-5 h-5 border-2 border-[#2d6a4f] border-t-transparent rounded-full animate-spin" />
              <span className="text-sm">Verifying reset link…</span>
            </div>
          )}

          {status === 'error' && (
            <div className="text-center py-4">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
                </svg>
              </div>
              <h2 className="text-lg font-semibold text-stone-900 mb-2">Link expired</h2>
              <p className="text-sm text-stone-500 mb-6">{errorMsg}</p>
              <Link href="/login" className="text-sm text-[#2d6a4f] hover:underline font-medium">Back to login</Link>
            </div>
          )}

          {status === 'done' && (
            <div className="text-center py-4">
              <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-lg font-semibold text-stone-900 mb-2">Password updated</h2>
              <p className="text-sm text-stone-500">Redirecting you to the login page…</p>
            </div>
          )}

          {status === 'ready' && (
            <>
              <h2 className="text-xl font-bold text-stone-900 mb-1">Set a new password</h2>
              <p className="text-sm text-stone-500 mb-6">Choose a strong password for your account.</p>

              {errorMsg && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm mb-4">{errorMsg}</div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-1">New Password</label>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={inp}
                    placeholder="At least 8 characters"
                    autoComplete="new-password"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-1">Confirm Password</label>
                  <input
                    type="password"
                    required
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    className={inp}
                    placeholder="Re-enter password"
                    autoComplete="new-password"
                  />
                </div>
                <button
                  type="submit"
                  disabled={saving}
                  className="w-full bg-[#2d6a4f] text-white py-2.5 rounded-xl font-semibold hover:bg-[#1b4332] transition-colors disabled:opacity-50 text-sm"
                >
                  {saving ? 'Updating…' : 'Update Password'}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-[#2d6a4f] border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <ResetForm />
    </Suspense>
  );
}
