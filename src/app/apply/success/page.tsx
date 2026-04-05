import Link from 'next/link';

export default function SuccessPage() {
  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-24 text-center">
      <div className="bg-white border border-stone-200 rounded-2xl p-10">
                <h1 className="text-3xl font-bold text-stone-900 mb-4">Application Submitted!</h1>
        <p className="text-stone-600 mb-2 leading-relaxed">
          Thank you for applying to the MAHA From the Farm certification program.
        </p>
        <p className="text-stone-600 mb-8 leading-relaxed">
          Our team will review your submission and verify the supplier information you
          provided. You&apos;ll hear from us within 5-7 business days.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/"
            className="bg-[#2d6a4f] text-white px-6 py-2.5 rounded-lg font-medium hover:bg-[#1b4332] transition-colors"
          >
            Return Home
          </Link>
          <Link
            href="/restaurants"
            className="border border-stone-300 text-stone-700 px-6 py-2.5 rounded-lg font-medium hover:bg-stone-50 transition-colors"
          >
            View Certified Restaurants
          </Link>
        </div>
      </div>
    </div>
  );
}
