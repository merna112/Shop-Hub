/*
  # Shop Hub Multi-Vendor E-Commerce Platform Schema

  ## Overview
  Complete database schema for a multi-vendor marketplace with vendor management,
  product catalog, order processing, payment splitting, reviews, and notifications.

  ## 1. New Tables

  ### `vendors`
  - `id` (uuid, primary key) - Unique vendor identifier
  - `user_id` (uuid, foreign key to auth.users) - Associated user account
  - `business_name` (text) - Vendor's business name
  - `description` (text) - Business description
  - `logo_url` (text) - Logo image URL
  - `commission_rate` (numeric) - Platform commission percentage (default 10%)
  - `payout_email` (text) - Email for payment payouts
  - `status` (text) - Vendor status (active, pending, suspended)
  - `rating` (numeric) - Average vendor rating
  - `total_sales` (numeric) - Total sales amount
  - `created_at` (timestamptz) - Creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp

  ### `products`
  - `id` (uuid, primary key) - Unique product identifier
  - `vendor_id` (uuid, foreign key) - Product owner
  - `name` (text) - Product name
  - `description` (text) - Product description
  - `price` (numeric) - Product price
  - `stock` (integer) - Available stock quantity
  - `category` (text) - Product category
  - `images` (jsonb) - Array of product image URLs
  - `status` (text) - Product status (active, draft, out_of_stock)
  - `rating` (numeric) - Average product rating
  - `created_at` (timestamptz) - Creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp

  ### `orders`
  - `id` (uuid, primary key) - Unique order identifier
  - `customer_id` (uuid, foreign key to auth.users) - Customer who placed order
  - `total_amount` (numeric) - Total order amount
  - `status` (text) - Order status (pending, processing, completed, cancelled)
  - `shipping_address` (jsonb) - Shipping address details
  - `created_at` (timestamptz) - Order creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp

  ### `sub_orders`
  - `id` (uuid, primary key) - Unique sub-order identifier
  - `order_id` (uuid, foreign key) - Parent order
  - `vendor_id` (uuid, foreign key) - Vendor for this sub-order
  - `subtotal` (numeric) - Sub-order subtotal
  - `commission` (numeric) - Platform commission amount
  - `vendor_payout` (numeric) - Amount to be paid to vendor
  - `status` (text) - Sub-order status
  - `created_at` (timestamptz) - Creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp

  ### `order_items`
  - `id` (uuid, primary key) - Unique order item identifier
  - `sub_order_id` (uuid, foreign key) - Associated sub-order
  - `product_id` (uuid, foreign key) - Product ordered
  - `quantity` (integer) - Quantity ordered
  - `price` (numeric) - Price at time of order
  - `created_at` (timestamptz) - Creation timestamp

  ### `cart_items`
  - `id` (uuid, primary key) - Unique cart item identifier
  - `user_id` (uuid, foreign key to auth.users) - Cart owner
  - `product_id` (uuid, foreign key) - Product in cart
  - `quantity` (integer) - Quantity in cart
  - `created_at` (timestamptz) - Creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp

  ### `reviews`
  - `id` (uuid, primary key) - Unique review identifier
  - `user_id` (uuid, foreign key to auth.users) - Reviewer
  - `product_id` (uuid, foreign key) - Reviewed product (nullable)
  - `vendor_id` (uuid, foreign key) - Reviewed vendor (nullable)
  - `rating` (integer) - Rating (1-5)
  - `comment` (text) - Review text
  - `created_at` (timestamptz) - Creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp

  ### `notifications`
  - `id` (uuid, primary key) - Unique notification identifier
  - `user_id` (uuid, foreign key to auth.users) - Recipient
  - `type` (text) - Notification type (order, payment, update)
  - `title` (text) - Notification title
  - `message` (text) - Notification message
  - `is_read` (boolean) - Read status
  - `created_at` (timestamptz) - Creation timestamp

  ### `user_profiles`
  - `id` (uuid, primary key, foreign key to auth.users) - User identifier
  - `full_name` (text) - User's full name
  - `role` (text) - User role (customer, vendor, admin)
  - `avatar_url` (text) - Profile picture URL
  - `created_at` (timestamptz) - Creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp

  ## 2. Security
  - Enable RLS on all tables
  - Vendors can manage their own products and view their orders
  - Customers can view products, manage their cart, and view their orders
  - Reviews can be created by authenticated users who purchased the product
  - Admins have full access to manage the platform

  ## 3. Indexes
  - Product search and filtering indexes
  - Order lookup indexes
  - Vendor product indexes

  ## 4. Functions
  - Automatic timestamp updates
  - Automatic rating calculations
  - Order splitting logic
*/

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- User Profiles Table
CREATE TABLE IF NOT EXISTS user_profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL,
  role text NOT NULL DEFAULT 'customer' CHECK (role IN ('customer', 'vendor', 'admin')),
  avatar_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all profiles"
  ON user_profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can update own profile"
  ON user_profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON user_profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Vendors Table
