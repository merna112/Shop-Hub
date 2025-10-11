'use client';

import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';

export default function Navbar() {
  const { user, profile, signOut } = useAuth();
  const router = useRouter();

  const handleSignOut = async () => {
    await signOut();
    router.push('/');
  };

  return (
    <nav className="bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <Link href="/" className="text-2xl font-bold text-blue-600">
            Shop Hub
          </Link>

          <div className="flex items-center gap-6">
            {user ? (
              <>
                <Link href="/marketplace" className="text-gray-700 hover:text-blue-600">
                  Marketplace
                </Link>

                {profile?.role === 'vendor' && (
                  <Link href="/vendor/dashboard" className="text-gray-700 hover:text-blue-600">
                    Vendor Dashboard
                  </Link>
                )}

                {profile?.role === 'admin' && (
                  <Link href="/admin" className="text-gray-700 hover:text-blue-600">
                    Admin
                  </Link>
                )}

                <Link href="/cart" className="text-gray-700 hover:text-blue-600">
                  Cart
                </Link>

                <Link href="/orders" className="text-gray-700 hover:text-blue-600">
                  Orders
                </Link>

                <Link href="/notifications" className="text-gray-700 hover:text-blue-600">
                  Notifications
                </Link>

                <button
                  onClick={handleSignOut}
                  className="text-gray-700 hover:text-red-600"
                >
                  Sign Out
                </button>
              </>
            ) : (
              <>
                <Link href="/auth/signin" className="text-gray-700 hover:text-blue-600">
                  Sign In
                </Link>
                <Link
                  href="/auth/signup"
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
