'use client';

import ErrorDisplay from '@/components/ErrorDisplay';

export default function Error({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <ErrorDisplay
      reset={reset}
      homeHref="/"
      homeLabel="Go to Home"
    />
  );
}
