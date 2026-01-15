# MongoDB Atlas Setup - Veer Canteen

Your MongoDB Atlas cluster is ready to use. Here's how the database is already configured:

## ✅ Pre-Configured Settings

### Cluster Details
- **URL**: `mongodb+srv://super:super@cluster0.enlcnfw.mongodb.net/`
- **Credentials**: 
  - Username: `super`
  - Password: `super`
- **Cluster**: `cluster0.enlcnfw.mongodb.net`

### Database
- **Name**: `veer-canteen` (auto-created)
- **Connection String**: Already set in `.env.local`

## 📊 Collections (Auto-Created by Prisma)

When you run `npx prisma db push`, these collections will be created:

```
veer-canteen/
├── User
├── MenuItem
├── Order
├── OrderItem
└── Settings
```

## 🚀 Quick Setup

### Step 1: Verify Connection String
Check `.env.local` has:
```
DATABASE_URL="mongodb+srv://super:super@cluster0.enlcnfw.mongodb.net/veer-canteen?retryWrites=true&w=majority"
```

### Step 2: Create Collections
```bash
npx prisma db push
```

When prompted:
- ✅ Choose "Yes" to reset the database

This creates all 5 collections with indexes automatically.

### Step 3: Verify in Atlas

Go to [MongoDB Atlas](https://cloud.mongodb.com):

1. Login with your Atlas account
2. Go to Databases
3. Click `cluster0`
4. Click "Collections" tab
5. You should see:
   - `users`
   - `menuitems`
   - `orders`
   - `orderitems`
   - `settings`

## 📱 Connection Methods

### Method 1: Prisma Studio (Recommended for Development)
```bash
npx prisma studio
```
Opens at `http://localhost:5555`

Features:
- View/edit all data
- Create test records
- Delete data
- Perfect for testing

### Method 2: MongoDB Compass (Desktop App)

1. Download [MongoDB Compass](https://www.mongodb.com/products/tools/compass)
2. New Connection
3. URI: `mongodb+srv://super:super@cluster0.enlcnfw.mongodb.net/veer-canteen`
4. Connect
5. Browse collections visually

### Method 3: MongoDB Atlas Web Console

1. Go to [Atlas Console](https://cloud.mongodb.com)
2. Click `cluster0`
3. Click "Collections" tab
4. Browse data online

### Method 4: Node.js Code

```typescript
import prisma from '@/lib/prisma';

// Get all users
const users = await prisma.user.findMany();

// Get all menu items
const items = await prisma.menuItem.findMany();

// Get all orders
const orders = await prisma.order.findMany({
  include: { items: true, user: true }
});
```

## 🔑 Create Test Data

### Via Prisma Studio
1. `npx prisma studio`
2. Open `User` table
3. Click "Add record"
4. Fill in:
   - email: `test@example.com`
   - password: (bcryptjs hash, use register form instead)
   - name: `Test User`
   - isAdmin: false
   - isActive: true

### Via Register Form (Better)
1. Run `npm run dev`
2. Go to `http://localhost:3000/register`
3. Create account
4. User is automatically saved to MongoDB

### Make User Admin (Via Prisma Studio)
1. `npx prisma studio`
2. Open `User` table
3. Find your user
4. Set `isAdmin: true`
5. Save

## 📝 Sample Data Insert

```typescript
// Add menu items programmatically
const menuItem = await prisma.menuItem.create({
  data: {
    name: 'Samosa',
    price: 10,
    category: 'Snacks',
    stock: 50,
    isAvailable: true,
    description: 'Crispy vegetable samosa'
  }
});
```

## 🔍 Check Database Size

```bash
npx prisma db seed
```

Then in Prisma Studio, check record counts in each table.

## 🧹 Reset Database (Caution!)

```bash
# Delete all data and restart
npx prisma migrate reset

# Confirm with "Yes"
```

This deletes everything and re-creates schemas.

## 🚨 Troubleshooting

### "Connection Refused"
```bash
# Check connection string
echo $DATABASE_URL

# Should output:
# mongodb+srv://super:super@cluster0.enlcnfw.mongodb.net/veer-canteen?retryWrites=true&w=majority
```

### "Invalid Authentication"
- Username: `super`
- Password: `super`
- Make sure they're correct in Atlas

### "Database Not Found"
```bash
# Create it by pushing schema
npx prisma db push
```

### "Cannot Read Data"
```bash
# Regenerate Prisma client
npx prisma generate
```

## 📊 Data Model Details

### User Collection
```json
{
  "_id": ObjectId,
  "email": "user@example.com",
  "password": "$2a$...", // bcrypt hash
  "name": "John Doe",
  "isAdmin": false,
  "isActive": true,
  "createdAt": ISODate,
  "updatedAt": ISODate
}
```

### MenuItem Collection
```json
{
  "_id": ObjectId,
  "name": "Samosa",
  "price": 10,
  "description": "Crispy snack",
  "category": "Snacks",
  "stock": 50,
  "isAvailable": true,
  "image": "https://...",
  "createdAt": ISODate,
  "updatedAt": ISODate
}
```

### Order Collection
```json
{
  "_id": ObjectId,
  "invoiceNumber": "CAN-20240115-0001",
  "userId": ObjectId,
  "isWalkIn": false,
  "items": [ObjectId],
  "totalAmount": 299.50,
  "status": "Paid",
  "upiIdUsed": "user@paytm",
  "createdAt": ISODate,
  "updatedAt": ISODate
}
```

### OrderItem Collection
```json
{
  "_id": ObjectId,
  "orderId": ObjectId,
  "menuItemId": ObjectId,
  "name": "Samosa",
  "priceAtTime": 10,
  "quantity": 3
}
```

### Settings Collection
```json
{
  "_id": ObjectId,
  "key": "upiId",
  "value": "admin@paytm"
}
```

## 🔐 Security Notes

- Cluster is IP-whitelisted in Atlas
- User `super` has limited permissions (database user)
- In production, use more restrictive credentials
- Enable IP address access list
- Never commit real passwords to git

## 📞 Support

If you have issues:
1. Check connection string
2. Verify user credentials in Atlas
3. Check IP whitelist in Atlas
4. Run `npx prisma db push` to create collections
5. Run `npx prisma studio` to verify data

## 🎯 What's Next?

1. ✅ Connection string is set
2. ✅ Collections created with `npx prisma db push`
3. ✅ Register your first user at `/register`
4. ✅ View data in Prisma Studio: `npx prisma studio`
5. ✅ Make your user admin via Prisma Studio
6. ✅ Start using the app!

---

**Your MongoDB is ready to go! 🎉**

Run `npm run dev` and start creating orders.
