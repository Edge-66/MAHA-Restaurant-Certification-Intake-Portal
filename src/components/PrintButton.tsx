'use client';

export default function PrintButton() {
  return (
    <button
      onClick={() => window.print()}
      className="bg-[#2d6a4f] text-white px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-[#1b4332] transition-colors"
    >
      Print card
    </button>
  );
}
