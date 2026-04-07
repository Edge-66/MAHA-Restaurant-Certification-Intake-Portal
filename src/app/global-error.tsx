'use client';

export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, fontFamily: 'system-ui, sans-serif', background: '#fafaf9' }}>
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div style={{ textAlign: 'center', maxWidth: '400px' }}>
            <div style={{ width: 56, height: 56, background: '#f5f5f4', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
              <svg width="28" height="28" fill="none" viewBox="0 0 24 24" stroke="#a8a29e" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
              </svg>
            </div>
            <h1 style={{ fontSize: '1.2rem', fontWeight: 600, color: '#1c1917', marginBottom: 8 }}>Something went wrong</h1>
            <p style={{ fontSize: '0.875rem', color: '#78716c', marginBottom: 28, lineHeight: 1.6 }}>
              An unexpected error occurred. Please try again.
            </p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
              <button
                onClick={reset}
                style={{ background: '#2d6a4f', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: 8, fontSize: '0.875rem', fontWeight: 500, cursor: 'pointer' }}
              >
                Try Again
              </button>
              <a
                href="/"
                style={{ border: '1px solid #d6d3d1', color: '#57534e', padding: '10px 20px', borderRadius: 8, fontSize: '0.875rem', fontWeight: 500, textDecoration: 'none' }}
              >
                Go to Home
              </a>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}
