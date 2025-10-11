'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase';
import { Order, SubOrder } from '@/lib/types';
import Navbar from '@/components/navbar';

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [subOrders, setSubOrders] = useState<SubOrder[]>([]);
  const [loading, setLoading] = useState(true);

  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchOrders();
    }
  }, [user]);

  const fetchOrders = async () => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('customer_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOrders(data || []);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSubOrders = async (orderId: string) => {
    try {
      const { data, error } = await supabase
        .from('sub_orders')
        .select(`
          *,
          vendor:vendors(*),
          order_items(*, product:products(*))
        `)
        .eq('order_id', orderId);

      if (error) throw error;
      setSubOrders(data || []);
    } catch (error) {
      console.error('Error fetching sub-orders:', error);
    }
  };

  const handleOrderClick = (order: Order) => {
    setSelectedOrder(order);
    fetchSubOrders(order.id);
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-800',
      processing: 'bg-blue-100 text-blue-800',
      completed: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
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
        <h1 className="text-4xl font-bold mb-8 text-gray-900">Your Orders</h1>

        {orders.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <p className="text-gray-500 text-lg mb-4">You haven&apos;t placed any orders yet</p>
          </div>
        ) : (
          <div className="grid lg:grid-cols-2 gap-8">
            <div className="space-y-4">
              {orders.map((order) => (
                <div
                  key={order.id}
                  onClick={() => handleOrderClick(order)}
                  className={`bg-white rounded-lg shadow-sm p-6 cursor-pointer hover:shadow-md transition-shadow ${
                    selectedOrder?.id === order.id ? 'ring-2 ring-blue-500' : ''
                  }`}
                >
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        Order #{order.id.slice(0, 8)}
                      </h3>
                      <p className="text-sm text-gray-500">
                        {new Date(order.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(order.status)}`}>
                      {order.status}
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <p className="text-2xl font-bold text-gray-900">
                      ${order.total_amount.toFixed(2)}
                    </p>
                    <button className="text-blue-600 text-sm font-medium">
                      View Details →
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div>
              {selectedOrder ? (
                <div className="bg-white rounded-lg shadow-sm p-6 sticky top-8">
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">
                    Order Details
                  </h2>

                  <div className="mb-6">
                    <h3 className="font-semibold text-gray-900 mb-2">Shipping Address</h3>
                    <div className="text-sm text-gray-600 space-y-1">
                      <p>{selectedOrder.shipping_address.full_name}</p>
                      <p>{selectedOrder.shipping_address.address_line1}</p>
                      {selectedOrder.shipping_address.address_line2 && (
                        <p>{selectedOrder.shipping_address.address_line2}</p>
                      )}
                      <p>
                        {selectedOrder.shipping_address.city}, {selectedOrder.shipping_address.state}{' '}
                        {selectedOrder.shipping_address.zip_code}
                      </p>
                      <p>{selectedOrder.shipping_address.country}</p>
                      <p>{selectedOrder.shipping_address.phone}</p>
                    </div>
                  </div>

                  <div className="mb-6">
                    <h3 className="font-semibold text-gray-900 mb-4">Items by Vendor</h3>
                    <div className="space-y-4">
                      {subOrders.map((subOrder) => (
                        <div key={subOrder.id} className="border border-gray-200 rounded-lg p-4">
                          <div className="flex justify-between items-start mb-3">
                            <div>
                              <h4 className="font-semibold text-gray-900">
                                {subOrder.vendor?.business_name}
                              </h4>
                              <span className={`inline-block mt-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(subOrder.status)}`}>
                                {subOrder.status}
                              </span>
                            </div>
                            <p className="font-semibold text-gray-900">
                              ${subOrder.subtotal.toFixed(2)}
                            </p>
                          </div>

                          <div className="space-y-2">
                            {subOrder.order_items?.map((item) => (
                              <div key={item.id} className="flex justify-between text-sm">
                                <span className="text-gray-600">
                                  {item.product?.name} x {item.quantity}
                                </span>
                                <span className="text-gray-900">
                                  ${(item.price * item.quantity).toFixed(2)}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="border-t border-gray-200 pt-4">
                    <div className="flex justify-between font-bold text-gray-900 text-lg">
                      <span>Total</span>
                      <span>${selectedOrder.total_amount.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-white rounded-lg shadow-sm p-12 text-center">
                  <p className="text-gray-500">Select an order to view details</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
