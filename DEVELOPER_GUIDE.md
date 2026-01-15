# Developer Quick Reference - Veer Canteen

## 🎯 Key Code Locations

### Authentication
- **Config**: `auth.ts` - NextAuth setup with Credentials provider
- **Middleware**: `middleware.ts` - Route protection
- **Actions**: `lib/auth-actions.ts` - Login, register, logout

### Server Actions (Zero-Trust)
- **Customer Orders**: `lib/actions.ts`
  - `validateAndCreateOrder()` - Checkout with server validation
  - `confirmPayment()` - Mark paid + deduct stock
- **Admin Orders**: `lib/admin-actions.ts`
  - `createWalkInOrder()` - Counter orders
  - `updateOrderStatus()` - Status changes
- **Menu**: `lib/admin-actions.ts`
  - `createMenuItem()`, `updateMenuItem()`, `deleteMenuItem()`

### Database
- **Schema**: `prisma/schema.prisma`
- **Client**: `lib/prisma.ts` (singleton pattern)
- **Commands**: `npm run prisma:*`

### State Management
- **Cart Store**: `lib/cart-store.ts` (Zustand)
- **Persist**: localStorage via Zustand middleware
- **Usage**: Client components with `'use client'`

### UI Components
- **Header/Nav**: `components/Header.tsx` (client component)
- **Layout**: `app/layout.tsx` (root layout with Sonner)
- **Tailwind**: `app/globals.css` (design tokens)

### Pages & Routes
| Route | Type | Purpose |
|-------|------|---------|
| `/` | Public | Home page |
| `/menu` | Public | Browse items |
| `/login`, `/register` | Public | Auth |
| `/cart` | Protected | Shopping cart |
| `/checkout` | Protected | Payment & QR |
| `/my-orders` | Protected | Order history |
| `/profile` | Protected | User profile |
| `/admin` | Admin | Dashboard |
| `/admin/menu` | Admin | CRUD menu |
| `/admin/orders` | Admin | Manage orders |
| `/admin/users` | Admin | Manage users |
| `/admin/counter` | Admin | Walk-in orders |
| `/admin/settings` | Admin | Config |

## 🔒 Security Flow

### Checkout Process
```
1. Client: Add items (store in Zustand) ✓ Fast
2. Client: Go to checkout, submit cart ✓ UI
3. Server: validateAndCreateOrder()
   → Fetch all items from DB
   → Verify availability
   → Recalculate total
   → Validate stock
   → Create order (transaction)
4. Server: Return QR code + invoice
5. Client: Show QR + "I Have Paid" button
6. Server: confirmPayment()
   → Verify order ownership
   → Update status to "Paid"
   → Deduct stock (atomic)
```

### Admin Counter Flow
```
1. Admin: Select items for walk-in
2. Admin: Choose payment method (cash/upi)
3. Server: createWalkInOrder()
   → Same validation as checkout
   → Create order with isWalkIn flag
4. If Cash: Auto-mark as Paid, deduct stock
5. If UPI: Show QR, wait for payment
6. Server: confirmWalkInPayment()
   → Mark paid, deduct stock
```

## 📝 Common Tasks

### Add New Menu Item
```typescript
// Use admin panel at /admin/menu
// Or call directly:
import { createMenuItem } from '@/lib/admin-actions';

const result = await createMenuItem({
  name: 'Samosa',
  price: 10,
  category: 'Snacks',
  stock: 50,
  isAvailable: true,
  description: 'Crispy triangle snack',
  image: 'https://...'
});
```

### Create Test Order
```typescript
// Via checkout action
import { validateAndCreateOrder } from '@/lib/actions';

const result = await validateAndCreateOrder([
  { itemId: 'menu-item-id', quantity: 2 }
]);

// Returns: orderId, invoiceNumber, qrCodeDataUrl, etc.
```

### Update Order Status
```typescript
import { updateOrderStatus } from '@/lib/admin-actions';

const result = await updateOrderStatus(
  'order-id',
  'Preparing' // or 'Ready', 'Completed', etc.
);
```

### Query Data
```typescript
import prisma from '@/lib/prisma';

// Get all menu items
const items = await prisma.menuItem.findMany();

// Get user orders
const orders = await prisma.order.findMany({
  where: { userId: 'user-id' },
  include: { items: true }
});

// Get today's revenue
const today = new Date();
today.setHours(0, 0, 0, 0);
const orders = await prisma.order.aggregate({
  _sum: { totalAmount: true },
  where: {
    createdAt: { gte: today },
    status: 'Paid'
  }
});
```

## 🐛 Debugging Tips

