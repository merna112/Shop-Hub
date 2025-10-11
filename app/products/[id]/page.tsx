'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase';
import { Product, Review } from '@/lib/types';
import Navbar from '@/components/navbar';

export default function ProductDetailPage() {
  const [product, setProduct] = useState<Product | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [addingToCart, setAddingToCart] = useState(false);

  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const productId = params.id as string;

  useEffect(() => {
    fetchProduct();
    fetchReviews();
  }, [productId]);

  const fetchProduct = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          vendor:vendors(*)
        `)
        .eq('id', productId)
        .maybeSingle();

      if (error) throw error;
      setProduct(data);
    } catch (error) {
      console.error('Error fetching product:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchReviews = async () => {
    const { data } = await supabase
      .from('reviews')
      .select(`
        *,
        user:user_profiles(full_name)
      `)
      .eq('product_id', productId)
      .order('created_at', { ascending: false });

    if (data) setReviews(data);
  };

  const addToCart = async () => {
    if (!user) {
      router.push('/auth/signin');
      return;
    }

    setAddingToCart(true);
    try {
      const { data: existingItem } = await supabase
        .from('cart_items')
        .select('*')
        .eq('user_id', user.id)
        .eq('product_id', productId)
        .maybeSingle();

      if (existingItem) {
        const { error } = await supabase
          .from('cart_items')
          .update({ quantity: existingItem.quantity + quantity })
          .eq('id', existingItem.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('cart_items')
          .insert({
            user_id: user.id,
            product_id: productId,
            quantity,
          });

        if (error) throw error;
      }

      alert('Added to cart!');
    } catch (error) {
      console.error('Error adding to cart:', error);
      alert('Failed to add to cart');
    } finally {
      setAddingToCart(false);
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

  if (!product) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 py-16 text-center">
          <h1 className="text-2xl font-bold text-gray-900">Product not found</h1>
        </div>
      </div>
    );
  }

  const imageUrl = product.images && product.images.length > 0
    ? product.images[0]
    : 'https://images.pexels.com/photos/90946/pexels-photo-90946.jpeg';

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="grid md:grid-cols-2 gap-8 p-8">
            <div>
              <img
                src={imageUrl}
                alt={product.name}
                className="w-full h-96 object-cover rounded-lg"
              />
            </div>

            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-4">
                {product.name}
              </h1>

              <div className="flex items-center gap-4 mb-4">
                <div className="flex items-center">
                  <span className="text-yellow-500 text-xl">★</span>
                  <span className="ml-1 text-gray-700">{product.rating.toFixed(1)}</span>
                  <span className="ml-2 text-gray-500">({reviews.length} reviews)</span>
                </div>
              </div>

              <div className="text-4xl font-bold text-blue-600 mb-6">
                ${product.price.toFixed(2)}
              </div>

              <p className="text-gray-600 mb-6">{product.description}</p>

              <div className="mb-6">
                <p className="text-sm text-gray-500 mb-2">
                  Category: <span className="text-gray-900 font-medium">{product.category}</span>
                </p>
                <p className="text-sm text-gray-500">
                  Stock: <span className="text-gray-900 font-medium">{product.stock} available</span>
                </p>
              </div>

              {product.vendor && (
                <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-500">Sold by</p>
                  <p className="font-semibold text-gray-900">{product.vendor.business_name}</p>
                  <div className="flex items-center mt-1">
                    <span className="text-yellow-500">★</span>
                    <span className="ml-1 text-sm text-gray-600">
                      {product.vendor.rating.toFixed(1)} vendor rating
                    </span>
                  </div>
                </div>
              )}

              <div className="flex gap-4 mb-8">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Quantity
                  </label>
                  <input
                    type="number"
                    min="1"
                    max={product.stock}
                    value={quantity}
                    onChange={(e) => setQuantity(parseInt(e.target.value))}
                    className="w-20 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <button
                onClick={addToCart}
                disabled={addingToCart || product.stock === 0}
                className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {addingToCart ? 'Adding...' : product.stock === 0 ? 'Out of Stock' : 'Add to Cart'}
              </button>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm mt-8 p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Customer Reviews</h2>

          {reviews.length === 0 ? (
            <p className="text-gray-500">No reviews yet. Be the first to review this product!</p>
          ) : (
            <div className="space-y-6">
              {reviews.map((review) => (
                <div key={review.id} className="border-b border-gray-200 pb-6 last:border-0">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="flex">
                      {[...Array(5)].map((_, i) => (
                        <span
                          key={i}
                          className={i < review.rating ? 'text-yellow-500' : 'text-gray-300'}
                        >
                          ★
                        </span>
                      ))}
                    </div>
                    <span className="text-sm text-gray-500">
                      by {review.user?.full_name || 'Anonymous'}
                    </span>
                  </div>
                  <p className="text-gray-700">{review.comment}</p>
                  <p className="text-xs text-gray-400 mt-2">
                    {new Date(review.created_at).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
