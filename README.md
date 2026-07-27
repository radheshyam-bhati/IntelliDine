# IntelliDine 🍽️

**Real-time Restaurant Management System**

**Team Name:** radheshyambhati747

IntelliDine is a full-stack restaurant management platform that streamlines operations across the front-of-house, kitchen, and management teams. Built with a monorepo architecture for modular development and deployment.

## Team

| Member | Role |
|--------|------|
| **Radheshyam Bhati** | Full-Stack Developer |
| **Khushi Munna Kumar Agarwal** | Full-Stack Developer |

---

## Architecture

```
IntelliDine/
├── apps/
│   ├── web/          # Next.js 14 Frontend (Customer, Staff, Kitchen, Admin)
│   └── api/          # Express + Socket.IO Backend API
├── packages/
│   └── shared/       # Shared TypeScript types & interfaces
└── services/
    └── forecast/     # Python FastAPI demand forecasting microservice
```

## Tech Stack

### Frontend
| Technology | Purpose |
|---|---|
| **Next.js 14** (App Router) | React framework with SSR/SSG, routing, and middleware |
| **React 18** | UI component library |
| **TypeScript** | Type-safe development |
| **Tailwind CSS v4** | Utility-first styling with custom design tokens |
| **socket.io-client** | Real-time WebSocket communication |
| **NextAuth v5** | Authentication (email/password + Google OAuth) |
| **Prisma** | Type-safe database ORM and migrations |

### Backend API
| Technology | Purpose |
|---|---|
| **Express** | HTTP server with RESTful API routing |
| **Socket.IO** | WebSocket server for real-time events |
| **TypeScript** | Type-safe development |
| **Supabase** | Database client, auth integration, Row Level Security |
| **PostgreSQL** (via `pg`) | Relational database |
| **Zod** | Request/response schema validation |
| **Redis** (ioredis) | Socket.IO adapter for horizontal scaling |
| **Stripe** | Payment processing |
| **Resend** | Email notifications |
| **Multer** | File upload handling |
| **bcryptjs** | Password hashing |

### Forecasting Microservice
| Technology | Purpose |
|---|---|
| **Python 3.11+** | Core language |
| **FastAPI** | REST API framework |
| **scikit-learn** (Random Forest) | ML-powered demand prediction |
| **pandas / numpy** | Data processing and numerical computation |
| **Pydantic** | Data validation |
| **Docker** | Containerized deployment |

### Shared Package
| Technology | Purpose |
|---|---|
| **TypeScript** | Shared type definitions (Order, MenuItem, Table, Bill, etc.) |

## User Stories Completed

### ✅ Core Infrastructure
- [x] Monorepo setup with npm workspaces (web, api, shared, forecast)
- [x] Next.js 14 App Router with Tailwind CSS v4
- [x] Express + Socket.IO backend with TypeScript
- [x] Shared TypeScript type definitions package
- [x] Supabase PostgreSQL schema with 15+ tables, RLS policies, triggers, and indexes
- [x] JWT authentication middleware with role-based access control
- [x] Next.js middleware for route protection and auth redirects

### ✅ Authentication & User Management
- [x] Email/password login with server actions
- [x] Google OAuth integration
- [x] Role-based access (Customer, Server, Kitchen, Manager)
- [x] User invitation system for staff
- [x] Profile management

### ✅ Customer Experience
- [x] Public menu browsing with categories & dietary tags
- [x] Real-time menu item availability
- [x] Cart management with expandable CartBar
- [x] Order placement and tracking
- [x] Reservation booking system
- [x] Walk-in queue/waitlist management

### ✅ Staff Operations
- [x] Table grid view with status coloring & occupancy badges
- [x] Table detail page with order history
- [x] Add/remove items to active orders
- [x] Order status transitions (placed → received → cooking → ready → served → completed)
- [x] Bill generation with split billing support
- [x] Floor plan view for POS operations
- [x] Customer records and CRM

### ✅ Kitchen Display System (KDS)
- [x] Real-time order cards with urgency color coding (<10m warning, <20m alert)
- [x] Elapsed time tracking per order
- [x] One-click Accept → Start Cooking → Mark Ready
- [x] Ingredient low-stock flagging from KDS
- [x] Chef/station view support
- [x] Touch-optimized interface

### ✅ Admin Management
- [x] Dashboard with KPIs, revenue trends, best/worst sellers
- [x] Menu CRUD with availability toggles and categories
- [x] Inventory tracking with low-stock alerts and manual adjustments
- [x] Staff management with role assignment
- [x] AI-powered analytics assistant on dashboard
- [x] Supplier management
- [x] Purchase order management
- [x] Shift scheduling
- [x] Subscription management
- [x] Campaign management

