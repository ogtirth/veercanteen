# Veer Canteen - Food Ordering System

A production-ready, secure food ordering web application built with Next.js 15+, TypeScript, Prisma ORM, MongoDB Atlas, and shadcn/ui.

## 🚀 Features

### Customer Features
- **Menu Browsing** - Browse food items by category with live stock status
- **Secure Cart** - Client-side optimistic UI with server-side validation
- **Checkout** - Zero-trust security: all prices/stock verified on server
- **UPI Payments** - QR code generation for UPI payments with deep linking
- **Order Tracking** - View order history and status updates
- **Authentication** - Email/password registration and login

### Admin Features
- **Dashboard** - Real-time stats (today's orders, revenue, pending count, low stock)
- **Menu Management** - Create, read, update, delete menu items with stock control
- **Order Management** - Track and update order status (Pending → Paid → Preparing → Ready → Completed)
- **User Management** - Manage customer accounts, toggle active status, assign admin roles
- **Counter/Walk-in** - Create manual orders for customers without accounts, support cash/UPI
- **Settings** - Configure UPI ID for all generated QR codes

## 🔒 Security Features

### Zero-Trust Architecture
- Client sends only item IDs and quantities
- Server re-fetches current prices and stock from database
- Server recalculates order total and verifies stock availability
- All price and stock tampering impossible
- Atomic transactions for stock deduction

### Authentication & Authorization
- NextAuth.js v5 with JWT sessions
- Bcrypt password hashing
- Role-based access control (Customer/Admin)
- Protected routes via middleware

## 📋 Tech Stack

- **Framework**: Next.js 15+ (App Router)
- **Language**: TypeScript
- **Database**: MongoDB Atlas + Prisma ORM
- **Authentication**: NextAuth.js v5
- **UI Components**: shadcn/ui + Tailwind CSS
- **State Management**: Zustand (cart)
- **Forms**: React Hook Form + Zod validation
- **QR Codes**: qrcode npm package
- **Notifications**: Soner (toasts)
- **Icons**: Lucide React

## 📦 Project Structure

```
.
├── app/                      # Next.js app directory
│   ├── api/                  # API routes
│   │   ├── auth/            # NextAuth handlers
│   │   ├── menu/            # Menu API
│   │   ├── my-orders/       # User orders API
│   │   └── admin/           # Admin APIs
│   ├── admin/               # Admin protected routes
│   │   ├── layout.tsx       # Admin layout with navigation
│   │   ├── page.tsx         # Dashboard
│   │   ├── menu/            # Menu management
│   │   ├── orders/          # Orders management
│   │   ├── users/           # Users management
│   │   ├── counter/         # Walk-in counter
│   │   └── settings/        # Settings
│   ├── cart/                # Shopping cart page
│   ├── checkout/            # Checkout page with QR
│   ├── my-orders/           # My orders page
│   ├── menu/                # Menu browsing page
│   ├── login/               # Login page
│   ├── register/            # Registration page
│   ├── profile/             # User profile
│   ├── page.tsx             # Home page
│   ├── layout.tsx           # Root layout
│   └── globals.css          # Global styles
├── components/
│   └── Header.tsx           # Navigation header
├── lib/
│   ├── prisma.ts            # Prisma singleton
│   ├── cart-store.ts        # Zustand cart store
│   ├── actions.ts           # Customer actions
│   ├── admin-actions.ts     # Admin actions
│   └── auth-actions.ts      # Auth actions
├── prisma/
│   └── schema.prisma        # Prisma data model
├── auth.ts                  # NextAuth configuration
├── middleware.ts            # Route protection middleware
├── .env.local               # Environment variables
└── package.json             # Dependencies
```

## 🗄️ Database Schema

### User
- id (ObjectId)
- email (unique)
- password (hashed)
- name
- isAdmin
- isActive
- orders (relation)

### MenuItem
- id (ObjectId)
- name
- price
- description
- category
- stock
- isAvailable
- image (URL)
- orders (relation)

### Order
- id (ObjectId)
- invoiceNumber (unique)
- userId (relation, optional)
- isWalkIn
- items (relation)
- totalAmount
- status (Pending/Paid/Preparing/Ready/Completed/Cancelled)
- upiIdUsed
- createdAt

### OrderItem
- id (ObjectId)
- orderId (relation)
- menuItemId (relation)
- name (snapshot)
- priceAtTime (snapshot)
- quantity

### Settings
- id (ObjectId)
- key (unique, e.g., "upiId")
- value

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- MongoDB Atlas account
- Git

### Installation

1. **Clone and install dependencies:**
```bash
cd canteen
npm install
```

2. **Setup environment variables:**
```bash
# Copy and update .env.local
DATABASE_URL="mongodb+srv://super:super@cluster0.enlcnfw.mongodb.net/veer-canteen?retryWrites=true&w=majority"
NEXTAUTH_SECRET="veer-canteen-super-secret-key-min-32-characters-long-2024"
NEXTAUTH_URL="http://localhost:3000"
NEXT_PUBLIC_UPI_ID="yourname@paytm"
```

3. **Setup Prisma:**
```bash
# Generate Prisma client
npx prisma generate

# Push schema to database
npx prisma db push

# (Optional) Open Prisma Studio
npx prisma studio
```

4. **Run development server:**
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## 📝 Initial Setup

### Create First Admin User
1. Register a new account at `/register`
2. Open MongoDB Compass or Prisma Studio
3. Find the user in `User` collection
4. Set `isAdmin: true` and save

### Create Menu Items
1. Login as admin
2. Go to `/admin/menu`
3. Click "Add Item" and create food items
4. Set prices, stock, category, and description

### Configure UPI
1. Go to `/admin/settings`
2. Enter your UPI ID (e.g., yourname@paytm)
3. Save - all QR codes will use this ID

## 🔐 Security Checklist

Before production:
- [ ] Change `NEXTAUTH_SECRET` to a strong random string
- [ ] Use production MongoDB Atlas connection string
- [ ] Set `NEXTAUTH_URL` to production domain
- [ ] Configure CORS if needed
- [ ] Setup HTTPS/SSL certificate
- [ ] Enable database backups
- [ ] Setup error monitoring (Sentry, etc.)
- [ ] Audit admin user permissions regularly
- [ ] Enable rate limiting on API routes
- [ ] Setup content security policy headers

## 💳 Invoice Number Format

Format: `CAN-YYYYMMDD-XXXX`
- Example: `CAN-20240115-0001`
- Auto-increments per day
- Unique constraint in database

## 📱 UPI Deep Linking

QR Code URL Format:
```
upi://pay?pa=yourname@paytm&pn=VeerCanteen&am=299.50&cu=INR&tn=Order%20CAN-20240115-0001
```

Supports:
- Google Pay
- PhonePe
- Paytm
- WhatsApp Pay
- Any UPI-compliant app

## 📊 Admin Dashboard Stats

- **Today's Orders**: Paid orders created today
- **Today's Revenue**: Sum of all paid orders today
- **Pending Orders**: Orders with "Pending" status
- **Low Stock**: Menu items with stock < 5

## 🧪 Testing

### Test Credentials
```
Email: test@example.com
Password: password123
Role: Customer
```

### Test Workflow
1. Register as customer
2. Browse menu at `/menu`
3. Add items to cart
4. Go to `/checkout` and verify prices
5. Proceed to payment
6. Scan QR with UPI app
7. Click "I Have Paid"
8. Verify order in `/my-orders`
9. Login as admin
10. Check dashboard and recent orders

## 🐛 Troubleshooting

### Prisma Connection Issues
```bash
# Regenerate Prisma client
npx prisma generate

# Reset database (CAUTION: deletes all data)
npx prisma migrate reset
```

### NextAuth Session Issues
- Clear browser cookies
- Check NEXTAUTH_SECRET is set
- Verify JWT strategy in auth.ts

### MongoDB Connection
- Verify connection string in .env.local
- Check IP whitelist in MongoDB Atlas
- Ensure database user has correct permissions

## 📖 API Endpoints

### Public
- `GET /api/menu` - Get all available menu items
- `POST /api/auth/signin` - Login
- `POST /api/auth/callback/credentials` - Credentials auth

### Protected (Customer)
- `GET /api/my-orders` - Get user's orders
- `POST /api/checkout` - Create order (via action)

### Protected (Admin)
- `GET /api/admin/settings` - Get settings
- Various admin actions in `/lib/admin-actions.ts`

## 🚢 Deployment

### Vercel (Recommended)
1. Push code to GitHub
2. Connect repo to Vercel
3. Set environment variables
4. Deploy

### Other Platforms
- Render, Railway, Fly.io all support Next.js
- Ensure MongoDB Atlas allows connections from your server IP

## 📄 License

MIT

## 👨‍💻 Support

For issues and questions, check:
- GitHub Issues
- NextAuth.js Docs
- Prisma Docs
- MongoDB Atlas Docs

---

Built with ❤️ using Next.js 15+
# veercanteen
