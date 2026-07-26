-- KitchenSync Database Schema
-- PostgreSQL via Supabase

-- 1. Custom Enums
CREATE TYPE user_role AS ENUM ('customer', 'server', 'kitchen', 'manager');
CREATE TYPE table_status AS ENUM ('empty', 'seated', 'ordered', 'needs_bill', 'needs_cleaning');
CREATE TYPE order_status AS ENUM ('placed', 'received', 'cooking', 'ready', 'served', 'completed', 'cancelled');
CREATE TYPE payment_status AS ENUM ('unpaid', 'partial', 'paid');
CREATE TYPE reservation_status AS ENUM ('confirmed', 'seated', 'cancelled', 'no_show');
CREATE TYPE queue_status AS ENUM ('waiting', 'notified', 'seated', 'cancelled');
CREATE TYPE inventory_adjustment_reason AS ENUM ('order_deduction', 'manual_restock', 'waste_logged', 'correction');
CREATE TYPE forecast_basis AS ENUM ('cold_start_baseline', 'restaurant_trained');

-- 2. Core Tables

CREATE TABLE restaurants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  currency text NOT NULL DEFAULT 'USD',
  tax_rate numeric NOT NULL DEFAULT 0,
  service_charge_rate numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE users (
  id uuid PRIMARY KEY,
  restaurant_id uuid REFERENCES restaurants(id) ON DELETE SET NULL,
  role user_role NOT NULL DEFAULT 'customer',
  full_name text NOT NULL,
  phone text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE menu_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id uuid NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  name text NOT NULL,
  display_order int NOT NULL DEFAULT 0
);

CREATE TABLE menu_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id uuid NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  category_id uuid NOT NULL REFERENCES menu_categories(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text NOT NULL DEFAULT '',
  price numeric NOT NULL,
  image_url text,
  dietary_tags text[] NOT NULL DEFAULT '{}',
  is_available boolean NOT NULL DEFAULT true,
  is_manual_override boolean NOT NULL DEFAULT false,
  availability_window jsonb
);

CREATE TABLE ingredients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id uuid NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  name text NOT NULL,
  unit text NOT NULL,
  current_stock numeric NOT NULL DEFAULT 0,
  reorder_threshold numeric NOT NULL DEFAULT 0,
  supplier_name text
);

CREATE TABLE menu_item_ingredients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  menu_item_id uuid NOT NULL REFERENCES menu_items(id) ON DELETE CASCADE,
  ingredient_id uuid NOT NULL REFERENCES ingredients(id) ON DELETE CASCADE,
  quantity_required numeric NOT NULL,
  UNIQUE(menu_item_id, ingredient_id)
);

CREATE TABLE tables (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id uuid NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  label text NOT NULL,
  capacity int NOT NULL DEFAULT 4,
  status table_status NOT NULL DEFAULT 'empty'
);

CREATE TABLE orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id uuid NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  table_id uuid NOT NULL REFERENCES tables(id) ON DELETE CASCADE,
  customer_id uuid REFERENCES users(id) ON DELETE SET NULL,
  created_by_user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  status order_status NOT NULL DEFAULT 'placed',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  menu_item_id uuid NOT NULL REFERENCES menu_items(id) ON DELETE CASCADE,
  quantity int NOT NULL DEFAULT 1,
  special_request text,
  unit_price_at_order numeric NOT NULL
);

CREATE TABLE bills (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id uuid NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  table_id uuid NOT NULL REFERENCES tables(id) ON DELETE CASCADE,
  order_ids uuid[] NOT NULL DEFAULT '{}',
  subtotal numeric NOT NULL DEFAULT 0,
  tax_amount numeric NOT NULL DEFAULT 0,
  service_charge_amount numeric NOT NULL DEFAULT 0,
  total numeric NOT NULL DEFAULT 0,
  payment_status payment_status NOT NULL DEFAULT 'unpaid',
  payment_reference text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE reservations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id uuid NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  customer_name text NOT NULL,
  customer_phone text,
  party_size int NOT NULL,
  reserved_for timestamptz NOT NULL,
  table_id uuid REFERENCES tables(id) ON DELETE SET NULL,
  status reservation_status NOT NULL DEFAULT 'confirmed'
);

CREATE TABLE queue_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id uuid NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  customer_name text NOT NULL,
  customer_phone text,
  party_size int NOT NULL,
  joined_at timestamptz NOT NULL DEFAULT now(),
  status queue_status NOT NULL DEFAULT 'waiting'
);

CREATE TABLE inventory_adjustments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ingredient_id uuid NOT NULL REFERENCES ingredients(id) ON DELETE CASCADE,
  change_amount numeric NOT NULL,
  reason inventory_adjustment_reason NOT NULL,
  created_by_user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  order_id uuid REFERENCES orders(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE forecasts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id uuid NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  menu_item_id uuid NOT NULL REFERENCES menu_items(id) ON DELETE CASCADE,
  forecast_date date NOT NULL,
  predicted_quantity numeric NOT NULL,
  basis forecast_basis NOT NULL,
  generated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(restaurant_id, menu_item_id, forecast_date)
);

