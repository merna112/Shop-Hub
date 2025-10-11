'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase';
import { CartItem } from '@/lib/types';
import Navbar from '@/components/navbar';

export default function CartPage() {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);

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
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCartItems(data || []);
    } catch (error) {
      console.error('Error fetching cart:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateQuantity = async (itemId: string, newQuantity: number) => {
    if (newQuantity < 1) return;

    try {
      const { error } = await supabase
        .from('cart_items')
        .update({ quantity: newQuantity })
        .eq('id', itemId);

      if (error) throw error;

      setCartItems(cartItems.map(item =>
        item.id === itemId ? { ...item, quantity: newQuantity } : item
      ));
    } catch (error) {
      console.error('Error updating quantity:', error);
    }
  };

  const removeItem = async (itemId: string) => {
    try {
      const { error } = await supabase
        .from('cart_items')
        .delete()
        .eq('id', itemId);

      if (error) throw error;

      setCartItems(cartItems.filter(item => item.id !== itemId));
    } catch (error) {
      console.error('Error removing item:', error);
    }
  };

  const total = cartItems.reduce((sum, item) =>
    sum + (item.product?.price || 0) * item.quantity, 0
  );

  const vendorGroups = cartItems.reduce((groups, item) => {
    const vendorId = item.product?.vendor_id || 'unknown';
    if (!groups[vendorId]) {
      groups[vendorId] = [];
    }
    groups[vendorId].push(item);
    return groups;
  }, {} as Record<string, CartItem[]>);

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
        <h1 className="text-4xl font-bold mb-8 text-gray-900">Shopping Cart</h1>

        {cartItems.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <p className="text-gray-500 text-lg mb-4">Your cart is empty</p>
            <button
              onClick={() => router.push('/marketplace')}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-blue-700"
            >
              Continue Shopping
            </button>
          </div>
        ) : (
          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              {Object.entries(vendorGroups).map(([vendorId, items]) => {
                const vendor = items[0].product?.vendor;
                return (
                  <div key={vendorId} className="bg-white rounded-lg shadow-sm p-6">
                    {vendor && (
                      <div className="mb-4 pb-4 border-b border-gray-200">
                        <h3 className="font-semibold text-gray-900">
                          From {vendor.business_name}
                        </h3>
                      </div>
                    )}

                    <div className="space-y-4">
                      {items.map((item) => (
                        <div key={item.id} className="flex gap-4">
                          <div className="w-24 h-24 bg-gray-200 rounded overflow-hidden flex-shrink-0">
                            {item.product?.images && item.product.images.length > 0 && (
                              <img
                                src={item.product.images[0]}
                                alt={item.product.name}
                                className="w-full h-full object-cover"
                              />
                            )}
                          </div>

                          <div className="flex-1">
                            <h4 className="font-semibold text-gray-900">
                              {item.product?.name}
                            </h4>
                            <p className="text-sm text-gray-500 mt-1">
                              ${item.product?.price.toFixed(2)} each
                            </p>

                            <div className="flex items-center gap-4 mt-3">
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                  className="w-8 h-8 flex items-center justify-center border border-gray-300 rounded hover:bg-gray-50"
                                >
                                  -
                                </button>
                                <span className="w-12 text-center">{item.quantity}</span>
                                <button
                                  onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                  className="w-8 h-8 flex items-center justify-center border border-gray-300 rounded hover:bg-gray-50"
                                >
                                  +
                                </button>
                              </div>

                              <button
                                onClick={() => removeItem(item.id)}
                                className="text-red-600 text-sm hover:text-red-700"
                              >
                                Remove
                              </button>
                            </div>
                          </div>

                          <div className="text-right">
                            <p className="font-semibold text-gray-900">
                              ${((item.product?.price || 0) * item.quantity).toFixed(2)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow-sm p-6 sticky top-8">
                <h3 className="text-xl font-bold text-gray-900 mb-4">Order Summary</h3>

                <div className="space-y-3 mb-6">
                  <div className="flex justify-between text-gray-600">
                    <span>Subtotal</span>
                    <span>${total.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>Shipping</span>
                    <span>Calculated at checkout</span>
                  </div>
                  <div className="border-t border-gray-200 pt-3 flex justify-between font-bold text-gray-900">
                    <span>Total</span>
                    <span>${total.toFixed(2)}</span>
                  </div>
                </div>

                <button
                  onClick={() => router.push('/checkout')}
                  className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700"
                >
                  Proceed to Checkout
                </button>

                <button
                  onClick={() => router.push('/marketplace')}
                  className="w-full mt-3 border border-gray-300 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-50"
                >
                  Continue Shopping
                </button>

                <div className="mt-6 text-sm text-gray-500">
                  <p className="mb-2">Your cart contains items from {Object.keys(vendorGroups).length} vendor(s)</p>
                  <p>Orders will be split automatically by vendor for faster processing</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
