'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase';
import Navbar from '@/components/navbar';

export default function AdminPage() {
  const [stats, setStats] = useState({
    totalVendors: 0,
    totalProducts: 0,
    totalOrders: 0,
    totalRevenue: 0,
    platformCommission: 0,
  });
  const [vendors, setVendors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const { user, profile } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (profile && profile.role !== 'admin') {
      router.push('/');
      return;
    }

    if (user) {
      fetchDashboardData();
    }
  }, [user, profile]);

  const fetchDashboardData = async () => {
    try {
      const { data: vendorsData } = await supabase
        .from('vendors')
        .select('*')
        .order('created_at', { ascending: false });

      setVendors(vendorsData || []);

      const { data: productsData } = await supabase
        .from('products')
        .select('id');

      const { data: ordersData } = await supabase
        .from('orders')
        .select('total_amount');

      const { data: subOrdersData } = await supabase
        .from('sub_orders')
        .select('commission');

      const totalRevenue = ordersData?.reduce((sum, order) => sum + order.total_amount, 0) || 0;
      const platformCommission = subOrdersData?.reduce((sum, sub) => sum + sub.commission, 0) || 0;

      setStats({
        totalVendors: vendorsData?.length || 0,
        totalProducts: productsData?.length || 0,
        totalOrders: ordersData?.length || 0,
        totalRevenue,
        platformCommission,
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateVendorStatus = async (vendorId: string, status: 'active' | 'pending' | 'suspended') => {
    try {
      const { error } = await supabase
        .from('vendors')
        .update({ status })
        .eq('id', vendorId);

      if (error) throw error;

      setVendors(vendors.map(v =>
        v.id === vendorId ? { ...v, status } : v
      ));
    } catch (error) {
      console.error('Error updating vendor status:', error);
      alert('Failed to update vendor status');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex items-center justify-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-4xl font-bold mb-8 text-gray-900">Admin Dashboard</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h3 className="text-sm font-medium text-gray-500 mb-1">Total Vendors</h3>
            <p className="text-3xl font-bold text-gray-900">{stats.totalVendors}</p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h3 className="text-sm font-medium text-gray-500 mb-1">Total Products</h3>
            <p className="text-3xl font-bold text-gray-900">{stats.totalProducts}</p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h3 className="text-sm font-medium text-gray-500 mb-1">Total Orders</h3>
            <p className="text-3xl font-bold text-gray-900">{stats.totalOrders}</p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h3 className="text-sm font-medium text-gray-500 mb-1">Platform Revenue</h3>
            <p className="text-3xl font-bold text-green-600">
              ${stats.platformCommission.toFixed(2)}
            </p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-2xl font-bold text-gray-900">Vendor Management</h2>
          </div>

          <div className="p-6">
            {vendors.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No vendors registered yet</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Business Name</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Email</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Status</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Total Sales</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Rating</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {vendors.map((vendor) => (
                      <tr key={vendor.id} className="border-b border-gray-200 hover:bg-gray-50">
                        <td className="py-3 px-4">{vendor.business_name}</td>
                        <td className="py-3 px-4 text-sm text-gray-600">{vendor.payout_email}</td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            vendor.status === 'active' ? 'bg-green-100 text-green-800' :
                            vendor.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {vendor.status}
                          </span>
                        </td>
                        <td className="py-3 px-4">${vendor.total_sales.toFixed(2)}</td>
                        <td className="py-3 px-4">{vendor.rating.toFixed(1)} ★</td>
                        <td className="py-3 px-4">
                          <select
                            value={vendor.status}
                            onChange={(e) => updateVendorStatus(vendor.id, e.target.value as any)}
                            className="text-sm border border-gray-300 rounded px-2 py-1"
                          >
                            <option value="active">Active</option>
                            <option value="pending">Pending</option>
                            <option value="suspended">Suspended</option>
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm mt-8 p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Platform Insights</h2>
          <div className="space-y-3">
            <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
              <span className="text-gray-700">Total Platform Revenue</span>
              <span className="font-bold text-gray-900">${stats.totalRevenue.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
              <span className="text-gray-700">Platform Commission Earned</span>
              <span className="font-bold text-green-600">${stats.platformCommission.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
              <span className="text-gray-700">Vendor Payouts</span>
              <span className="font-bold text-blue-600">
                ${(stats.totalRevenue - stats.platformCommission).toFixed(2)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
