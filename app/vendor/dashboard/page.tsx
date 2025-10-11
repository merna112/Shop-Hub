'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase';
import { Product, Vendor, SubOrder } from '@/lib/types';
import Navbar from '@/components/navbar';

export default function VendorDashboardPage() {
  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<SubOrder[]>([]);
  const [loading, setLoading] = useState(true);

  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (user) {
      fetchVendorData();
    }
  }, [user]);

  const fetchVendorData = async () => {
    try {
      const { data: vendorData, error: vendorError } = await supabase
        .from('vendors')
        .select('*')
        .eq('user_id', user?.id)
        .maybeSingle();

      if (vendorError) throw vendorError;

      if (!vendorData) {
        router.push('/vendor/setup');
        return;
      }

      setVendor(vendorData);

      const { data: productsData } = await supabase
        .from('products')
        .select('*')
        .eq('vendor_id', vendorData.id)
        .order('created_at', { ascending: false });

      setProducts(productsData || []);

      const { data: ordersData } = await supabase
        .from('sub_orders')
        .select(`
          *,
          order_items(*, product:products(*))
        `)
        .eq('vendor_id', vendorData.id)
        .order('created_at', { ascending: false })
        .limit(10);

      setOrders(ordersData || []);
    } catch (error) {
      console.error('Error fetching vendor data:', error);
    } finally {
      setLoading(false);
    }
  };

  const deleteProduct = async (productId: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return;

    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', productId);

      if (error) throw error;

      setProducts(products.filter(p => p.id !== productId));
    } catch (error) {
      console.error('Error deleting product:', error);
      alert('Failed to delete product');
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
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-gray-900">
              {vendor?.business_name}
            </h1>
            <p className="text-gray-600 mt-1">Vendor Dashboard</p>
          </div>
          <Link
            href="/vendor/products/new"
            className="bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-blue-700"
          >
            Add Product
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h3 className="text-sm font-medium text-gray-500 mb-1">Total Sales</h3>
            <p className="text-3xl font-bold text-gray-900">
              ${vendor?.total_sales.toFixed(2)}
            </p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h3 className="text-sm font-medium text-gray-500 mb-1">Products</h3>
            <p className="text-3xl font-bold text-gray-900">{products.length}</p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h3 className="text-sm font-medium text-gray-500 mb-1">Rating</h3>
            <p className="text-3xl font-bold text-gray-900">
              {vendor?.rating.toFixed(1)} ★
            </p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm mb-8">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-2xl font-bold text-gray-900">Your Products</h2>
          </div>

          <div className="p-6">
            {products.length === 0 ? (
              <p className="text-gray-500 text-center py-8">
                No products yet. Add your first product to start selling!
              </p>
            ) : (
              <div className="space-y-4">
                {products.map((product) => (
                  <div
                    key={product.id}
                    className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 bg-gray-200 rounded overflow-hidden">
                        {product.images && product.images.length > 0 && (
                          <img
                            src={product.images[0]}
                            alt={product.name}
                            className="w-full h-full object-cover"
                          />
                        )}
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{product.name}</h3>
                        <p className="text-sm text-gray-500">
                          ${product.price} • Stock: {product.stock} • {product.status}
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Link
                        href={`/vendor/products/${product.id}/edit`}
                        className="px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                      >
                        Edit
                      </Link>
                      <button
                        onClick={() => deleteProduct(product.id)}
                        className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-2xl font-bold text-gray-900">Recent Orders</h2>
          </div>

          <div className="p-6">
            {orders.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No orders yet</p>
            ) : (
              <div className="space-y-4">
                {orders.map((order) => (
                  <div
                    key={order.id}
                    className="p-4 border border-gray-200 rounded-lg"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="font-semibold text-gray-900">
                          Order #{order.id.slice(0, 8)}
                        </p>
                        <p className="text-sm text-gray-500">
                          {new Date(order.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                        {order.status}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <p className="text-gray-600">
                        Subtotal: ${order.subtotal.toFixed(2)}
                      </p>
                      <p className="text-green-600 font-semibold">
                        Your Payout: ${order.vendor_payout.toFixed(2)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
