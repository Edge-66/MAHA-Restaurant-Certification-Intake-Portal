import Link from 'next/link';

// ─── CONTENT ────────────────────────────────────────────────────────────────
// Edit the sections below to update page copy without touching layout code.

const REQUIRED_PRACTICES = [
  'No added hormones or routine antibiotics (for animal products)',
  'No chemical preservatives in raw or minimally processed meat',
  'No synthetic dyes or artificial additives in the certified item',
  'No seed oils used in the preparation of the certified main element',
];

const ENCOURAGED_PRACTICES = [
  'Pasture-raised or free-range animal systems',
  'Rotational or managed grazing',
  'Cover cropping and soil-first growing practices',
  'Local or regional sourcing (within a defined radius)',
  'Crop diversity and heritage breed use',
  'Traceable, verifiable sourcing relationships',
  'Low-input or reduced-chemical growing methods',
];

const BONUS_PRACTICES = [
  'Family farm story and multi-generational stewardship',
  'Community relationships and direct-to-restaurant sales',
  'Animal care philosophy and living-condition descriptions',
  'Soil health commitment and carbon sequestration efforts',
  'Growing method transparency beyond the main element',
  'Conservation and habitat restoration practices',
];

const THIRD_PARTY_CERTS = [
  'USDA Organic',
  'Certified Humane',
  'Animal Welfare Approved (AWA)',
  'Non-GMO Project Verified',
  'American Grassfed Association (AGA) Certified',
  'Regenerative Organic Certified (ROC)',
];

const FAQS = [
  {
    q: 'Is the whole restaurant certified?',
    a: 'No. MAHA From the Farm is a dish-level certification. Only individual dishes whose main element meets MAHA standards are approved. The restaurant is listed because it has at least one certified dish.',
  },
  {
    q: 'What does "main element" mean?',
    a: 'The main element is the primary ingredient that defines a dish — typically the featured protein, dairy product, eggs, or primary produce component. For a grass-fed ribeye, the main element is the beef. For a farm egg appetizer, it is the eggs.',
  },
  {
    q: 'Do all ingredients in the dish have to qualify?',
    a: 'Not in the current program. MAHA reviews the main element only. Side dishes, sauces, garnishes, and supporting ingredients are not required to meet MAHA standards at this stage of the program.',
  },
  {
    q: 'How does MAHA verify claims?',
    a: 'Restaurants provide attestations and supplier information at the time of submission. MAHA may follow up directly with suppliers or farms, request documentation or photos, and may conduct random spot-checks. No costly in-person inspections are required.',
  },
  {
    q: 'Do farms need to be certified already?',
    a: 'No prior certification is required. Restaurants attest to their sourcing practices, and MAHA reviews those claims. However, existing third-party certifications (like USDA Organic or Certified Humane) can strengthen a submission and may be required for certain harder-to-verify claims.',
  },
  {
    q: 'Can a restaurant apply with just one dish?',
    a: 'Yes. There is no minimum number of dishes. A restaurant can submit a single dish and, if approved, will be listed in the MAHA directory with that dish highlighted.',
  },
  {
    q: 'What happens if sourcing changes after approval?',
    a: 'Restaurants are responsible for notifying MAHA if a supplier, sourcing relationship, or ingredient changes for a certified dish. Failure to update sourcing information may result in removal from the directory.',
  },
  {
    q: 'Can certification be revoked?',
    a: 'Yes. If a claim is found to be inaccurate, if sourcing changes without notification, or if a supplier no longer meets program standards, MAHA may remove individual dishes or a restaurant from the directory.',
  },
  {
    q: 'Will the standards evolve over time?',
    a: 'Yes. The current standards represent a practical V1 designed to be achievable, credible, and scalable. MAHA expects to refine both the required and encouraged practice criteria as the program develops.',
  },
  {
    q: 'Do farms need to agree to remote confirmation?',
    a: 'Farms do not apply directly in the current model — restaurants apply on behalf of the supplier relationship. However, MAHA may contact farms to confirm sourcing details, and cooperation is expected as part of participating in the program.',
  },
];

// ─── PAGE ────────────────────────────────────────────────────────────────────

