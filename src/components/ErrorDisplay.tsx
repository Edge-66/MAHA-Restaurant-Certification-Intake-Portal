'use client';

import Link from 'next/link';

interface Props {
  heading?: string;
  message?: string;
  homeHref?: string;
  homeLabel?: string;
  reset?: () => void;
}

export default function ErrorDisplay({
  heading = 'Something went wrong',
  message = 'An unexpected error occurred. You can try again or return to the home page.',
  homeHref = '/',
  homeLabel = 'Go to Home',
  reset,
}: Props) {
  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="w-14 h-14 bg-stone-100 rounded-full flex items-center justify-center mx-auto mb-5">
          <svg className="w-7 h-7 text-stone-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
          </svg>
        </div>
        <h1 className="text-xl font-semibold text-stone-900 mb-2">{heading}</h1>
        <p className="text-sm text-stone-500 mb-8 leading-relaxed">{message}</p>
        <div className="flex items-center justify-center gap-3 flex-wrap">
          {reset && (
            <button
              onClick={reset}
              className="bg-[#2d6a4f] text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-[#1b4332] transition-colors"
            >
              Try Again
            </button>
          )}
          <Link
            href={homeHref}
            className="border border-stone-300 text-stone-600 px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-stone-50 transition-colors"
          >
            {homeLabel}
          </Link>
        </div>
      </div>
    </div>
  );
}
