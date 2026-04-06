import Image from 'next/image';
import Link from 'next/link';

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
          <div className="text-center mb-8 md:mb-14">
            <h2 className="text-2xl md:text-3xl font-bold text-stone-900 mb-4">How It Works</h2>
            <p className="text-stone-600 max-w-2xl mx-auto">
              Our certification program verifies that restaurants source their key
              ingredients from real, identifiable farms and producers.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: '',
                title: 'Apply',
                description:
                  'Restaurants submit their dishes with full supplier information for each main element.',
              },
              {
                icon: '',
                title: 'Verify',
                description:
                  'Our team reviews supplier claims, certifications, and sourcing practices for accuracy.',
              },
              {
                icon: '',
                title: 'Certify',
                description:
                  'Approved restaurants receive certification and are listed in our public directory with full transparency.',
              },
            ].map((step, i) => (
              <div
                key={i}
                className="bg-white border border-stone-200 rounded-xl p-8 text-center hover:shadow-lg transition-shadow"
              >
                <div className="text-4xl mb-4">{step.icon}</div>
                <h3 className="text-xl font-semibold text-stone-900 mb-3">{step.title}</h3>
                <p className="text-stone-600 text-sm leading-relaxed">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Participation Levels */}
      <section className="py-12 md:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8 md:mb-14">
            <h2 className="text-2xl md:text-3xl font-bold text-stone-900 mb-4">Participation Levels</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <div className="border-2 border-[#40916c] rounded-xl p-8">
                            <h3 className="text-xl font-bold text-stone-900 mb-2">From the Farm Participant</h3>
              <p className="text-stone-600 text-sm leading-relaxed">
                Restaurants that submit one or more dishes with verified local sourcing.
                Dishes are individually certified and displayed in our directory.
              </p>
            </div>
            <div className="border-2 border-[#2d6a4f] rounded-xl p-8 bg-[#2d6a4f]/5">
                            <h3 className="text-xl font-bold text-stone-900 mb-2">MAHA Certified Restaurant</h3>
              <p className="text-stone-600 text-sm leading-relaxed">
                Full restaurant certification for establishments that demonstrate
                comprehensive farm-to-table practices across their entire menu.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-12 md:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-stone-900 mb-4">
            Ready to Showcase Your Sourcing?
          </h2>
          <p className="text-stone-600 mb-8 max-w-xl mx-auto">
            Join the growing community of restaurants committed to transparency
            and local sourcing.
          </p>
          <Link
            href="/apply"
            className="inline-block bg-[#2d6a4f] text-white px-8 py-3.5 rounded-xl font-semibold hover:bg-[#1b4332] transition-colors"
          >
            Start Your Application
          </Link>
        </div>
      </section>
    </div>
  );
}