### Check Session
```typescript
import { auth } from '@/auth';

const session = await auth();
console.log(session?.user?.email);
console.log((session?.user as any)?.isAdmin);
```

### View Database
```bash
npx prisma studio
# Opens browser UI at http://localhost:5555
```

### Check Cart State
```typescript
import { useCartStore } from '@/lib/cart-store';

const items = useCartStore((state) => state.items);
const total = useCartStore((state) => state.getTotal());
```

### Test Prisma
```bash
# Connect to DB and test queries
npx prisma studio
```

## 🚀 Environment Variables

```bash
# Required
DATABASE_URL=mongodb+srv://...
NEXTAUTH_SECRET=... (min 32 chars)
NEXTAUTH_URL=http://localhost:3000

# Optional
NEXT_PUBLIC_UPI_ID=yourname@paytm
```

## 📦 Key Dependencies

| Package | Purpose | Version |
|---------|---------|---------|
| next | Framework | 15+ |
| @prisma/client | DB ORM | 5.7+ |
| next-auth | Authentication | 5.0+ |
| zustand | State management | 4.4+ |
| zod | Validation | 3.22+ |
| qrcode | QR generation | 1.5+ |
| bcryptjs | Password hashing | 2.4+ |
| tailwindcss | Styling | 3.4+ |
| sonner | Toasts | 1.2+ |

## 🔄 Database Transactions

Stock deduction is atomic (protected from race conditions):

```typescript
await prisma.$transaction(async (tx) => {
  // Update order status
  await tx.order.update(...);
  
  // Deduct stock (same transaction)
  await tx.menuItem.update({
    where: { id: itemId },
    data: { stock: { decrement: qty } }
  });
});
```

If any operation fails, entire transaction rolls back.

## 🎨 Styling Guide

- **Colors**: Design tokens in `globals.css`
- **Spacing**: Tailwind standard (4px units)
- **Components**: shadcn/ui + Tailwind classes
- **Icons**: lucide-react (import by name)

```typescript
import { ShoppingCart, User, Menu } from 'lucide-react';

// Use:
<ShoppingCart className="h-5 w-5" />
```

## 🧪 Testing Checklist

### Registration & Auth
- [ ] Register new account
- [ ] Login with correct password
- [ ] Login with wrong password (error)
- [ ] Session persists after refresh
- [ ] Logout works

### Menu & Cart
- [ ] View menu items
- [ ] Filter by category
- [ ] Add to cart (need login)
- [ ] Update quantity
- [ ] Remove from cart
- [ ] Cart persists in localStorage

### Checkout & Payment
- [ ] Prices match DB (not client)
- [ ] Stock validation works
- [ ] QR code displays
- [ ] "I Have Paid" button marks as paid
- [ ] Stock deducts after payment
- [ ] Order appears in /my-orders

### Admin
- [ ] Admin can see dashboard
- [ ] Add new menu item
- [ ] Edit existing item
- [ ] Delete item
- [ ] View all orders
- [ ] Change order status
- [ ] View users
- [ ] Toggle user active
- [ ] Make/remove admin
- [ ] Counter creates orders

## 📞 Error Messages

### Common Errors & Solutions

**"User not found"**
- Check email in registration
- Verify user exists in DB

**"Invalid credentials"**
- Check password is correct
- Verify user is active (isActive: true)

**"Admin access required"**
- User is not admin (isAdmin: false)
- Make user admin in Prisma Studio

**"Item not found"**
- Item was deleted
- Wrong item ID in cart

**"Not enough stock"**
- Stock is less than quantity
- Shows in checkout validation

**"Database connection failed"**
- Check DATABASE_URL
- Verify MongoDB Atlas IP whitelist
- Ensure database user permissions

## 🎯 Performance Tips

1. **Use Prisma select** to fetch only needed fields
2. **Pagination** for large lists (implement later if needed)
3. **Image optimization** - use next/image
4. **Database indexes** - create on frequently queried fields
5. **Cache** - consider Redis for session store

## 📱 Mobile Considerations

- Header responsive on mobile
- Menu items stack on mobile
- Touch-friendly button sizes (min 44px)
- Checkout designed for mobile UPI scanning
- Forms mobile-optimized

## 🔐 Production Checklist

Before deploying to production:
- [ ] Change NEXTAUTH_SECRET
- [ ] Use production MongoDB URL
- [ ] Set NEXTAUTH_URL to production domain
- [ ] Enable HTTPS only
- [ ] Setup database backups
- [ ] Setup error monitoring
- [ ] Configure rate limiting
- [ ] Review security headers
- [ ] Test payment flow end-to-end
- [ ] Load test with multiple users

---

**Keep this reference handy while developing!**
