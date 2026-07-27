// ──────────────────────────────────────────────
// ENUMS & TYPE ALIASES
// ──────────────────────────────────────────────

export type UserRole = 'customer' | 'server' | 'kitchen' | 'manager' | 'super_admin'

export type TableStatus = 'empty' | 'seated' | 'ordered' | 'needs_bill' | 'needs_cleaning' | 'reserved'

export type OrderStatus = 'placed' | 'received' | 'cooking' | 'ready' | 'served' | 'completed' | 'cancelled'

export type OrderPriority = 'low' | 'medium' | 'high' | 'urgent'

export type OrderType = 'dine-in' | 'takeaway' | 'delivery' | 'scheduled'

export type PaymentStatus = 'unpaid' | 'partial' | 'paid' | 'refunded'

export type PaymentMethod = 'cash' | 'card' | 'upi' | 'wallet' | 'mixed'

export type ReservationStatus = 'confirmed' | 'seated' | 'cancelled' | 'no_show' | 'completed'

export type QueueStatus = 'waiting' | 'notified' | 'seated' | 'cancelled' | 'no_show'

export type InventoryAdjustmentReason = 'order_deduction' | 'manual_restock' | 'waste_logged' | 'correction' | 'transfer_out' | 'transfer_in' | 'spoilage'

export type ForecastBasis = 'cold_start_baseline' | 'restaurant_trained' | 'ai_enhanced'

export type OrderItemStatus = 'pending' | 'cooking' | 'ready' | 'served' | 'cancelled'

export type LoyaltyPointType = 'earned' | 'redeemed' | 'expired' | 'bonus'

export type RewardType = 'discount' | 'free_item' | 'free_delivery' | 'gift_card'

export type CouponDiscountType = 'percentage' | 'fixed_amount'

export type ShiftStatus = 'scheduled' | 'confirmed' | 'in_progress' | 'completed' | 'absent'

export type AttendanceStatus = 'present' | 'absent' | 'late' | 'half_day' | 'on_leave'

export type SubscriptionStatus = 'active' | 'past_due' | 'cancelled' | 'expired' | 'trial'

export type CampaignStatus = 'draft' | 'scheduled' | 'active' | 'completed' | 'cancelled'

export type CampaignType = 'email' | 'sms' | 'push' | 'whatsapp' | 'coupon'

export type NotificationChannel = 'email' | 'sms' | 'push' | 'in_app' | 'whatsapp'

export type NotificationType = 'order_ready' | 'table_ready' | 'reservation_reminder' | 'low_stock' | 'bill_ready' | 'queue_notified' | 'campaign' | 'stock_alert' | 'shift_reminder'

export type PurchaseOrderStatus = 'draft' | 'sent' | 'confirmed' | 'received' | 'cancelled'

export type StockTransferStatus = 'pending' | 'approved' | 'completed' | 'cancelled'

export type WasteReason = 'spoiled' | 'expired' | 'overproduction' | 'trimmings' | 'damaged' | 'other'

export type IngredientCategory = 'raw' | 'packaged' | 'beverage' | 'spice' | 'other'

// ──────────────────────────────────────────────
// CORE MODELS
// ──────────────────────────────────────────────

export interface Restaurant {
  id: string
  name: string
  slug: string
  currency: string
  tax_rate: number
  service_charge_rate: number
  timezone: string
  logo_url: string | null
  cover_image_url: string | null
  phone: string | null
  email: string | null
  address: string | null
  is_active: boolean
  created_at: string
}

export interface Branch {
  id: string
  restaurant_id: string
  name: string
  slug: string
  address: string | null
  phone: string | null
  email: string | null
  is_active: boolean
  created_at: string
}

export interface User {
  id: string
  email: string | null
  email_verified: string | null
  image: string | null
  full_name: string | null
  name: string | null
  role: UserRole
  restaurant_id: string | null
  branch_id: string | null
  phone: string | null
  is_active: boolean
  last_login_at: string | null
  created_at: string
}

// ──────────────────────────────────────────────
// MENU
// ──────────────────────────────────────────────

export interface MenuCategory {
  id: string
  restaurant_id: string
  name: string
  description: string | null
  display_order: number
  is_active: boolean
}

export interface MenuItem {
  id: string
  restaurant_id: string
  category_id: string
  name: string
  description: string
  price: number
  cost_price: number | null
  image_url: string | null
  dietary_tags: string[]
  allergen_info: string | null
  preparation_time: number | null
  is_available: boolean
  is_manual_override: boolean
  availability_window: { start: string; end: string } | null
  is_signature: boolean
  calories: number | null
  spice_level: number | null
  sort_order: number
}