export default function AboutCertificationPage() {
  return (
    <div className="bg-white">

      {/* ── Hero ── */}
      <section className="relative bg-[#1b4332] text-white overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center opacity-20"
          style={{ backgroundImage: "url('/maha2.avif')" }}
          aria-hidden="true"
        />
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-28">
          <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-4 py-1.5 text-sm font-medium mb-6">
            Certification Program
          </div>
          <h1 className="text-4xl md:text-5xl font-bold leading-tight mb-6">
            MAHA From the Farm<br className="hidden sm:block" /> Certification
          </h1>
          <p className="text-lg md:text-xl text-white/80 max-w-2xl leading-relaxed mb-8">
            A dish-level certification program that highlights restaurants serving food whose
            main ingredients come from farms using clean and regenerative practices —
            with full sourcing transparency for consumers.
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <Link
              href="/apply"
              className="bg-white text-[#1b4332] px-6 py-3 rounded-lg font-semibold hover:bg-stone-100 transition-colors text-center"
            >
              Apply Now
            </Link>
            <Link
              href="/directory"
              className="border border-white/40 text-white px-6 py-3 rounded-lg font-medium hover:bg-white/10 transition-colors text-center"
            >
              Browse the Directory
            </Link>
          </div>
        </div>
      </section>

      {/* ── Who it's for ── */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              title: 'For Restaurants',
              body: 'Showcase the real sourcing behind your dishes. Build credibility with guests who care where their food comes from.',
            },
            {
              title: 'For Farms',
              body: 'Get discovered by restaurants looking for clean, traceable suppliers. Tell the story behind how you raise and grow.',
            },
            {
              title: 'For Consumers',
              body: 'Find restaurants and dishes you can trust. See exactly where the main ingredient came from and how it was raised.',
            },
          ].map(({ title, body }) => (
            <div key={title} className="bg-stone-50 border border-stone-200 rounded-xl p-6">
              <h3 className="font-semibold text-stone-900 mb-2">{title}</h3>
              <p className="text-sm text-stone-600 leading-relaxed">{body}</p>
            </div>
          ))}
        </div>
      </section>

      <div className="border-t border-stone-100" />

      {/* ── How It Works ── */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <SectionLabel>Process</SectionLabel>
        <h2 className="text-3xl font-bold text-stone-900 mb-4">How It Works</h2>
        <p className="text-stone-600 mb-12 max-w-2xl">
          The process is designed to be straightforward for restaurants and farms while maintaining
          the credibility the certification is built on.
        </p>
        <div className="space-y-4">
          {[
            {
              step: '1',
              title: 'Restaurant submits dishes',
              body: 'The restaurant fills out an application for one or more dishes, providing the dish name, the main element (e.g., "grass-fed beef brisket"), and full supplier information including farm name, location, and any existing certifications.',
            },
            {
              step: '2',
              title: 'MAHA reviews the submission',
              body: 'MAHA reviews the main element of each dish against program standards. This may include following up with the supplier or requesting additional documentation. No in-person inspection is required.',
            },
            {
              step: '3',
              title: 'Approved dishes go public',
              body: 'Approved dishes are listed in the public MAHA directory, showing the dish name, main element, and full supplier sourcing information.',
            },
            {
              step: '4',
              title: 'Restaurant displays MAHA recognition',
              body: 'Participating restaurants can display their MAHA status on menus, websites, and in-location signage, linking back to the public directory for full transparency.',
            },
            {
              step: '5',
              title: 'Ongoing review',
              body: 'Certified dishes are subject to ongoing review. Restaurants are responsible for notifying MAHA if sourcing changes. MAHA may conduct spot-checks at any time.',
            },
          ].map(({ step, title, body }) => (
            <div key={step} className="flex gap-5">
              <div className="flex-shrink-0 w-9 h-9 bg-[#2d6a4f] text-white rounded-full flex items-center justify-center font-bold text-sm mt-0.5">
                {step}
              </div>
              <div className="pb-6 border-b border-stone-100 flex-1 last:border-0">
                <h3 className="font-semibold text-stone-900 mb-1">{title}</h3>
                <p className="text-sm text-stone-600 leading-relaxed">{body}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <div className="border-t border-stone-100" />

      {/* ── What Is a From the Farm Dish ── */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <SectionLabel>Scope</SectionLabel>
        <h2 className="text-3xl font-bold text-stone-900 mb-4">What Is a From the Farm Dish?</h2>
        <p className="text-stone-600 mb-8 max-w-2xl">
          MAHA certification is dish-level, not restaurant-level. That distinction is intentional.
        </p>
        <div className="bg-[#2d6a4f]/5 border border-[#2d6a4f]/20 rounded-xl p-6 mb-8">
          <h3 className="font-semibold text-stone-900 mb-2">The Main Element</h3>
          <p className="text-stone-700 text-sm leading-relaxed">
            Every certified dish has a <strong>main element</strong> — the primary ingredient that defines the dish.
            This is typically the featured protein, dairy product, eggs, or dominant produce component.
            MAHA reviews the main element only. Side dishes, sauces, garnishes, and supporting ingredients
            are <em>not</em> required to meet MAHA standards in the current program.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
          {[
            { dish: 'Grass-Fed Ribeye', element: 'Grass-fed beef ribeye' },
            { dish: 'Farm Egg Appetizer', element: 'Pasture-raised eggs' },
            { dish: 'Heritage Pork Chop', element: 'Heritage breed pork chop' },
          ].map(({ dish, element }) => (
            <div key={dish} className="border border-stone-200 rounded-lg p-4">
              <p className="font-medium text-stone-900 mb-1">{dish}</p>
              <p className="text-xs text-stone-500">Main element:</p>
              <p className="text-[#2d6a4f] font-medium text-xs mt-0.5">{element}</p>
            </div>
          ))}
        </div>
        <p className="text-xs text-stone-400 mt-4">
          Certification applies to the main element only. Other dish components are not evaluated in the current program.
        </p>
      </section>

      <div className="border-t border-stone-100" />

      {/* ── Standards ── */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <SectionLabel>Standards</SectionLabel>
        <h2 className="text-3xl font-bold text-stone-900 mb-4">Program Standards</h2>
        <p className="text-stone-600 mb-12 max-w-2xl">
          Standards are applied to the main element of each submitted dish. The tiers below
          reflect what MAHA requires, what strengthens a submission, and what tells a deeper story.
          Encouraged and bonus practices may evolve as the program develops.
        </p>

        <div className="space-y-6">
          {/* Required */}
          <div className="bg-white border border-stone-200 rounded-xl overflow-hidden">
            <div className="bg-[#1b4332] px-6 py-4">
              <h3 className="text-white font-semibold">Required Practices</h3>
              <p className="text-white/70 text-sm mt-0.5">
                These are the non-negotiables. A dish must meet all of these for its main element to be approved.
              </p>
            </div>
            <ul className="divide-y divide-stone-100">
              {REQUIRED_PRACTICES.map((p) => (
                <li key={p} className="flex items-start gap-3 px-6 py-3.5 text-sm text-stone-700">
                  <svg className="w-4 h-4 text-[#2d6a4f] mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  {p}
                </li>
              ))}
            </ul>
          </div>

          {/* Encouraged */}
          <div className="bg-white border border-stone-200 rounded-xl overflow-hidden">
            <div className="bg-stone-700 px-6 py-4">
              <h3 className="text-white font-semibold">Encouraged Practices</h3>
              <p className="text-white/70 text-sm mt-0.5">
                These are strong signals that support and strengthen a submission. They are not required but are
                given significant weight in review. This list may expand over time.
              </p>
            </div>
            <ul className="divide-y divide-stone-100">
              {ENCOURAGED_PRACTICES.map((p) => (
                <li key={p} className="flex items-start gap-3 px-6 py-3.5 text-sm text-stone-700">
                  <svg className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  {p}
                </li>
              ))}
            </ul>
          </div>

          {/* Bonus */}
          <div className="bg-white border border-stone-200 rounded-xl overflow-hidden">
            <div className="bg-stone-500 px-6 py-4">
              <h3 className="text-white font-semibold">Bonus / Narrative Practices</h3>
              <p className="text-white/70 text-sm mt-0.5">
                These are not approval requirements, but they help tell the farm's story and demonstrate
                stronger alignment with the MAHA mission. These may be featured in public listings.
              </p>
            </div>
            <ul className="divide-y divide-stone-100">
              {BONUS_PRACTICES.map((p) => (
                <li key={p} className="flex items-start gap-3 px-6 py-3.5 text-sm text-stone-700">
                  <svg className="w-4 h-4 text-stone-400 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                  </svg>
                  {p}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <div className="border-t border-stone-100" />

      {/* ── Verification ── */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <SectionLabel>Verification</SectionLabel>
        <h2 className="text-3xl font-bold text-stone-900 mb-4">How We Verify</h2>
        <p className="text-stone-600 mb-10 max-w-2xl">
          MAHA prioritizes practices that can be reasonably confirmed through remote or virtual methods,
          keeping the program accessible without sacrificing credibility.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-10">
          {[
            {
              title: 'Restaurant Attestation',
              body: 'Every applicant formally attests that the sourcing information provided is accurate. Misrepresentation may result in immediate removal and may be reported.',
            },
            {
              title: 'Supplier Transparency',
              body: 'Restaurants provide full supplier details including farm name, city, state, and website. This information is displayed publicly on approved listings.',
            },
            {
              title: 'Image-Based Verification',
              body: 'Restaurants are encouraged to submit photos of packaging, invoices, or farm documentation. Imagery may be requested as part of the review process.',
            },
            {
              title: 'Spot-Checks',
              body: 'MAHA may conduct random verification checks on approved listings at any time. This may include reviewing updated invoices, supplier contacts, or on-site visits in limited cases.',
            },
          ].map(({ title, body }) => (
            <div key={title} className="border border-stone-200 rounded-xl p-5">
              <h3 className="font-semibold text-stone-900 mb-1.5 text-sm">{title}</h3>
              <p className="text-sm text-stone-600 leading-relaxed">{body}</p>
            </div>
          ))}
        </div>

        {/* Third-party certs subsection */}
        <div className="bg-stone-50 border border-stone-200 rounded-xl p-6">
          <h3 className="font-semibold text-stone-900 mb-2">Third-Party Certifications</h3>
          <p className="text-sm text-stone-600 leading-relaxed mb-4">
            Some claims — particularly around organic status, animal welfare, or regenerative practices —
            may rely on existing third-party certifications for verification. While MAHA does not require
            prior certification, holding a recognized credential can satisfy harder-to-verify claims
            and strengthen a submission.
          </p>
          <p className="text-xs text-stone-500 mb-3 font-medium uppercase tracking-wide">Examples of accepted credentials</p>
          <div className="flex flex-wrap gap-2">
            {THIRD_PARTY_CERTS.map((c) => (
              <span key={c} className="text-xs px-3 py-1 rounded-full bg-white border border-stone-300 text-stone-700">
                {c}
              </span>
            ))}
          </div>
          <p className="text-xs text-stone-400 mt-4">
            Third-party certifications are referenced as supporting evidence only. MAHA makes no representations
            about the scope or coverage of any external certification body.
          </p>
        </div>
      </section>

      <div className="border-t border-stone-100" />

      {/* ── Public Transparency ── */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <SectionLabel>Transparency</SectionLabel>
        <h2 className="text-3xl font-bold text-stone-900 mb-4">What Gets Listed Publicly</h2>
        <p className="text-stone-600 mb-10 max-w-2xl">
          Approved restaurants and their certified dishes are displayed in the public MAHA directory.
          Transparency is a core part of the program — consumers can see exactly where a dish's main
          element comes from.
        </p>
        <div className="border border-stone-200 rounded-xl overflow-hidden">
          <div className="px-6 py-4 bg-stone-50 border-b border-stone-200">
            <p className="text-sm font-medium text-stone-700">Each approved listing includes:</p>
          </div>
          <ul className="divide-y divide-stone-100">
            {[
              'Restaurant name, city, and state',
              'Approved dish name and main element description',
              'Supplier / farm name and location',
              'Supplier certifications (if provided)',
              'Certification or approval date',
              'A public transparency statement',
            ].map((item) => (
              <li key={item} className="flex items-center gap-3 px-6 py-3.5 text-sm text-stone-700">
                <div className="w-1.5 h-1.5 rounded-full bg-[#2d6a4f] flex-shrink-0" />
                {item}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <div className="border-t border-stone-100" />

      {/* ── FAQ ── */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <SectionLabel>FAQ</SectionLabel>
        <h2 className="text-3xl font-bold text-stone-900 mb-10">Common Questions</h2>
        <div className="space-y-4">
          {FAQS.map(({ q, a }) => (
            <div key={q} className="border border-stone-200 rounded-xl p-6">
              <h3 className="font-semibold text-stone-900 mb-2 text-sm">{q}</h3>
              <p className="text-sm text-stone-600 leading-relaxed">{a}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="bg-[#1b4332]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">Ready to apply?</h2>
          <p className="text-white/70 mb-8 max-w-lg mx-auto">
            Submitting takes about 10 minutes per dish. You can apply with a single dish and add more later.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-3">
            <Link
              href="/apply"
              className="bg-white text-[#1b4332] px-8 py-3 rounded-lg font-semibold hover:bg-stone-100 transition-colors"
            >
              Apply Now
            </Link>
            <Link
              href="/directory"
              className="border border-white/30 text-white px-8 py-3 rounded-lg font-medium hover:bg-white/10 transition-colors"
            >
              Browse the Directory
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs font-semibold uppercase tracking-widest text-[#2d6a4f] mb-3">
      {children}
    </p>
  );
}
