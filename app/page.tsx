import Link from 'next/link';
import Navbar from '@/components/navbar';

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main>
        <div className="relative bg-gradient-to-r from-blue-600 to-blue-800 text-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
            <div className="text-center">
              <h1 className="text-5xl font-bold mb-6">
                Welcome to Shop Hub
              </h1>
              <p className="text-xl mb-8 text-blue-100">
                Your one-stop multi-vendor marketplace for everything you need
              </p>
              <div className="flex gap-4 justify-center">
                <Link
                  href="/marketplace"
                  className="bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-blue-50 transition-colors"
                >
                  Browse Products
                </Link>
                <Link
                  href="/auth/signup"
                  className="bg-blue-700 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-800 transition-colors border-2 border-white"
                >
                  Become a Vendor
                </Link>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <h2 className="text-3xl font-bold text-center mb-12 text-gray-900">
            Why Choose Shop Hub?
          </h2>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <div className="text-4xl mb-4">🛍️</div>
              <h3 className="text-xl font-semibold mb-2 text-gray-900">
                Multiple Vendors
              </h3>
              <p className="text-gray-600">
                Shop from thousands of vendors all in one place with a unified shopping experience
              </p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm">
              <div className="text-4xl mb-4">💳</div>
              <h3 className="text-xl font-semibold mb-2 text-gray-900">
                Secure Payments
              </h3>
              <p className="text-gray-600">
                Automated payment splitting ensures vendors get paid quickly and securely
              </p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm">
              <div className="text-4xl mb-4">⭐</div>
              <h3 className="text-xl font-semibold mb-2 text-gray-900">
                Reviews & Ratings
              </h3>
              <p className="text-gray-600">
                Make informed decisions with reviews from real customers
              </p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm">
              <div className="text-4xl mb-4">🔍</div>
              <h3 className="text-xl font-semibold mb-2 text-gray-900">
                Easy Search
              </h3>
              <p className="text-gray-600">
                Find exactly what you need with powerful search and filtering
              </p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm">
              <div className="text-4xl mb-4">🚀</div>
              <h3 className="text-xl font-semibold mb-2 text-gray-900">
                Fast Shipping
              </h3>
              <p className="text-gray-600">
                Get your orders quickly with our optimized vendor network
              </p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm">
              <div className="text-4xl mb-4">🔔</div>
              <h3 className="text-xl font-semibold mb-2 text-gray-900">
                Real-time Updates
              </h3>
              <p className="text-gray-600">
                Stay informed with notifications about your orders and deliveries
              </p>
            </div>
          </div>
        </div>

        <div className="bg-blue-600 text-white py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl font-bold mb-4">
              Ready to Start Selling?
            </h2>
            <p className="text-xl mb-8 text-blue-100">
              Join thousands of vendors already selling on Shop Hub
            </p>
            <Link
              href="/auth/signup"
              className="inline-block bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-blue-50 transition-colors"
            >
              Create Vendor Account
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