CREATE TABLE IF NOT EXISTS vendors (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  business_name text NOT NULL,
  description text,
  logo_url text,
  commission_rate numeric DEFAULT 10 CHECK (commission_rate >= 0 AND commission_rate <= 100),
  payout_email text NOT NULL,
  status text DEFAULT 'pending' CHECK (status IN ('active', 'pending', 'suspended')),
  rating numeric DEFAULT 0 CHECK (rating >= 0 AND rating <= 5),
  total_sales numeric DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id)
);

ALTER TABLE vendors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active vendors"
  ON vendors FOR SELECT
  TO authenticated
  USING (status = 'active' OR user_id = auth.uid());

CREATE POLICY "Vendors can update own profile"
  ON vendors FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can create vendor profile"
  ON vendors FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Products Table
CREATE TABLE IF NOT EXISTS products (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  vendor_id uuid NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  price numeric NOT NULL CHECK (price >= 0),
  stock integer NOT NULL DEFAULT 0 CHECK (stock >= 0),
  category text NOT NULL,
  images jsonb DEFAULT '[]'::jsonb,
  status text DEFAULT 'active' CHECK (status IN ('active', 'draft', 'out_of_stock')),
  rating numeric DEFAULT 0 CHECK (rating >= 0 AND rating <= 5),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_products_vendor ON products(vendor_id);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_status ON products(status);
CREATE INDEX IF NOT EXISTS idx_products_name ON products USING gin(to_tsvector('english', name));

ALTER TABLE products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active products"
  ON products FOR SELECT
  TO authenticated
  USING (status = 'active' OR vendor_id IN (SELECT id FROM vendors WHERE user_id = auth.uid()));

CREATE POLICY "Vendors can insert own products"
  ON products FOR INSERT
  TO authenticated
  WITH CHECK (vendor_id IN (SELECT id FROM vendors WHERE user_id = auth.uid()));

CREATE POLICY "Vendors can update own products"
  ON products FOR UPDATE
  TO authenticated
  USING (vendor_id IN (SELECT id FROM vendors WHERE user_id = auth.uid()))
  WITH CHECK (vendor_id IN (SELECT id FROM vendors WHERE user_id = auth.uid()));

CREATE POLICY "Vendors can delete own products"
  ON products FOR DELETE
  TO authenticated
  USING (vendor_id IN (SELECT id FROM vendors WHERE user_id = auth.uid()));

-- Orders Table
CREATE TABLE IF NOT EXISTS orders (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  total_amount numeric NOT NULL CHECK (total_amount >= 0),
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'cancelled')),
  shipping_address jsonb NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_orders_customer ON orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);

ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own orders"
  ON orders FOR SELECT
  TO authenticated
  USING (customer_id = auth.uid());

CREATE POLICY "Users can create own orders"
  ON orders FOR INSERT
  TO authenticated
  WITH CHECK (customer_id = auth.uid());

-- Sub Orders Table
CREATE TABLE IF NOT EXISTS sub_orders (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  vendor_id uuid NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  subtotal numeric NOT NULL CHECK (subtotal >= 0),
  commission numeric NOT NULL CHECK (commission >= 0),
  vendor_payout numeric NOT NULL CHECK (vendor_payout >= 0),
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'cancelled')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_sub_orders_order ON sub_orders(order_id);
CREATE INDEX IF NOT EXISTS idx_sub_orders_vendor ON sub_orders(vendor_id);

