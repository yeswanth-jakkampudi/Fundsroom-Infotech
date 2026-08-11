# Nexus Mini ERP & CRM System

A full-stack enterprise Mini ERP & CRM system built with **Node.js, Express, TypeScript, PostgreSQL/SQLite**, and a **React dashboard**.

---

## 🌟 Features Overview

- **🔐 Multi-Role JWT Authentication**: Role-based permissions supporting **Admin**, **Sales**, **Warehouse**, and **Accounts**.
- **💼 Customer CRM Module**: Full customer management, lead pipelines, GST verification, search, pagination, and follow-up timeline logging.
- **📦 Product & Inventory Catalog**: Stock tracking, low-stock warning alerts (`current_stock <= minimum_stock`), and detailed stock movement audit logs.
- **📜 Sales Challan Business Flow**: Auto-generation of unique challan numbers (`CH-0001`), line item product snapshot preservation (`product_name_snapshot`, `unit_price_snapshot`, `sku_snapshot`), real-time stock deduction, and negative stock prevention.
- **📄 Printable Delivery Receipts**: Invoice & Challan receipt layout ready for printing or saving as PDF.
- **⚡ Zero-Config Local Setup**: Automatically initializes embedded SQLite database with pre-seeded demo users and sample inventory if PostgreSQL `DATABASE_URL` is omitted!

---

## 🏗️ Architecture

```
mini-erp-crm/
├── backend/
│   ├── src/
│   │   ├── config/          # PostgreSQL / SQLite DB manager & automatic table seeds
│   │   ├── controllers/     # Auth, Customer CRM, Product Stock, and Sales Challan logic
│   │   ├── middleware/      # JWT authentication and Role authorization (Admin/Sales/Warehouse/Accounts)
│   │   ├── routes/          # Express API route modules
│   │   ├── utils/           # Sequential Challan code generator (CH-0001, etc.)
│   │   └── index.ts         # Main server initialization
│   ├── test-api.js          # API testing suite script
│   ├── package.json
│   └── tsconfig.json
├── frontend/
│   ├── src/
│   │   ├── components/      # Sidebar, Navbar, Badges, Modals
│   │   ├── context/         # AuthContext & Session management
│   │   ├── pages/           # Login, Executive Dashboard, Customer CRM, Products, Create Challan, Challan List
│   │   ├── services/        # Axios API client
│   │   ├── index.css        # Premium Dark/Light Glassmorphism Design System
│   │   └── App.tsx          # React Router & Protected Routes
│   ├── package.json
│   └── vite.config.ts
├── postman_collection.json  # Complete Postman Collection
└── README.md                # System documentation
```

---

## 🔑 Pre-Seeded Test Credentials

| Role | Email | Password | Allowed Permissions |
|---|---|---|---|
| **Admin** | `admin@test.com` | `password123` | Full System Control, CRM, Products, Challans |
| **Sales** | `sales@test.com` | `password123` | Customer CRM, Follow-ups, Create Sales Challans |
| **Warehouse** | `warehouse@test.com` | `password123` | Product Catalog, Stock Adjustments, Movement Audit Logs |
| **Accounts** | `accounts@test.com` | `password123` | Sales Challans View & Status Confirmation |

---

## 💻 Local Setup & Execution Guide

### Prerequisites
- Node.js (v18+ recommended)
- npm or yarn

### 1. Backend Setup

```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Option A: Run with built-in SQLite (Zero config required)
npm run dev

# Option B: Run with PostgreSQL (Neon / Supabase / Local Postgres)
# Set your DATABASE_URL in backend/.env:
# DATABASE_URL=postgresql://user:password@ep-sample.neon.tech/neondb?sslmode=require
npm run dev
```

The backend server will start on **`http://localhost:5000`**.

### 2. Frontend Setup

```bash
# Open a new terminal and navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Start Vite dev server
npm run dev
```

The frontend application will launch on **`http://localhost:3000`**.

---

## 📡 API Endpoint Reference

### Authentication (`/auth`)
- `POST /auth/login` - Authenticate user & receive JWT token
- `GET /auth/me` - Fetch authenticated user profile

### Customer CRM (`/customers`)
- `GET /customers?search=abc&page=1&limit=10` - List customers with search & pagination
- `POST /customers` - Create customer profile
- `GET /customers/:id` - Get customer details, follow-ups, and sales history
- `PUT /customers/:id` - Edit customer profile
- `POST /customers/:id/followups` - Add follow-up note and update next follow-up date

### Products & Inventory (`/products`)
- `GET /products?search=abc&page=1&limit=10` - List inventory with low stock indicators
- `POST /products` - Add product catalog item (records initial stock movement)
- `GET /products/:id` - Fetch product details & movement history
- `PUT /products/:id` - Update price/stock & record stock movement entry
- `GET /products/movements` - Fetch system stock movement audit log

### Sales Challans (`/challans`)
- `POST /challans` - Create Sales Challan (`Draft` or `Confirmed`).
  - *Validation*: Stock availability checked for `Confirmed` status. Prevents negative stock. Deducts stock & logs movement (`OUT`). Stores line item snapshots (`product_name_snapshot`, `unit_price_snapshot`, `sku_snapshot`).
- `GET /challans?status=Confirmed` - List sales challans filtered by status
- `GET /challans/:id` - Fetch detailed challan with customer & snapshot line items
- `PUT /challans/:id/status` - Transition status (e.g. from `Draft` to `Confirmed`, checking & deducting stock)

---

## 🚀 Deployment Instructions

### Frontend (Vercel)
1. Import the repository into Vercel.
2. Set **Root Directory** to `frontend`.
3. Set Environment Variable: `VITE_API_URL=https://your-backend-render-app.onrender.com`.
4. Click **Deploy**.

### Backend (Render / Railway)
1. Create a new Web Service pointing to the repository.
2. Set **Root Directory** to `backend`.
3. Build Command: `npm install && npm run build`.
4. Start Command: `node dist/index.js`.
5. Set Environment Variables:
   - `PORT=5000`
   - `DATABASE_URL=postgresql://user:password@ep-sample.neon.tech/neondb?sslmode=require`
   - `JWT_SECRET=supersecret_mini_erp_crm_key_2026`

### Database (Neon PostgreSQL)
1. Create a free PostgreSQL instance on [Neon.tech](https://neon.tech).
2. Copy the connection string to `DATABASE_URL`.
3. The backend will automatically create all 6 tables and seed default users on first start.

---

## 💡 Assumptions & Design Decisions

1. **Dual DB Engine Support**: Designed with a database abstraction wrapper so it operates seamlessly out-of-the-box on SQLite without requiring PostgreSQL installation, while full PostgreSQL (Neon/Supabase) is enabled simply by adding `DATABASE_URL`.
2. **Stock Snapshot Immutability**: Historical Challan items freeze product names, SKUs, and unit prices as snapshots at the moment of issue. Future product price changes or renaming do not distort past financial records.
3. **Draft vs Confirmed Flow**: Sales Challans can be created as `Draft` (quotation state without locking stock) and confirmed later when dispatching goods.

---

## ⚠️ Known Limitations

- **Concurrency Locks**: High concurrency multi-warehouse stock reservation is handled sequentially; database transactions can be added for high-throughput enterprise scale.
- **Exporting**: Challans include a browser print CSS receipt; direct server-side PDF generation can be added using `pdfkit`.

---

## 📬 Postman Collection

Import `postman_collection.json` located in the root directory into Postman to test all endpoints. Set `{{baseUrl}}` to `http://localhost:5000` and `{{token}}` to the JWT returned by `/auth/login`.