// ──────────────────────────────────────────────
// INVENTORY & RECIPES
// ──────────────────────────────────────────────

export interface Ingredient {
  id: string
  restaurant_id: string
  name: string
  unit: string
  current_stock: number
  minimum_stock: number
  reorder_threshold: number
  reorder_quantity: number
  supplier_name: string | null
  supplier_id: string | null
  category: string | null
  storage_location: string | null
  unit_cost: number | null
  is_active: boolean
  created_at: string
}

export interface MenuItemIngredient {
  id: string
  menu_item_id: string
  ingredient_id: string
  quantity_required: number
  unit: string | null
  is_optional: boolean
}

export interface Batch {
  id: string
  ingredient_id: string
  batch_number: string
  quantity: number
  received_date: string
  expiry_date: string | null
  supplier_name: string | null
  cost_per_unit: number | null
}

// ──────────────────────────────────────────────
// SUPPLIERS & PURCHASE ORDERS
// ──────────────────────────────────────────────

export interface Supplier {
  id: string
  restaurant_id: string
  name: string
  contact_name: string | null
  email: string | null
  phone: string | null
  address: string | null
  tax_id: string | null
  payment_terms: string | null
  lead_time_days: number | null
  is_active: boolean
  notes: string | null
  created_at: string
}

export interface PurchaseOrder {
  id: string
  restaurant_id: string
  supplier_id: string
  order_number: string
  status: PurchaseOrderStatus
  order_date: string
  expected_date: string | null
  received_date: string | null
  subtotal: number
  tax_amount: number
  shipping_cost: number
  total_amount: number
  notes: string | null
  created_by_user_id: string | null
  created_at: string
}

export interface PurchaseOrderItem {
  id: string
  purchase_order_id: string
  ingredient_id: string
  quantity_ordered: number
  quantity_received: number
  unit_cost: number
  total_cost: number
}

export interface ReceivingNote {
  id: string
  restaurant_id: string
  purchase_order_id: string | null
  received_date: string
  notes: string | null
  created_by_user_id: string | null
  created_at: string
}

export interface ReceivingNoteItem {
  id: string
  receiving_note_id: string
  ingredient_id: string
  batch_id: string | null
  quantity_received: number
  unit_cost: number | null
}

// ──────────────────────────────────────────────
// TABLES
// ──────────────────────────────────────────────

export interface Table {
  id: string
  restaurant_id: string
  branch_id: string | null
  label: string
  capacity: number
  status: TableStatus
  section: string | null
  qr_code_url: string | null
  pos_x: number | null
  pos_y: number | null
  shape: string | null
  width: number | null
  height: number | null
}

// ──────────────────────────────────────────────
// ORDERS
// ──────────────────────────────────────────────

export interface Order {
  id: string
  restaurant_id: string
  branch_id: string | null
  table_id: string
  customer_id: string | null
  created_by_user_id: string | null
  status: OrderStatus
  priority: OrderPriority
  order_type: OrderType
  scheduled_for: string | null
  notes: string | null
  discount_amount: number
  discount_reason: string | null
  total_amount: number
  created_at: string
  updated_at: string
  completed_at: string | null
}

export interface OrderItem {
  id: string
  order_id: string
  menu_item_id: string
  quantity: number
  special_request: string | null
  unit_price_at_order: number
  status: OrderItemStatus
  note: string | null
  assigned_chef_id: string | null
  station_id: string | null
  started_at: string | null
  completed_at: string | null
}

// ──────────────────────────────────────────────
// BILLING & PAYMENTS
// ──────────────────────────────────────────────

export interface Bill {
  id: string
  restaurant_id: string
  branch_id: string | null
  table_id: string
  order_ids: string[]
  subtotal: number
  discount_amount: number
  tax_amount: number
  service_charge_amount: number
  total: number
  payment_status: PaymentStatus
  payment_method: string | null
  payment_reference: string | null
  invoice_number: string | null
  gst_number: string | null
  billed_by_user_id: string | null
  created_at: string
  paid_at: string | null
}

export interface SplitBillPayment {
  id: string
  bill_id: string
  user_id: string | null
  label: string
  amount: number
  items: string[]
  payment_status: PaymentStatus
  payment_method: string | null
  payment_reference: string | null
  created_at: string
  paid_at: string | null
}

// ──────────────────────────────────────────────
// RESERVATIONS & QUEUE
// ──────────────────────────────────────────────

