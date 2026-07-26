# KitchenSync Web

Next.js 14 frontend for the KitchenSync restaurant management system. Provides separate interfaces for customers, waitstaff, kitchen staff, and administrators with real-time updates via Socket.IO.

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4
- **State**: React Context (cart management)
- **Real-time**: Socket.IO client
- **Auth**: Supabase SSR (email/password + Google OAuth)
- **Database Client**: Supabase SSR SDK
- **Fonts**: Inter (sans) + Playfair Display (serif)

## Project Structure

```
apps/web/src/
├── app/
│   ├── (customer)/           # Customer-facing routes
│   │   ├── layout.tsx        # Cart provider wrapper
│   │   └── menu/[slug]/      # Dynamic restaurant menu
│   │       ├── page.tsx      # Menu browsing & ordering
│   │       └── reserve/      # Reservation booking
│   ├── (staff)/              # Staff operations
│   │   ├── layout.tsx        # Auth guard & navigation
│   │   └── orders/           # Order management
│   │       ├── page.tsx      # Table grid & active orders
│   │       └── table/[tableId]/  # Per-table detail view
│   ├── (kitchen)/            # Kitchen Display System
│   │   ├── layout.tsx        # Kitchen auth guard
│   │   └── display/page.tsx  # Live order board
│   ├── (admin)/              # Admin management
│   │   ├── layout.tsx        # Sidebar & manager guard
│   │   ├── dashboard/        # KPIs, trends, AI assistant
│   │   ├── menu/             # Menu CRUD management
│   │   ├── inventory/        # Stock management
│   │   ├── staff/            # Staff roster & invites
│   │   └── forecast/         # Demand predictions
│   ├── (auth)/               # Authentication
│   │   └── login/            # Login page & actions
│   ├── auth/callback/        # OAuth callback handler
│   ├── globals.css           # Global styles & Tailwind theme
│   └── layout.tsx            # Root layout with fonts
├── components/               # Shared UI components
│   ├── CartBar.tsx           # Fixed bottom cart drawer
│   ├── MenuItemCard.tsx      # Menu item display
│   ├── TableCard.tsx         # Table status card
│   ├── StatusBadge.tsx       # Order status indicator
│   └── OrderCard.tsx         # Order display with actions
├── lib/                      # Utilities & providers
│   ├── api.ts                # Typed API client
│   ├── cart-context.tsx      # Cart state management
│   ├── socket.ts             # Socket.IO client
│   ├── supabase-client.ts    # Browser Supabase client
│   └── supabase-server.ts    # Server-side Supabase client
└── middleware.ts             # Route protection middleware
```

## Getting Started

### Prerequisites

- Node.js 18+
- **API server must be running** on port 4000 (see `apps/api/README.md`)
- Supabase project with database configured

> ⚠️ The web app requires the KitchenSync API to be running. Start it first:
> ```bash
> cd apps/api && npm install && npm run dev
> ```

### Environment Variables

