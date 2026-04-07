import Image from 'next/image';
import Link from 'next/link';
import Reveal from '@/components/Reveal';

export default function HomePage() {
  return (
    <div>
      {/* Hero */}
      <section className="relative text-white overflow-hidden -mt-16">
        <Image
          src="/mahahero.jpg"
          alt="Farm hero background"
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-br from-[#1b4332]/85 to-[#2d6a4f]/75" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-40 pb-24 md:pt-48 md:pb-32">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-1.5 rounded-full text-sm mb-6">
              <span>Farm-to-Table Certification Program</span>
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-6">
              Know Where Your Food{' '}
              <span className="text-green-300">Really</span> Comes From
            </h1>
            <p className="text-lg md:text-xl text-green-100 mb-10 leading-relaxed">
              MAHA From the Farm certifies restaurants that prioritize transparency,
              local sourcing, and verified farm-to-table practices. Every certified dish
              comes with full supplier transparency.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                href="/apply"
                className="bg-white text-[#1b4332] px-8 py-3.5 rounded-xl font-semibold text-center hover:bg-green-50 transition-colors"
              >
                Apply for Certification
              </Link>
              <Link
                href="/directory"
                className="border-2 border-white/30 text-white px-8 py-3.5 rounded-xl font-semibold text-center hover:bg-white/10 transition-colors"
              >
                Browse the Directory
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-12 md:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Reveal className="text-center mb-8 md:mb-14">
            <h2 className="text-2xl md:text-3xl font-bold text-stone-900 mb-4">How It Works</h2>
            <p className="text-stone-600 max-w-2xl mx-auto">
              Our certification program verifies that restaurants source their key
              ingredients from real, identifiable farms and producers.
            </p>
          </Reveal>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                step: '01',
                title: 'Apply',
                description:
                  'Restaurants submit their dishes with full supplier information for each main element.',
              },
              {
                step: '02',
                title: 'Verify',
                description:
                  'Our team reviews supplier claims, certifications, and sourcing practices for accuracy.',
              },
              {
                step: '03',
                title: 'Certify',
                description:
                  'Approved restaurants receive certification and are listed in our public directory with full transparency.',
              },
            ].map((step, i) => (
              <Reveal key={i} delay={i * 100}>
                <div className="bg-white border border-stone-200 rounded-xl p-8 hover:shadow-lg transition-shadow">
                  <div className="text-4xl font-black text-[#2d6a4f]/15 mb-3 leading-none">{step.step}</div>
                  <h3 className="text-xl font-semibold text-stone-900 mb-3">{step.title}</h3>
                  <p className="text-stone-600 text-sm leading-relaxed">{step.description}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Why It Matters */}
      <section className="py-12 md:py-20 bg-[#1b4332] text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Reveal className="text-center mb-10 md:mb-16">
            <h2 className="text-2xl md:text-3xl font-bold mb-4">Why Local Sourcing Matters</h2>
            <p className="text-green-200/80 max-w-2xl mx-auto">
              Every purchasing decision a restaurant makes is a vote for the kind of food system we want.
              MAHA From the Farm makes those decisions visible.
            </p>
          </Reveal>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: (
                  <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386-1.591 1.591M21 12h-2.25m-.386 6.364-1.591-1.591M12 18.75V21m-4.773-4.227-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0Z" />
                  </svg>
                ),
                title: 'Supports Local Economies',
                description: 'Dollars spent on local farms stay in the community, supporting livelihoods and building regional food resilience.',
              },
              {
                icon: (
                  <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
                  </svg>
                ),
                title: 'Verified Transparency',
                description: 'Every certified dish names the actual farm or producer behind it — no vague claims, no greenwashing.',
              },
              {
                icon: (
                  <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 0 0 8.716-6.747M12 21a9.004 9.004 0 0 1-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 0 1 7.843 4.582M12 3a8.997 8.997 0 0 0-7.843 4.582m15.686 0A11.953 11.953 0 0 1 12 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0 1 21 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0 1 12 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 0 1 3 12c0-1.605.42-3.113 1.157-4.418" />
                  </svg>
                ),
                title: 'Better for the Planet',
                description: 'Shorter supply chains mean lower emissions, fresher ingredients, and farming practices that work with — not against — the land.',
              },
            ].map((item, i) => (
              <Reveal key={i} delay={i * 100}>
                <div className="flex flex-col gap-4">
                  <div className="w-12 h-12 bg-[#2d6a4f] rounded-xl flex items-center justify-center text-green-300 flex-shrink-0">
                    {item.icon}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-2">{item.title}</h3>
                    <p className="text-green-200/70 text-sm leading-relaxed">{item.description}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Participation Levels */}
      <section className="py-12 md:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Reveal className="text-center mb-8 md:mb-14">
            <h2 className="text-2xl md:text-3xl font-bold text-stone-900 mb-4">Participation Levels</h2>
            <p className="text-stone-600 max-w-2xl mx-auto">
              Certification is dish-by-dish. The more you verify, the higher your recognition.
            </p>
          </Reveal>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <Reveal delay={0}>
              <div className="border-2 border-[#40916c] rounded-xl p-8 h-full">
                <div className="inline-flex items-center gap-2 bg-[#40916c]/10 text-[#40916c] text-xs font-semibold px-3 py-1 rounded-full mb-4">
                  Entry Level
                </div>
                <h3 className="text-xl font-bold text-stone-900 mb-3">From the Farm Participant</h3>
                <p className="text-stone-600 text-sm leading-relaxed mb-4">
                  Restaurants that submit one or more dishes with verified local sourcing.
                  Dishes are individually certified and displayed in our directory.
                </p>
                <ul className="space-y-2">
                  {['1+ certified dishes', 'Listed in public directory', 'Per-dish supplier transparency'].map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm text-stone-600">
                      <svg className="w-4 h-4 text-[#40916c] flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>
            <Reveal delay={100}>
              <div className="border-2 border-[#2d6a4f] rounded-xl p-8 bg-[#2d6a4f]/5 h-full">
                <div className="inline-flex items-center gap-2 bg-[#2d6a4f]/10 text-[#2d6a4f] text-xs font-semibold px-3 py-1 rounded-full mb-4">
                  Full Certification
                </div>
                <h3 className="text-xl font-bold text-stone-900 mb-3">MAHA Certified Restaurant</h3>
                <p className="text-stone-600 text-sm leading-relaxed mb-4">
                  Full restaurant certification for establishments that demonstrate
                  comprehensive farm-to-table practices across their entire menu.
                </p>
                <ul className="space-y-2">
                  {['7+ certified dishes', 'MAHA Certified badge', 'Featured in directory', 'Restaurant-level recognition'].map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm text-stone-600">
                      <svg className="w-4 h-4 text-[#2d6a4f] flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* For Farms */}
      <section className="py-12 md:py-20 bg-stone-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <Reveal>
              <div>
                <div className="inline-flex items-center gap-2 bg-[#2d6a4f]/10 text-[#2d6a4f] text-xs font-semibold px-3 py-1 rounded-full mb-5">
                  For Farms & Producers
                </div>
                <h2 className="text-2xl md:text-3xl font-bold text-stone-900 mb-4">
                  Get Your Farm on the Map
                </h2>
                <p className="text-stone-600 leading-relaxed mb-4">
                  When restaurants list your farm as a supplier on a certified dish, you become
                  part of the verified network. Register your farm to manage your profile
                  and connect with restaurants looking for local sourcing partners.
                </p>
                <p className="text-stone-600 leading-relaxed mb-8">
                  We verify farms and producers to ensure the integrity of every certification.
                  Your certifications, practices, and contact information are available to
                  restaurants in our network.
                </p>
                <Link
                  href="/apply"
                  className="inline-block bg-[#2d6a4f] text-white px-6 py-3 rounded-xl font-semibold hover:bg-[#1b4332] transition-colors text-sm"
                >
                  Register Your Farm
                </Link>
              </div>
            </Reveal>
            <Reveal delay={100}>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { label: 'Visibility', desc: 'Appear on certified dishes in the public directory' },
                  { label: 'Credibility', desc: 'Your practices and certifications are verified by MAHA' },
                  { label: 'Connections', desc: 'Be discovered by restaurants actively seeking local suppliers' },
                  { label: 'Control', desc: 'Manage your profile and sourcing information directly' },
                ].map((item, i) => (
                  <div key={i} className="bg-white border border-stone-200 rounded-xl p-5">
                    <h4 className="text-sm font-semibold text-stone-900 mb-1">{item.label}</h4>
                    <p className="text-xs text-stone-500 leading-relaxed">{item.desc}</p>
                  </div>
                ))}
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* What We Look For */}
      <section className="py-12 md:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Reveal className="text-center mb-8 md:mb-14">
            <h2 className="text-2xl md:text-3xl font-bold text-stone-900 mb-4">What We Look For</h2>
            <p className="text-stone-600 max-w-2xl mx-auto">
              Every dish submission is reviewed against a consistent set of sourcing standards.
              Here&apos;s what matters most.
            </p>
          </Reveal>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                icon: (
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
                  </svg>
                ),
                title: 'Identified Supplier',
                desc: 'The farm or producer behind each main ingredient must be named — no anonymous distributors.',
              },
              {
                icon: (
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 3c-1.2 5.4-5 7.8-5 11a5 5 0 0 0 10 0c0-3.2-3.8-5.6-5-11Z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 14v4" />
                  </svg>
                ),
                title: 'Local & Regional',
                desc: 'We prioritize suppliers within the region, supporting shorter supply chains and fresher ingredients.',
              },
              {
                icon: (
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                  </svg>
                ),
                title: 'Verifiable Practices',
                desc: 'Suppliers should be able to back up sourcing claims with documentation or certifications when asked.',
              },
              {
                icon: (
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0 1 12 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 0 1 6 18.719m12 0a5.971 5.971 0 0 0-.941-3.197m0 0A5.995 5.995 0 0 0 12 12.75a5.995 5.995 0 0 0-5.058 2.772m0 0a3 3 0 0 0-4.681 2.72 8.986 8.986 0 0 0 3.74.477m.94-3.197a5.971 5.971 0 0 0-.94 3.197M15 6.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm6 3a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Zm-13.5 0a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Z" />
                  </svg>
                ),
                title: 'Honest Representation',
                desc: 'Restaurants must accurately represent how dishes are prepared and what ingredients are truly local.',
              },
            ].map((item, i) => (
              <Reveal key={i} delay={i * 80}>
                <div className="bg-stone-50 border border-stone-100 rounded-xl p-6 h-full">
                  <div className="w-11 h-11 bg-[#2d6a4f]/10 rounded-xl flex items-center justify-center text-[#2d6a4f] mb-4">
                    {item.icon}
                  </div>
                  <h3 className="font-semibold text-stone-900 mb-2">{item.title}</h3>
                  <p className="text-sm text-stone-500 leading-relaxed">{item.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 md:py-24 bg-[#2d6a4f]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <Reveal>
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
              Ready to Showcase Your Sourcing?
            </h2>
            <p className="text-green-200/80 mb-10 max-w-xl mx-auto">
              Join the growing community of restaurants committed to transparency
              and local sourcing.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/apply"
                className="inline-block bg-white text-[#1b4332] px-8 py-3.5 rounded-xl font-semibold hover:bg-green-50 transition-colors"
              >
                Start Your Application
              </Link>
              <Link
                href="/directory"
                className="inline-block border-2 border-white/30 text-white px-8 py-3.5 rounded-xl font-semibold hover:bg-white/10 transition-colors"
              >
                Browse the Directory
              </Link>
            </div>
          </Reveal>
        </div>
      </section>
    </div>
  );
}