export interface Reservation {
  id: string
  restaurant_id: string
  branch_id: string | null
  customer_name: string
  customer_phone: string | null
  customer_email: string | null
  party_size: number
  reserved_for: string
  table_id: string | null
  status: ReservationStatus
  notes: string | null
  special_requests: string | null
  source: string
  created_at: string
}

export interface QueueEntry {
  id: string
  restaurant_id: string
  branch_id: string | null
  customer_name: string
  customer_phone: string | null
  party_size: number
  estimated_wait: number | null
  joined_at: string
  notified_at: string | null
  status: QueueStatus
  source: string
  notes: string | null
}

// ──────────────────────────────────────────────
// INVENTORY TRACKING
// ──────────────────────────────────────────────

export interface InventoryAdjustment {
  id: string
  ingredient_id: string
  change_amount: number
  stock_after: number | null
  reason: InventoryAdjustmentReason
  reference_id: string | null
  note: string | null
  created_by_user_id: string | null
  order_id: string | null
  created_at: string
}

export interface WasteLog {
  id: string
  restaurant_id: string
  ingredient_id: string
  quantity: number
  unit: string
  reason: WasteReason
  cost_estimate: number | null
  notes: string | null
  logged_by_user_id: string | null
  created_at: string
}

export interface StockTransfer {
  id: string
  restaurant_id: string
  ingredient_id: string
  from_branch_id: string | null
  to_branch_id: string | null
  quantity: number
  status: StockTransferStatus
  notes: string | null
  requested_by_user_id: string | null
  approved_by_user_id: string | null
  created_at: string
  completed_at: string | null
}

// ──────────────────────────────────────────────
// FORECASTS
// ──────────────────────────────────────────────

export interface Forecast {
  id: string
  restaurant_id: string
  menu_item_id: string
  forecast_date: string
  predicted_quantity: number
  confidence: number | null
  basis: ForecastBasis
  generated_at: string
}

// ──────────────────────────────────────────────
// CRM & CUSTOMER
// ──────────────────────────────────────────────

export interface CustomerFavorite {
  id: string
  user_id: string
  menu_item_id: string
  created_at: string
}

export interface CustomerAllergy {
  id: string
  user_id: string
  allergen: string
  severity: string
}

export interface CustomerPreference {
  id: string
  user_id: string
  preference: string
  is_excluded: boolean
}

// ──────────────────────────────────────────────
// LOYALTY & REWARDS
// ──────────────────────────────────────────────

export interface LoyaltyPoint {
  id: string
  user_id: string
  restaurant_id: string
  points: number
  type: LoyaltyPointType
  reference: string | null
  expires_at: string | null
  created_at: string
}

export interface Reward {
  id: string
  restaurant_id: string
  name: string
  description: string | null
  points_required: number
  reward_type: RewardType
  discount_percent: number | null
  discount_amount: number | null
  menu_item_id: string | null
  is_active: boolean
  starts_at: string | null
  ends_at: string | null
  usage_limit: number | null
  created_at: string
}

export interface CustomerReward {
  id: string
  user_id: string
  reward_id: string
  points_used: number
  status: string
  used_at: string | null
  expires_at: string | null
  created_at: string
}

// ──────────────────────────────────────────────
// WALLET
// ──────────────────────────────────────────────

export interface Wallet {
  id: string
  user_id: string
  balance: number
}

export interface WalletTransaction {
  id: string
  wallet_id: string
  amount: number
  type: 'credit' | 'debit'
  reason: string
  reference: string | null
  balance_after: number
  created_at: string
}

// ──────────────────────────────────────────────
// COUPONS & GIFT CARDS
// ──────────────────────────────────────────────

export interface Coupon {
  id: string
  restaurant_id: string
  code: string
  description: string | null
  discount_type: CouponDiscountType
  discount_value: number
  minimum_order: number | null
  maximum_discount: number | null
  usage_limit: number | null
  used_count: number
  is_active: boolean
  starts_at: string | null
  ends_at: string | null
  created_at: string
}

export interface GiftCard {
  id: string
  restaurant_id: string
  code: string
  initial_value: number
  current_value: number
  purchaser_name: string | null
  recipient_name: string | null
  recipient_email: string | null
  message: string | null
  is_active: boolean
  expires_at: string | null
  created_at: string
}

// ──────────────────────────────────────────────
// REVIEWS & RATINGS
// ──────────────────────────────────────────────

