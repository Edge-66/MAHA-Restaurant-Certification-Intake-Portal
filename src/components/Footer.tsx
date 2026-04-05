import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-stone-50 border-t border-stone-200 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-lg font-bold text-[#2d6a4f]">MAHA From the Farm</span>
            </div>
            <p className="text-sm text-stone-500">
              Certifying restaurants that prioritize local, sustainable sourcing
              from verified farms and producers.
            </p>
          </div>
          <div>
            <h3 className="font-semibold text-stone-700 mb-3 text-sm uppercase tracking-wider">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/apply" className="text-sm text-stone-500 hover:text-[#2d6a4f] transition-colors">
                  Apply for Certification
                </Link>
              </li>
              <li>
                <Link href="/restaurants" className="text-sm text-stone-500 hover:text-[#2d6a4f] transition-colors">
                  Certified Restaurants
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold text-stone-700 mb-3 text-sm uppercase tracking-wider">Contact</h3>
            <p className="text-sm text-stone-500">
              Questions about the certification program?<br />
              <a href="mailto:info@mahafromthefarm.com" className="text-[#2d6a4f] hover:underline">
                info@mahafromthefarm.com
              </a>
            </p>
          </div>
        </div>
        <div className="border-t border-stone-200 mt-8 pt-6 text-center">
          <p className="text-xs text-stone-400">
            © {new Date().getFullYear()} MAHA From the Farm. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