### ✅ Forecasting & AI
- [x] ML-powered demand predictions (Random Forest model)
- [x] Cold start baseline for new restaurants
- [x] Confidence scoring with basis type indicators
- [x] Admin forecast page with visual indicators
- [x] Google Gemini integration for natural language analytics queries

### ✅ Real-time & Notifications
- [x] Socket.IO real-time events (order:created, order:updated, menu:availability, table:updated, ingredient:updated)
- [x] Notification service for alerts and broadcasts
- [x] Email notifications via Resend
- [x] Cascade inventory deduction on order placement

### ✅ Billing & Payments
- [x] Bill generation with taxes and service charges
- [x] Split billing support
- [x] Stripe payment processing
- [x] Payment status tracking

## AI Usage

This project leverages AI in two key areas:

### 1. Google Gemini AI — Analytics Assistant
- **Integration:** `apps/api/src/services/gemini.ts`
- **Model:** `gemini-1.5-flash`
- **Purpose:** Powers a natural language analytics assistant on the admin dashboard. Managers can ask questions like "What were our top-selling items last week?" or "Which ingredients are running low?" and get intelligent responses grounded in real restaurant data.
- **Constraints:** The AI is strictly limited to answering based on provided restaurant data and cannot use general knowledge. Responses are scoped to sales, inventory, orders, and operational metrics.
- **Fallback:** Returns a clear error message if the API key is missing or the request fails.

### 2. Machine Learning — Demand Forecasting
- **Integration:** `services/forecast/` (Python FastAPI microservice)
- **Model:** Random Forest regressor via scikit-learn
- **Purpose:** Predicts future menu item demand to help with inventory planning and staffing.
- **Features:** Cold start baseline for new restaurants, confidence scoring with basis type indicators (historical, seasonal, or baseline).
- **Deployment:** Docker containerized for independent scaling.

## Quick Start

### Prerequisites

- Node.js 18+
- Python 3.11+ (for forecast service)
- Supabase account (database + auth)
- Docker (optional, for forecast service)

### Installation

```bash
# Clone and install
git clone https://github.com/radheshyam-bhati/IntelliDine.git
cd IntelliDine
npm install
```

### Environment Variables

Create `.env` files in each app:

**apps/api/.env**
```env
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_KEY=your_supabase_service_role_key
CORS_ORIGIN=http://localhost:3000
API_PORT=4000
GEMINI_API_KEY=your_gemini_api_key
```

**apps/web/.env.local**
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_API_URL=http://localhost:4000/api
NEXT_PUBLIC_SOCKET_URL=http://localhost:4000
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

### Run Development

```bash
# Run both API and Web simultaneously
npm run dev

# Or run individually
npm run dev:web   # Next.js on :3000
npm run dev:api   # Express on :4000
```

### Database Setup

Run the migration in your Supabase SQL editor:
```
apps/api/supabase/migrations/001_initial_schema.sql
```

### Forecast Service

```bash
cd services/forecast

# Local
pip install -r requirements.txt
uvicorn main:app --reload --port 8000

# Docker
docker build -t intellidine-forecast .
docker run -p 8000:8000 intellidine-forecast
```

## Project Structure

```
apps/web/src/
├── app/
│   ├── (customer)/         # Customer-facing menu & reservations
│   │   └── menu/[slug]/
│   ├── (staff)/            # Staff orders & table management
│   │   └── orders/table/[tableId]/
│   ├── (kitchen)/          # Kitchen Display System (KDS)
│   │   └── display/
│   ├── (admin)/            # Admin dashboard & management
│   │   ├── dashboard/
│   │   ├── menu/
│   │   ├── inventory/
│   │   ├── staff/
│   │   └── forecast/
│   └── (auth)/             # Authentication pages
│       └── login/
├── components/             # Shared UI components
├── lib/                    # Utilities & context providers
└── middleware.ts           # Route protection

apps/api/src/
├── routes/                 # REST API route handlers
├── services/               # Business logic services
├── socket/                 # WebSocket event handlers
├── middleware/              # Auth middleware
├── lib/                    # Utilities & validation
└── index.ts                # Server entry point

packages/shared/src/
└── index.ts               # Shared TypeScript types
```

## API Overview

All API routes are prefixed with `/api` on port `:4000`.

### Core Routes