-- 3. Indexes

CREATE INDEX idx_menu_items_restaurant_category ON menu_items(restaurant_id, category_id);
CREATE INDEX idx_orders_restaurant_table_status ON orders(restaurant_id, table_id, status);
CREATE INDEX idx_orders_restaurant_created ON orders(restaurant_id, created_at);
CREATE INDEX idx_inventory_adjustments_ingredient_created ON inventory_adjustments(ingredient_id, created_at);
CREATE INDEX idx_menu_item_ingredients_ingredient ON menu_item_ingredients(ingredient_id);
CREATE INDEX idx_order_items_order ON order_items(order_id);
CREATE INDEX idx_bills_restaurant ON bills(restaurant_id);
CREATE INDEX idx_reservations_restaurant_date ON reservations(restaurant_id, reserved_for);
CREATE INDEX idx_queue_entries_restaurant ON queue_entries(restaurant_id);

-- 4. RPC: deduct_ingredient_stock (used by cascade service)

CREATE OR REPLACE FUNCTION deduct_ingredient_stock(
  p_ingredient_id uuid,
  p_amount numeric
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE ingredients
  SET current_stock = GREATEST(0, current_stock - p_amount)
  WHERE id = p_ingredient_id;
END;
$$;

-- 5. Trigger: auto-update orders.updated_at

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- 6. Row Level Security

ALTER TABLE restaurants ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE ingredients ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_item_ingredients ENABLE ROW LEVEL SECURITY;
ALTER TABLE tables ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE bills ENABLE ROW LEVEL SECURITY;
ALTER TABLE reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE queue_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_adjustments ENABLE ROW LEVEL SECURITY;
ALTER TABLE forecasts ENABLE ROW LEVEL SECURITY;

-- 6a. Restaurant-scoped policies (most tables)

CREATE POLICY restaurant_isolation ON restaurants
  FOR ALL USING (id IN (
    SELECT restaurant_id FROM users WHERE id = auth.uid()
  ));

CREATE POLICY restaurant_isolation ON menu_categories
  FOR ALL USING (restaurant_id IN (
    SELECT restaurant_id FROM users WHERE id = auth.uid()
  ));

CREATE POLICY restaurant_isolation ON menu_items
  FOR ALL USING (restaurant_id IN (
    SELECT restaurant_id FROM users WHERE id = auth.uid()
  ));

CREATE POLICY restaurant_isolation ON ingredients
  FOR ALL USING (restaurant_id IN (
    SELECT restaurant_id FROM users WHERE id = auth.uid()
  ));

CREATE POLICY restaurant_isolation ON menu_item_ingredients
  FOR ALL USING (menu_item_id IN (
    SELECT id FROM menu_items WHERE restaurant_id IN (
      SELECT restaurant_id FROM users WHERE id = auth.uid()
    )
  ));

CREATE POLICY restaurant_isolation ON tables
  FOR ALL USING (restaurant_id IN (
    SELECT restaurant_id FROM users WHERE id = auth.uid()
  ));

CREATE POLICY restaurant_isolation ON orders
  FOR ALL USING (restaurant_id IN (
    SELECT restaurant_id FROM users WHERE id = auth.uid()
  ));

CREATE POLICY restaurant_isolation ON order_items
  FOR ALL USING (order_id IN (
    SELECT id FROM orders WHERE restaurant_id IN (
      SELECT restaurant_id FROM users WHERE id = auth.uid()
    )
  ));

CREATE POLICY restaurant_isolation ON bills
  FOR ALL USING (restaurant_id IN (
    SELECT restaurant_id FROM users WHERE id = auth.uid()
  ));

CREATE POLICY restaurant_isolation ON reservations
  FOR ALL USING (restaurant_id IN (
    SELECT restaurant_id FROM users WHERE id = auth.uid()
  ));

CREATE POLICY restaurant_isolation ON queue_entries
  FOR ALL USING (restaurant_id IN (
    SELECT restaurant_id FROM users WHERE id = auth.uid()
  ));

CREATE POLICY restaurant_isolation ON inventory_adjustments
  FOR ALL USING (ingredient_id IN (
    SELECT id FROM ingredients WHERE restaurant_id IN (
      SELECT restaurant_id FROM users WHERE id = auth.uid()
    )
  ));

CREATE POLICY restaurant_isolation ON forecasts
  FOR ALL USING (restaurant_id IN (
    SELECT restaurant_id FROM users WHERE id = auth.uid()
  ));

-- 6b. Public customer menu access (no auth required)

CREATE POLICY public_menu_view ON menu_categories
  FOR SELECT USING (true);

CREATE POLICY public_menu_view ON menu_items
  FOR SELECT USING (true);

-- 6c. Users table: users can read/write their own record

CREATE POLICY users_self ON users
  FOR ALL USING (id = auth.uid());

CREATE POLICY users_staff_view ON users
  FOR SELECT USING (restaurant_id IN (
    SELECT restaurant_id FROM users WHERE id = auth.uid()
  ));