Create `apps/web/.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_API_URL=http://localhost:4000/api
NEXT_PUBLIC_SOCKET_URL=http://localhost:4000
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

### Install & Run

```bash
cd apps/web
npm install
npm run dev   # Starts on :3000 with hot reload
```

> The dev server will proxy API requests to port 4000. Ensure the API is running first.

## Route Groups & Layouts

The app uses Next.js Route Groups to organize interfaces:

### Customer Routes `(customer)/`
- **Layout**: Wraps content in `CartProvider` for shared cart state
- **Menu Page** (`menu/[slug]`): Browse categories and items, add to cart, submit orders
- **Reservation Page** (`menu/[slug]/reserve`): Book tables with date/time picker
- **Theme**: Warm amber tones (`bg-amber-50`) for restaurant ambiance

### Staff Routes `(staff)/`
- **Layout**: Auth guard requiring `server` or `manager` role, top navigation bar
- **Orders Page**: Table grid view with status indicators, active order list, real-time notifications
- **Table Detail Page**: Per-table view with order history, item adding, bill generation
- **Real-time**: Socket.IO connection for live order and table updates

### Kitchen Routes `(kitchen)/`
- **Layout**: Auth guard requiring `kitchen` role, KDS dark theme
- **Display Page**: Full-screen order board optimized for kitchen environments
- **Features**: Urgency color coding, elapsed timers, one-click status transitions

### Admin Routes `(admin)/`
- **Layout**: Auth guard requiring `manager` role, sidebar navigation
- **Dashboard**: KPI cards, revenue trends, best/worst sellers, operations metrics, AI assistant
- **Menu Management**: Category/item CRUD, availability toggles, dietary tags
- **Inventory Management**: Stock levels, progress bars, low-stock alerts, manual adjustments
- **Staff Management**: Staff roster, role management, invitation system
- **Forecast**: Date-filtered demand predictions, confidence indicators

### Auth Routes `(auth)/`
- **Login Page**: Email/password login with Google OAuth option
- **Server Actions**: Server-side form handling with Supabase authentication
- **OAuth Callback**: Role-based redirect after authentication

## Components

### StatusBadge
Color-coded order status indicator with accessible aria labels:
- `placed` → Gray | `received` → Blue | `cooking` → Amber
- `ready` → Green | `served` → Light Blue | `completed` → Light Green | `cancelled` → Red

### TableCard
Interactive table button with status-based border colors:
- Displays table label, current status, and active order count
- Touch-friendly with `min-touch` classes (44x44px minimum)

### MenuItemCard
Expandable menu item with:
- Name, description, price, and dietary tag badges
- Expand/collapse for full description and "Add to Order" button
- Availability state with visual opacity indicator

### CartBar
Fixed bottom cart drawer:
- Collapsed: shows item count and total price
- Expanded: item list with +/- quantity controls and remove button
- Submit order with validation and error handling

### OrderCard
Multi-purpose order display with:
- Elapsed time counter with urgency color coding
- Item list with quantities and prices
- Role-based action buttons:
  - **Server**: "Mark Served" for ready orders
  - **Kitchen**: "Start Cooking", "Mark Ready", "Flag Ingredient Low"

## Theme & Styling

### Custom Tailwind Theme

```typescript
colors: {
  neutral: '#6b7280',
  warning: '#f59e0b',
  alert: '#ef4444',
  ready: '#22c55e',
}
```

### Global CSS (globals.css)

- Tailwind v4 `@import` with `@theme` configuration
- KDS (Kitchen Display System) dark background: `#1a1a1a`
- Custom utility classes: `.bg-kds`, `.kds-text`, `.kds-text-lg`, `.kds-text-xl`
- High contrast mode support via `prefers-contrast: more`

### Fonts

- **Inter**: Primary sans-serif font for UI text
- **Playfair Display**: Serif font for headings and menu items

## Authentication Flow

1. User visits protected route → middleware checks for auth cookie
2. No cookie → redirect to `/staff/login?redirect=<path>`
3. User logs in via email/password or Google OAuth
4. Server action validates credentials via Supabase
5. Role-based redirect:
   - `kitchen` → `/kitchen/display`
   - `manager` → `/admin/dashboard`
   - `server` → `/staff/orders`

## Real-time Updates

The app connects to the API's Socket.IO server for live updates:

```typescript
import { connect } from '@/lib/socket'

const socket = connect(restaurantId, token)

socket.on('order:created', (order) => {
  // Handle new order
})
socket.on('order:updated', (order) => {
  // Handle status change
})
socket.on('menu:availability', (item) => {
  // Handle availability change
})
```

## API Client

Typed HTTP client with automatic JWT token injection:

```typescript
import { get, post, patch, del } from '@/lib/api'

// All requests automatically attach auth headers
const { data } = await get<MenuItem[]>('/menu-items')
await post('/orders', { tableId, items })
await patch(`/orders/${id}`, { status: 'ready' })
```

## Build & Deploy

```bash
# Build for production
npm run build

# Start production server
npm run start
```

### Deployment

Deploy to any platform that supports Next.js:
- **Vercel** (recommended) - Zero-config deployment
- **Netlify** - With Next.js plugin
- **Docker** - Custom container with Node.js server

> Note: The API routes within this app are only client-side. Any server-side API calls must go through the separate Express API server on port 4000.
