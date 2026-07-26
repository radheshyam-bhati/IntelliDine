# KitchenSync API

Express + Socket.IO backend server for the KitchenSync restaurant management system. Provides RESTful APIs and real-time WebSocket events for order management, inventory tracking, billing, reservations, and AI-powered analytics.

## Tech Stack

- **Runtime**: Node.js 18+ (TypeScript via tsx)
- **Framework**: Express 4.19
- **Real-time**: Socket.IO 4.7
- **Database**: Supabase (PostgreSQL) with Row Level Security
- **Validation**: Zod 3.23
- **AI**: Google Gemini API
- **Auth**: Supabase Auth (JWT)

## Project Structure

```
apps/api/src/
├── routes/           # REST API route handlers
│   ├── orders.ts     # Order CRUD & status management
│   ├── menu.ts       # Menu categories & items
│   ├── inventory.ts  # Ingredient stock & adjustments
│   ├── tables.ts     # Table status management
│   ├── billing.ts    # Bill generation & payments
│   ├── reservations.ts # Customer reservations
│   ├── queue.ts      # Walk-in waitlist
│   ├── ai.ts         # AI analytics queries
│   ├── admin.ts      # Admin dashboard data
│   ├── forecasts.ts  # Demand forecast endpoints
│   ├── users.ts      # Staff management
│   └── web.ts        # Public web-facing routes
├── services/         # Business logic
│   ├── gemini.ts     # Google Gemini AI integration
│   ├── cascade.ts    # Automatic inventory deduction
│   └── notifications.ts # Real-time notification service
├── socket/           # WebSocket connection handling
│   └── index.ts      # Socket.IO server configuration
├── middleware/       # Express middleware
│   └── auth.ts       # JWT authentication & RBAC
├── lib/              # Shared utilities
│   ├── errors.ts     # Custom error classes
│   ├── validation.ts # Zod schemas for request validation
│   ├── supabase-admin.ts # Supabase admin client
│   └── admin-context.ts # Restaurant context gathering
├── supabase/
│   └── migrations/   # Database schema migrations
└── index.ts          # Server entry point
```

## Getting Started

### Prerequisites

- Node.js 18+
- Supabase project with database and auth configured

### Environment Variables

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_KEY=your-service-role-key
CORS_ORIGIN=http://localhost:3000
API_PORT=4000
GEMINI_API_KEY=your-gemini-api-key
```

### Install & Run

```bash
cd apps/api
npm install
npm run dev   # Starts on :4000 with hot reload
```

### Database Setup

1. Run the SQL migration in your Supabase SQL editor:
   - `apps/api/supabase/migrations/001_initial_schema.sql`
2. This creates all 15 tables, custom enums, indexes, RLS policies, and triggers

## API Reference

### Health Check

```
GET /health
Response: { "status": "ok", "timestamp": "2024-01-01T00:00:00.000Z" }
```

### Orders

```http
POST /api/orders
Authorization: Bearer <token>
Content-Type: application/json

{
  "tableId": "uuid",
  "items": [
    { "menuItemId": "uuid", "quantity": 2 }
  ]
}
```

```http
PUT /api/orders/:id/status
Authorization: Bearer <token>
Content-Type: application/json

{ "status": "cooking" }
```

**Status Workflow**: `placed → received → cooking → ready → served → completed` or `cancelled` at any point.

### Menu

```http
GET /api/:restaurantId/menu
# Public - no auth required
# Returns categories with items (only available items for public)
```

```http
POST /api/menu/items
Authorization: Bearer <token>  # Manager only
Content-Type: application/json

{
  "categoryId": "uuid",
  "name": "Margherita Pizza",
  "description": "Classic tomato, mozzarella, basil",
  "price": 14.99,
  "dietaryTags": ["vegetarian"]
}
```

### Inventory

```http
GET /api/inventory/:restaurantId
Authorization: Bearer <token>

GET /api/inventory/:restaurantId/low
Authorization: Bearer <token>
```

```http
POST /api/inventory/:id/adjust
Authorization: Bearer <token>  # Manager only
Content-Type: application/json

{
  "change_amount": 10,
  "reason": "manual_restock"
}
```

### Tables

```http
PUT /api/tables/:id/status
Authorization: Bearer <token>
Content-Type: application/json

{ "status": "seated" }
```

Valid statuses: `empty`, `seated`, `ordered`, `needs_bill`, `needs_cleaning`

### Billing

```http
POST /api/billing/generate
Authorization: Bearer <token>
Content-Type: application/json

{
  "restaurant_id": "uuid",
  "table_id": "uuid",
  "include_service_charge": true
}
```

### Reservations

```http
POST /api/reservations
Authorization: Bearer <token>
Content-Type: application/json

{
  "restaurant_id": "uuid",
  "customerName": "John Doe",
  "customerPhone": "+1234567890",
  "partySize": 4,
  "reservedFor": "2024-01-15T19:00:00Z",
  "tableId": "uuid"  // optional
}
```

### AI Analytics

```http
POST /api/ai/query
Authorization: Bearer <token>
Content-Type: application/json

{ "question": "What were our best-selling items last week?" }
```

### Forecasts

```http
GET /api/forecasts/:restaurantId?date=2024-01-15
Authorization: Bearer <token>
```

## Real-time Events

### Socket.IO Connection

```javascript
import { io } from 'socket.io-client'

const socket = io('http://localhost:4000', {
  auth: { token: 'user-jwt-token' }
})
```

### Event Channels

| Room Pattern | Description |
|-------------|-------------|
| `restaurant:{id}:staff` | All staff members |
| `restaurant:{id}:kitchen` | Kitchen team |
| `restaurant:{id}:server` | Waitstaff |
| `restaurant:{id}` | Customer broadcast |
| `user:{id}` | Individual user |

### Events (Server → Client)

```typescript
interface SocketEvents {
  'order:created': (order: Order) => void
  'order:updated': (order: Order) => void
  'menu:availability': (menuItem: MenuItem) => void
  'table:updated': (table: Table) => void
  'ingredient:updated': (ingredient: Ingredient) => void
  'notification': (notification: { type: string; message: string }) => void
}
```

## Authentication & Authorization

The API uses Supabase JWT tokens for authentication and implements role-based access control:

```typescript
// Middleware usage examples
router.get('/secure', authenticate, handler)                    // Any authenticated user
router.post('/admin-only', authenticate, requireRole('manager'), handler)  // Managers only
router.put('/staff', authenticate, requireRole('server', 'manager'), handler) // Staff
```

### User Roles

| Role | Permissions |
|------|-------------|
| `customer` | Browse menu, place orders, make reservations |
| `server` | Manage tables, place/modify orders, generate bills |
| `kitchen` | View KDS, update order preparation status |
| `manager` | Full CRUD on menu, inventory, staff; view analytics |

## Error Handling

All errors return a consistent JSON response:

```json
{
  "success": false,
  "error": "Human-readable error message",
  "details": {}
}
```

HTTP Status codes:
- `400` - Validation error
- `401` - Authentication required
- `403` - Insufficient permissions
- `404` - Resource not found
- `500` - Internal server error

## Cascade Inventory System

When an order is placed, the cascade service automatically:
1. Deducts ingredient quantities based on menu item recipes
2. Recalculates menu item availability
3. Broadcasts availability updates via WebSocket
4. Logs inventory adjustments for audit trail

## Build & Deploy

```bash
# Build
npm run build    # Compiles TypeScript to dist/

# Production
npm run start    # Runs compiled dist/index.js

# Development with hot reload
npm run dev      # Runs tsx watch
```
