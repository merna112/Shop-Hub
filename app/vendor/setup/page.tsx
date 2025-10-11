'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase';
import Navbar from '@/components/navbar';

export default function VendorSetupPage() {
  const [businessName, setBusinessName] = useState('');
  const [description, setDescription] = useState('');
  const [payoutEmail, setPayoutEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { user } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { error: vendorError } = await supabase
        .from('vendors')
        .insert({
          user_id: user?.id,
          business_name: businessName,
          description,
          payout_email: payoutEmail,
          status: 'active',
        });

      if (vendorError) throw vendorError;

      router.push('/vendor/dashboard');
    } catch (err: any) {
      setError(err.message || 'Failed to create vendor profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-2xl mx-auto px-4 py-16">
        <div className="bg-white rounded-lg shadow-sm p-8">
          <h1 className="text-3xl font-bold mb-2 text-gray-900">
            Set Up Your Vendor Profile
          </h1>
          <p className="text-gray-600 mb-8">
            Complete your vendor profile to start selling on Shop Hub
          </p>

          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Business Name *
              </label>
              <input
                type="text"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Business Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Tell customers about your business..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Payout Email *
              </label>
              <input
                type="email"
                value={payoutEmail}
                onChange={(e) => setPayoutEmail(e.target.value)}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="email@example.com"
              />
              <p className="text-sm text-gray-500 mt-1">
                This email will be used for receiving payments
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating Profile...' : 'Complete Setup'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
