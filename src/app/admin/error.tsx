'use client';

import ErrorDisplay from '@/components/ErrorDisplay';

export default function AdminError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <ErrorDisplay
      heading="Admin page error"
      message="Something went wrong loading this page. Try again or return to the admin dashboard."
      reset={reset}
      homeHref="/admin"
      homeLabel="Admin Dashboard"
    />
  );
}
