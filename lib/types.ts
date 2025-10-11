export interface UserProfile {
  id: string;
  full_name: string;
  role: 'customer' | 'vendor' | 'admin';
  avatar_url?: string;
  created_at: string;
  updated_at: string;
}

export interface Vendor {
  id: string;
  user_id: string;
  business_name: string;
  description?: string;
  logo_url?: string;
  commission_rate: number;
  payout_email: string;
  status: 'active' | 'pending' | 'suspended';
  rating: number;
  total_sales: number;
  created_at: string;
  updated_at: string;
}

export interface Product {
  id: string;
  vendor_id: string;
  name: string;
  description?: string;
  price: number;
  stock: number;
  category: string;
  images: string[];
  status: 'active' | 'draft' | 'out_of_stock';
  rating: number;
  created_at: string;
  updated_at: string;
  vendor?: Vendor;
}

export interface Order {
  id: string;
  customer_id: string;
  total_amount: number;
  status: 'pending' | 'processing' | 'completed' | 'cancelled';
  shipping_address: {
    full_name: string;
    address_line1: string;
    address_line2?: string;
    city: string;
    state: string;
    zip_code: string;
    country: string;
    phone: string;
  };
  created_at: string;
  updated_at: string;
}

export interface SubOrder {
  id: string;
  order_id: string;
  vendor_id: string;
  subtotal: number;
  commission: number;
  vendor_payout: number;
  status: 'pending' | 'processing' | 'completed' | 'cancelled';
  created_at: string;
  updated_at: string;
  vendor?: Vendor;
  order_items?: OrderItem[];
}

export interface OrderItem {
  id: string;
  sub_order_id: string;
  product_id: string;
  quantity: number;
  price: number;
  created_at: string;
  product?: Product;
}

export interface CartItem {
  id: string;
  user_id: string;
  product_id: string;
  quantity: number;
  created_at: string;
  updated_at: string;
  product?: Product;
}

export interface Review {
  id: string;
  user_id: string;
  product_id?: string;
  vendor_id?: string;
  rating: number;
  comment?: string;
  created_at: string;
  updated_at: string;
  user?: UserProfile;
}

export interface Notification {
  id: string;
  user_id: string;
  type: 'order' | 'payment' | 'update' | 'review';
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
}
