'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase';
import { CartItem } from '@/lib/types';
import Navbar from '@/components/navbar';

export default function CheckoutPage() {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [shippingAddress, setShippingAddress] = useState({
    full_name: '',
    address_line1: '',
    address_line2: '',
    city: '',
    state: '',
    zip_code: '',
    country: 'USA',
    phone: '',
  });

  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (user) {
      fetchCart();
    }
  }, [user]);

  const fetchCart = async () => {
    try {
      const { data, error } = await supabase
        .from('cart_items')
        .select(`
          *,
          product:products(*, vendor:vendors(*))
        `)
        .eq('user_id', user?.id);

      if (error) throw error;
      if (!data || data.length === 0) {
        router.push('/cart');
        return;
      }
      setCartItems(data);
    } catch (error) {
      console.error('Error fetching cart:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setProcessing(true);

    try {
      const total = cartItems.reduce((sum, item) =>
        sum + (item.product?.price || 0) * item.quantity, 0
      );

      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          customer_id: user?.id,
          total_amount: total,
          status: 'pending',
          shipping_address: shippingAddress,
        })
        .select()
        .single();

      if (orderError) throw orderError;

      const vendorGroups = cartItems.reduce((groups, item) => {
        const vendorId = item.product?.vendor_id || '';
        if (!groups[vendorId]) {
          groups[vendorId] = {
            vendor: item.product?.vendor,
            items: [],
          };
        }
        groups[vendorId].items.push(item);
        return groups;
      }, {} as Record<string, { vendor: any; items: CartItem[] }>);

      for (const [vendorId, { vendor, items }] of Object.entries(vendorGroups)) {
        const subtotal = items.reduce((sum, item) =>
          sum + (item.product?.price || 0) * item.quantity, 0
        );

        const commissionRate = vendor?.commission_rate || 10;
        const commission = subtotal * (commissionRate / 100);
        const vendorPayout = subtotal - commission;

        const { data: subOrder, error: subOrderError } = await supabase
          .from('sub_orders')
          .insert({
            order_id: order.id,
            vendor_id: vendorId,
            subtotal,
            commission,
            vendor_payout: vendorPayout,
            status: 'pending',
          })
          .select()
          .single();

        if (subOrderError) throw subOrderError;

        for (const item of items) {
          const { error: itemError } = await supabase
            .from('order_items')
            .insert({
              sub_order_id: subOrder.id,
              product_id: item.product_id,
              quantity: item.quantity,
              price: item.product?.price || 0,
            });

          if (itemError) throw itemError;

          const newStock = (item.product?.stock || 0) - item.quantity;
          await supabase
            .from('products')
            .update({ stock: newStock })
            .eq('id', item.product_id);
        }

        await supabase
          .from('notifications')
          .insert({
            user_id: vendor.user_id,
            type: 'order',
            title: 'New Order Received',
            message: `You have a new order worth $${subtotal.toFixed(2)}`,
            is_read: false,
          });
      }

      await supabase
        .from('cart_items')
        .delete()
        .eq('user_id', user?.id);

      await supabase
        .from('notifications')
        .insert({
          user_id: user?.id,
          type: 'order',
          title: 'Order Placed Successfully',
          message: `Your order #${order.id.slice(0, 8)} has been placed successfully`,
          is_read: false,
        });

      router.push(`/orders`);
    } catch (error) {
      console.error('Error processing order:', error);
      alert('Failed to process order. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  const total = cartItems.reduce((sum, item) =>
    sum + (item.product?.price || 0) * item.quantity, 0
  );

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
        <h1 className="text-4xl font-bold mb-8 text-gray-900">Checkout</h1>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Shipping Address</h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={shippingAddress.full_name}
                    onChange={(e) => setShippingAddress({ ...shippingAddress, full_name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Address Line 1 *
                  </label>
                  <input
                    type="text"
                    required
                    value={shippingAddress.address_line1}
                    onChange={(e) => setShippingAddress({ ...shippingAddress, address_line1: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Address Line 2
                  </label>
                  <input
                    type="text"
                    value={shippingAddress.address_line2}
                    onChange={(e) => setShippingAddress({ ...shippingAddress, address_line2: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      City *
                    </label>
                    <input
                      type="text"
                      required
                      value={shippingAddress.city}
                      onChange={(e) => setShippingAddress({ ...shippingAddress, city: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      State *
                    </label>
                    <input
                      type="text"
                      required
                      value={shippingAddress.state}
                      onChange={(e) => setShippingAddress({ ...shippingAddress, state: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      ZIP Code *
                    </label>
                    <input
                      type="text"
                      required
                      value={shippingAddress.zip_code}
                      onChange={(e) => setShippingAddress({ ...shippingAddress, zip_code: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Country *
                    </label>
                    <input
                      type="text"
                      required
                      value={shippingAddress.country}
                      onChange={(e) => setShippingAddress({ ...shippingAddress, country: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone *
                  </label>
                  <input
                    type="tel"
                    required
                    value={shippingAddress.phone}
                    onChange={(e) => setShippingAddress({ ...shippingAddress, phone: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={processing}
                className="w-full mt-6 bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {processing ? 'Processing...' : 'Place Order'}
              </button>
            </form>
          </div>

          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm p-6 sticky top-8">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Order Summary</h3>

              <div className="space-y-3 mb-6">
                {cartItems.map((item) => (
                  <div key={item.id} className="flex justify-between text-sm">
                    <span className="text-gray-600">
                      {item.product?.name} x {item.quantity}
                    </span>
                    <span className="text-gray-900">
                      ${((item.product?.price || 0) * item.quantity).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>

              <div className="border-t border-gray-200 pt-4 space-y-2">
                <div className="flex justify-between font-bold text-gray-900">
                  <span>Total</span>
                  <span>${total.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
