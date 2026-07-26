# @kitchensync/shared

Shared TypeScript type definitions and interfaces used across the KitchenSync monorepo. This package provides a single source of truth for data models, API response types, and socket event definitions consumed by both the frontend and backend.

## Installation

This package is part of the KitchenSync monorepo and is available to all workspace packages automatically:

```json
{
  "dependencies": {
    "@kitchensync/shared": "*"
  }
}
```

## Usage

```typescript
import type {
  MenuItem,
  Order,
  OrderStatus,
  Table,
  ApiResponse,
  SocketEvents,
} from '@kitchensync/shared'
```

## Type Definitions

### Entity Types

#### Restaurant
```typescript
interface Restaurant {
  id: string
  name: string
  slug: string
  currency: string
  tax_rate: number
  service_charge_rate: number
  created_at: string
}
```

#### User
```typescript
interface User {
  id: string
  restaurant_id: string | null
  role: UserRole        // 'customer' | 'server' | 'kitchen' | 'manager'
  full_name: string
  phone: string | null
  created_at: string
}
```

#### Menu & Inventory
```typescript
interface MenuCategory {
  id: string
  restaurant_id: string
  name: string
  display_order: number
}

interface MenuItem {
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

interface Ingredient {
  id: string
  restaurant_id: string
  name: string
  unit: string
  current_stock: number
  reorder_threshold: number
  supplier_name: string | null
}

interface MenuItemIngredient {
  id: string
  menu_item_id: string
  ingredient_id: string
  quantity_required: number
}
```

#### Tables & Orders
```typescript
interface Table {
  id: string
  restaurant_id: string
  label: string
  capacity: number
  status: TableStatus
  // 'empty' | 'seated' | 'ordered' | 'needs_bill' | 'needs_cleaning'
}

interface Order {
  id: string
  restaurant_id: string
  table_id: string
  customer_id: string | null
  created_by_user_id: string | null
  status: OrderStatus
  // 'placed' | 'received' | 'cooking' | 'ready' | 'served' | 'completed' | 'cancelled'
  created_at: string
  updated_at: string
}

interface OrderItem {
  id: string
  order_id: string
  menu_item_id: string
  quantity: number
  special_request: string | null
  unit_price_at_order: number
}
```

#### Billing
```typescript
interface Bill {
  id: string
  restaurant_id: string
  table_id: string
  order_ids: string[]
  subtotal: number
  tax_amount: number
  service_charge_amount: number
  total: number
  payment_status: PaymentStatus
  // 'unpaid' | 'partial' | 'paid'
  payment_reference: string | null
  created_at: string
}
```

#### Reservations & Queue
```typescript
interface Reservation {
  id: string
  restaurant_id: string
  customer_name: string
  customer_phone: string
  party_size: number
  reserved_for: string
  table_id: string | null
  status: ReservationStatus
  // 'confirmed' | 'seated' | 'cancelled' | 'no_show'
}

interface QueueEntry {
  id: string
  restaurant_id: string
  customer_name: string
  customer_phone: string
  party_size: number
  joined_at: string
  status: QueueStatus
  // 'waiting' | 'notified' | 'seated' | 'cancelled'
}
```

#### Inventory & Forecasting
```typescript
interface InventoryAdjustment {
  id: string
  ingredient_id: string
  change_amount: number
  reason: InventoryAdjustmentReason
  // 'order_deduction' | 'manual_restock' | 'waste_logged' | 'correction'
  created_by_user_id: string | null
  order_id: string | null
  created_at: string
}

interface Forecast {
  id: string
  restaurant_id: string
  menu_item_id: string
  forecast_date: string
  predicted_quantity: number
  basis: ForecastBasis
  // 'cold_start_baseline' | 'restaurant_trained'
  generated_at: string
}
```

### API & Utility Types

#### API Response
```typescript
interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  error?: string
}

interface PaginatedResponse<T> extends ApiResponse<T[]> {
  total: number
  page: number
  page_size: number
}
```

#### Socket Events
```typescript
interface SocketEvents {
  'order:created': (order: Order & { items: OrderItem[] }) => void
  'order:updated': (order: Order) => void
  'menu:availability': (menuItem: MenuItem) => void
  'table:updated': (table: Table) => void
  'ingredient:updated': (ingredient: Ingredient) => void
  'queue:updated': (queueEntry: QueueEntry) => void
  'notification': (notification: {
    type: string
    message: string
    data?: unknown
  }) => void
}
```

### Enum/Union Types

| Type | Values |
|------|--------|
| `UserRole` | `'customer'` \| `'server'` \| `'kitchen'` \| `'manager'` |
| `TableStatus` | `'empty'` \| `'seated'` \| `'ordered'` \| `'needs_bill'` \| `'needs_cleaning'` |
| `OrderStatus` | `'placed'` \| `'received'` \| `'cooking'` \| `'ready'` \| `'served'` \| `'completed'` \| `'cancelled'` |
| `PaymentStatus` | `'unpaid'` \| `'partial'` \| `'paid'` |
| `ReservationStatus` | `'confirmed'` \| `'seated'` \| `'cancelled'` \| `'no_show'` |
| `QueueStatus` | `'waiting'` \| `'notified'` \| `'seated'` \| `'cancelled'` |
| `InventoryAdjustmentReason` | `'order_deduction'` \| `'manual_restock'` \| `'waste_logged'` \| `'correction'` |
| `ForecastBasis` | `'cold_start_baseline'` \| `'restaurant_trained'` |

## Build

```bash
cd packages/shared
npm run build   # Compiles TypeScript to dist/
```

This package is consumed by:
- `@kitchensync/api` - Backend route handlers and validation
- `@kitchensync/web` - Frontend components and pages

## Versioning

All type changes should be made here first, then consumed by dependent packages. Since this is the shared type layer, breaking changes should be coordinated across all consumers.
