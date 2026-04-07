'use client';

import ErrorDisplay from '@/components/ErrorDisplay';

export default function DashboardError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <ErrorDisplay
      heading="Dashboard error"
      message="Something went wrong loading your dashboard. Try again or return to the home page."
      reset={reset}
      homeHref="/"
      homeLabel="Go to Home"
    />
  );
}