export interface Review {
  id: string
  user_id: string
  restaurant_id: string
  menu_item_id: string | null
  rating: number
  title: string | null
  comment: string | null
  is_approved: boolean
  created_at: string
}

// ──────────────────────────────────────────────
// STAFF MANAGEMENT
// ──────────────────────────────────────────────

export interface ShiftDefinition {
  id: string
  restaurant_id: string
  name: string
  day_of_week: number
  start_time: string
  end_time: string
  min_staff: number
  max_staff: number
  is_active: boolean
}

export interface ShiftAssignment {
  id: string
  shift_definition_id: string
  user_id: string
  date: string
  start_time: string
  end_time: string
  role: string | null
  status: ShiftStatus
  notes: string | null
  created_at: string
}

export interface Attendance {
  id: string
  user_id: string
  date: string
  clock_in: string | null
  clock_out: string | null
  break_start: string | null
  break_end: string | null
  total_hours: number | null
  status: AttendanceStatus
  notes: string | null
  recorded_by_id: string | null
}

// ──────────────────────────────────────────────
// SUBSCRIPTIONS
// ──────────────────────────────────────────────

export interface SubscriptionPlan {
  id: string
  restaurant_id: string | null
  name: string
  description: string | null
  price: number
  interval: 'monthly' | 'yearly'
  max_branches: number
  max_staff: number
  max_menu_items: number
  features: string[]
  is_active: boolean
  created_at: string
}

export interface RestaurantSubscription {
  id: string
  restaurant_id: string
  plan_id: string
  status: SubscriptionStatus
  current_period_start: string
  current_period_end: string
  trial_ends_at: string | null
  cancelled_at: string | null
  stripe_subscription_id: string | null
  created_at: string
}

// ──────────────────────────────────────────────
// MARKETING
// ──────────────────────────────────────────────

export interface Campaign {
  id: string
  restaurant_id: string
  name: string
  description: string | null
  type: CampaignType
  status: CampaignStatus
  content: string | null
  scheduled_at: string | null
  sent_at: string | null
  target_segment: string | null
  stats_sent: number
  stats_opened: number
  stats_converted: number
  coupon_id: string | null
  created_at: string
}

export interface CampaignRecipient {
  id: string
  campaign_id: string
  user_id: string
  sent: boolean
  opened: boolean
  converted: boolean
  sent_at: string | null
  opened_at: string | null
  created_at: string
}

// ──────────────────────────────────────────────
// NOTIFICATIONS
// ──────────────────────────────────────────────

export interface NotificationLog {
  id: string
  user_id: string | null
  type: NotificationType
  channel: NotificationChannel
  title: string
  message: string
  reference_id: string | null
  status: string
  read_at: string | null
  created_at: string
}

// ──────────────────────────────────────────────
// AUDIT LOG
// ──────────────────────────────────────────────

export interface AuditLog {
  id: string
  user_id: string | null
  restaurant_id: string | null
  action: string
  entity: string
  entity_id: string | null
  old_value: unknown | null
  new_value: unknown | null
  ip_address: string | null
  user_agent: string | null
  created_at: string
}

// ──────────────────────────────────────────────
// GENERIC API TYPES
// ──────────────────────────────────────────────

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

// ──────────────────────────────────────────────
// SOCKET EVENTS
// ──────────────────────────────────────────────

export interface SocketEvents {
  'order:created': (order: Order & { items: OrderItem[] }) => void
  'order:updated': (order: Order) => void
  'order:priority': (order: Order) => void
  'menu:availability': (menuItem: MenuItem) => void
  'table:updated': (table: Table) => void
  'ingredient:updated': (ingredient: Ingredient) => void
  'queue:updated': (queueEntry: QueueEntry) => void
  'notification': (notification: { type: string; message: string; data?: unknown }) => void
  'reservation:created': (reservation: Reservation) => void
  'reservation:updated': (reservation: Reservation) => void
  'bill:created': (bill: Bill) => void
  'bill:updated': (bill: Bill) => void
  'bill:payment': (bill: Bill & { split?: SplitBillPayment }) => void
  'forecast:updated': (forecast: Forecast) => void
  'stock:transfer': (transfer: StockTransfer) => void
  'stock:low': (ingredient: Ingredient & { days_remaining?: number }) => void
  'waste:logged': (waste: WasteLog) => void
  'shift:updated': (assignment: ShiftAssignment) => void
  'attendance:updated': (attendance: Attendance) => void
  'campaign:updated': (campaign: Campaign) => void
  'subscription:updated': (subscription: RestaurantSubscription) => void
}