| Route | Description | Auth Required |
|-------|-------------|---------------|
| `GET /api/:restaurantId/menu` | Public menu with categories & items | No (public) |
| `POST /api/orders` | Create new order | JWT |
| `GET /api/orders/:id` | List/filter orders | JWT |
| `PUT /api/orders/:id/status` | Update order status | JWT+Role |
| `GET /api/inventory/:id` | List ingredients | JWT |
| `POST /api/inventory/:id/adjust` | Adjust stock levels | JWT+Manager |
| `GET /api/tables/:id` | List restaurant tables | JWT |
| `PUT /api/tables/:id/status` | Update table status | JWT+Role |
| `POST /api/billing/generate` | Generate bill | JWT+Role |
| `POST /api/reservations` | Create reservation | JWT+Role |
| `POST /api/ai/query` | AI analytics query | JWT+Manager |
| `GET /api/forecasts/:date` | Get demand forecasts | JWT+Manager |
| `GET /health` | Health check | No |

### Real-time Events (WebSocket)

| Event | Direction | Description |
|-------|-----------|-------------|
| `order:created` | Server→Client | New order placed |
| `order:updated` | Server→Client | Order status changed |
| `menu:availability` | Server→Client | Menu item availability |
| `table:updated` | Server→Client | Table status changed |
| `ingredient:updated` | Server→Client | Stock level updated |
| `notification` | Server→Client | Staff notifications |

### Order Status Flow

```
placed → received → cooking → ready → served → completed
                                                    ↘ cancelled
```

## Database Schema (Supabase/PostgreSQL)

15 tables with full Row Level Security, including:

- **Restaurants** - Multi-tenant restaurant configuration
- **Users** - Staff & customer profiles with role-based access
- **Menu Categories & Items** - Hierarchical menu with dietary tags
- **Ingredients & Inventory** - Stock tracking with reorder thresholds
- **Tables** - Floor management with status tracking
- **Orders & Order Items** - Order lifecycle with status workflow
- **Bills** - Payment processing with tax & service charges
- **Reservations** - Customer booking system
- **Queue** - Walk-in waitlist management
- **Forecasts** - ML-generated demand predictions
- **Inventory Adjustments** - Audit trail for stock changes

## Role-Based Access

| Role | Access |
|------|--------|
| **Customer** | Menu browsing, ordering, reservations |
| **Server** | Table management, order placement, billing |
| **Kitchen** | Kitchen Display System, order preparation |
| **Manager** | Full admin: menu CRUD, inventory, staff, analytics |

## Key Features

### 🧑‍🍳 Kitchen Display System (KDS)
- Real-time order cards with urgency color coding
- Elapsed time tracking (warning at 10min, alert at 20min)
- Touch-optimized interface for kitchen environments
- One-click status transitions: Accept → Cook → Ready

### 📊 AI-Powered Analytics
- Natural language queries about restaurant operations
- Google Gemini integration for intelligent insights
- Context-aware responses using real-time restaurant data

### 🔄 Cascade Inventory Management
- Automatic ingredient deduction on order placement
- Real-time menu availability recalculation
- Low-stock alerts and waste tracking

### 📈 Demand Forecasting
- ML-powered demand predictions (Random Forest)
- Cold start baseline for new restaurants
- Confidence scoring with basis type indicators

## Development

### Build

```bash
npm run build
```

### Adding Dependencies

```bash
# Add to specific workspace
npm install <package> -w apps/web
npm install <package> -w apps/api
npm install <package> -w packages/shared

# Add dev dependency
npm install -D <package> -w apps/web
```

## Deployment

The monorepo is structured for independent deployment:

- **Web App**: Deploy `apps/web` to Vercel, Netlify, or any Node.js host
- **API Server**: Deploy `apps/api` to Railway, Render, or Fly.io
- **Forecast Service**: Deploy `services/forecast` as Docker container

## Troubleshooting

### Port Conflicts

If port 3000 or 4000 is already in use, set custom ports via environment variables:
```bash
API_PORT=4001 npm run dev:api
# Or in .env: API_PORT=4001
```

### Supabase Connection Errors

1. Verify your `.env` files have the correct `SUPABASE_URL` and `SUPABASE_ANON_KEY`
2. Ensure the SQL migration has been run in your Supabase project
3. Check that Row Level Security (RLS) policies are properly configured

### Node.js Version Mismatch

This project requires Node.js 18+. Check your version:
```bash
node --version
```

### Docker Build Failures (Forecast Service)

Ensure Docker is running and you have the latest Python 3.11-slim base image:
```bash
docker pull python:3.11-slim
docker build -t intellidine-forecast services/forecast/
```

## Related

- [API Documentation](./apps/api/README.md)
- [Web App Documentation](./apps/web/README.md)
- [Shared Package Documentation](./packages/shared/README.md)
- [Forecast Service Documentation](./services/forecast/README.md)

## License

Private - Internal use
