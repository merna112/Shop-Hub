import Link from 'next/link';
import { Product } from '@/lib/types';

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const imageUrl = product.images && product.images.length > 0
    ? product.images[0]
    : 'https://images.pexels.com/photos/90946/pexels-photo-90946.jpeg';

  return (
    <Link href={`/products/${product.id}`}>
      <div className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow overflow-hidden">
        <div className="relative h-48 bg-gray-100">
          <img
            src={imageUrl}
            alt={product.name}
            className="w-full h-full object-cover"
          />
          {product.stock === 0 && (
            <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
              <span className="text-white font-semibold">Out of Stock</span>
            </div>
          )}
        </div>
        <div className="p-4">
          <h3 className="font-semibold text-gray-900 truncate">{product.name}</h3>
          <p className="text-sm text-gray-500 mt-1 line-clamp-2">
            {product.description}
          </p>
          <div className="mt-3 flex items-center justify-between">
            <span className="text-xl font-bold text-blue-600">
              ${product.price.toFixed(2)}
            </span>
            <div className="flex items-center gap-1">
              <span className="text-yellow-500">★</span>
              <span className="text-sm text-gray-600">{product.rating.toFixed(1)}</span>
            </div>
          </div>
          {product.vendor && (
            <p className="text-xs text-gray-500 mt-2">
              by {product.vendor.business_name}
            </p>
          )}
        </div>
      </div>
    </Link>
  );
}
