export type UserRole = 'customer' | 'server' | 'kitchen' | 'manager'

export type TableStatus = 'empty' | 'seated' | 'ordered' | 'needs_bill' | 'needs_cleaning'

export type OrderStatus = 'placed' | 'received' | 'cooking' | 'ready' | 'served' | 'completed' | 'cancelled'

export type PaymentStatus = 'unpaid' | 'partial' | 'paid'

export type ReservationStatus = 'confirmed' | 'seated' | 'cancelled' | 'no_show'

export type QueueStatus = 'waiting' | 'notified' | 'seated' | 'cancelled'

export type InventoryAdjustmentReason = 'order_deduction' | 'manual_restock' | 'waste_logged' | 'correction'

export type ForecastBasis = 'cold_start_baseline' | 'restaurant_trained'

export interface Restaurant {
  id: string
  name: string
  slug: string
  currency: string
  tax_rate: number
  service_charge_rate: number
  created_at: string
}

export interface User {
  id: string
  restaurant_id: string | null
  role: UserRole
  full_name: string
  phone: string | null
  created_at: string
}

export interface MenuCategory {
  id: string
  restaurant_id: string
  name: string
  display_order: number
}

export interface MenuItem {
  id: string
  restaurant_id: string
  category_id: string
  name: string
  description: string
  price: number
  image_url: string | null
  dietary_tags: string[]
  is_available: boolean
  is_manual_override: boolean
  availability_window: { start: string; end: string } | null
}

export interface Ingredient {
  id: string
  restaurant_id: string
  name: string
  unit: string
  current_stock: number
  reorder_threshold: number
  supplier_name: string | null
}

export interface MenuItemIngredient {
  id: string
  menu_item_id: string
  ingredient_id: string
  quantity_required: number
}

export interface Table {
  id: string
  restaurant_id: string
  label: string
  capacity: number
  status: TableStatus
}

export interface Order {
  id: string
  restaurant_id: string
  table_id: string
  customer_id: string | null
  created_by_user_id: string | null
  status: OrderStatus
  created_at: string
  updated_at: string
}

export interface OrderItem {
  id: string
  order_id: string
  menu_item_id: string
  quantity: number
  special_request: string | null
  unit_price_at_order: number
}

export interface Bill {
  id: string
  restaurant_id: string
  table_id: string
  order_ids: string[]
  subtotal: number
  tax_amount: number
  service_charge_amount: number
  total: number
  payment_status: PaymentStatus
  payment_reference: string | null
  created_at: string
}

export interface Reservation {
  id: string
  restaurant_id: string
  customer_name: string
  customer_phone: string
  party_size: number
  reserved_for: string
  table_id: string | null
  status: ReservationStatus
}

export interface QueueEntry {
  id: string
  restaurant_id: string
  customer_name: string
  customer_phone: string
  party_size: number
  joined_at: string
  status: QueueStatus
}

export interface InventoryAdjustment {
  id: string
  ingredient_id: string
  change_amount: number
  reason: InventoryAdjustmentReason
  created_by_user_id: string | null
  order_id: string | null
  created_at: string
}

export interface Forecast {
  id: string
  restaurant_id: string
  menu_item_id: string
  forecast_date: string
  predicted_quantity: number
  basis: ForecastBasis
  generated_at: string
}

export interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  error?: string
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  total: number
  page: number
  page_size: number
}

export interface SocketEvents {
  'order:created': (order: Order & { items: OrderItem[] }) => void
  'order:updated': (order: Order) => void
  'menu:availability': (menuItem: MenuItem) => void
  'table:updated': (table: Table) => void
  'ingredient:updated': (ingredient: Ingredient) => void
  'queue:updated': (queueEntry: QueueEntry) => void
  'notification': (notification: { type: string; message: string; data?: unknown }) => void
}