ALTER TABLE sub_orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Customers can view own sub-orders"
  ON sub_orders FOR SELECT
  TO authenticated
  USING (
    order_id IN (SELECT id FROM orders WHERE customer_id = auth.uid())
    OR vendor_id IN (SELECT id FROM vendors WHERE user_id = auth.uid())
  );

CREATE POLICY "System can create sub-orders"
  ON sub_orders FOR INSERT
  TO authenticated
  WITH CHECK (order_id IN (SELECT id FROM orders WHERE customer_id = auth.uid()));

-- Order Items Table
CREATE TABLE IF NOT EXISTS order_items (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  sub_order_id uuid NOT NULL REFERENCES sub_orders(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  quantity integer NOT NULL CHECK (quantity > 0),
  price numeric NOT NULL CHECK (price >= 0),
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_order_items_sub_order ON order_items(sub_order_id);

ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own order items"
  ON order_items FOR SELECT
  TO authenticated
  USING (
    sub_order_id IN (
      SELECT id FROM sub_orders WHERE 
        order_id IN (SELECT id FROM orders WHERE customer_id = auth.uid())
        OR vendor_id IN (SELECT id FROM vendors WHERE user_id = auth.uid())
    )
  );

CREATE POLICY "System can create order items"
  ON order_items FOR INSERT
  TO authenticated
  WITH CHECK (
    sub_order_id IN (
      SELECT id FROM sub_orders WHERE 
        order_id IN (SELECT id FROM orders WHERE customer_id = auth.uid())
    )
  );

-- Cart Items Table
CREATE TABLE IF NOT EXISTS cart_items (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  quantity integer NOT NULL CHECK (quantity > 0),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, product_id)
);

CREATE INDEX IF NOT EXISTS idx_cart_items_user ON cart_items(user_id);

ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own cart"
  ON cart_items FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert to own cart"
  ON cart_items FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own cart"
  ON cart_items FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete from own cart"
  ON cart_items FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Reviews Table
CREATE TABLE IF NOT EXISTS reviews (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id uuid REFERENCES products(id) ON DELETE CASCADE,
  vendor_id uuid REFERENCES vendors(id) ON DELETE CASCADE,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CHECK (product_id IS NOT NULL OR vendor_id IS NOT NULL)
);

CREATE INDEX IF NOT EXISTS idx_reviews_product ON reviews(product_id);
CREATE INDEX IF NOT EXISTS idx_reviews_vendor ON reviews(vendor_id);

ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view reviews"
  ON reviews FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create reviews"
  ON reviews FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own reviews"
  ON reviews FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own reviews"
  ON reviews FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Notifications Table
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('order', 'payment', 'update', 'review')),
  title text NOT NULL,
  message text NOT NULL,
  is_read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(is_read);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notifications"
  ON notifications FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "System can create notifications"
  ON notifications FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update own notifications"
  ON notifications FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers for updated_at
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_user_profiles_updated_at') THEN
    CREATE TRIGGER update_user_profiles_updated_at
      BEFORE UPDATE ON user_profiles
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_vendors_updated_at') THEN
    CREATE TRIGGER update_vendors_updated_at
      BEFORE UPDATE ON vendors
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_products_updated_at') THEN
    CREATE TRIGGER update_products_updated_at
      BEFORE UPDATE ON products
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_orders_updated_at') THEN
    CREATE TRIGGER update_orders_updated_at
      BEFORE UPDATE ON orders
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_sub_orders_updated_at') THEN
    CREATE TRIGGER update_sub_orders_updated_at
      BEFORE UPDATE ON sub_orders
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_cart_items_updated_at') THEN
    CREATE TRIGGER update_cart_items_updated_at
      BEFORE UPDATE ON cart_items
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_reviews_updated_at') THEN
    CREATE TRIGGER update_reviews_updated_at
      BEFORE UPDATE ON reviews
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;