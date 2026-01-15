# Quick Setup Guide - Veer Canteen

Follow these steps to get Veer Canteen running locally in 5 minutes.

## Step 1: Install Dependencies (1 minute)
```bash
cd /Users/Tirth/Tirth\'s/Personal/canteen
npm install
```

## Step 2: Verify Environment Variables (1 minute)
Check `.env.local` file has:
```
DATABASE_URL=mongodb+srv://super:super@cluster0.enlcnfw.mongodb.net/veer-canteen?retryWrites=true&w=majority
NEXTAUTH_SECRET=veer-canteen-super-secret-key-min-32-characters-long-2024
NEXTAUTH_URL=http://localhost:3000
NEXT_PUBLIC_UPI_ID=yourname@paytm
```

## Step 3: Setup Prisma (1 minute)
```bash
# Generate Prisma client
npx prisma generate

# Push schema to MongoDB
npx prisma db push
```

When asked to reset the database, choose "Yes" to create fresh collections.

## Step 4: Start Development Server (1 minute)
```bash
npm run dev
```

Server runs at `http://localhost:3000`

## Step 5: Create First Admin (1 minute)

### Option A: Using Prisma Studio
```bash
npx prisma studio
```
1. Click on `User` table
2. Create a new record:
   - email: admin@test.com
   - password: (keep as is for now, we'll set it via register)
   - name: Admin User
   - isAdmin: true
   - isActive: true

### Option B: Using Website
1. Go to `http://localhost:3000/register`
2. Register with email: `admin@test.com`, password: `admin123`
3. Use Prisma Studio to set `isAdmin: true` on that user

## 🎯 You're Ready!

### Quick Test Flow:
1. **Home Page**: Visit `http://localhost:3000` ✅
2. **Register**: Go to `/register` and create a test account ✅
3. **Login**: Login with your credentials ✅
4. **Menu**: Browse menu at `/menu` ✅
5. **Admin**: Make your user admin (Prisma Studio) then visit `/admin` ✅
6. **Add Items**: Go to `/admin/menu` and add a food item ✅
7. **Order**: Add item to cart, checkout, and complete order ✅

## ⚡ Available Commands

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm run prisma:generate   # Generate Prisma client
npm run prisma:push       # Push schema to database
npm run prisma:studio     # Open Prisma Studio
```

## 📱 Test Accounts

### Customer Account
- Email: `customer@test.com`
- Password: `password123`
- Role: Customer

### Admin Account
- Email: `admin@test.com`
- Password: `admin123`
- Role: Admin (set via Prisma Studio after registration)

## 🆘 If Something Goes Wrong

### Prisma Connection Error
```bash
# Regenerate client
npx prisma generate

# Check connection string
echo $DATABASE_URL
```

### NextAuth Login Issues
- Clear browser cookies (Cmd+Shift+Delete on macOS)
- Check NEXTAUTH_SECRET is set in .env.local
- Restart dev server

### Port Already in Use
```bash
# Run on different port
npm run dev -- -p 3001
```

### Database Reset (CAUTION: Deletes All Data)
```bash
npx prisma migrate reset
# Choose "Yes" when asked
```

## 🎓 Next Steps

After setup:
1. Read [README.md](README.md) for full documentation
2. Explore admin dashboard at `/admin`
3. Check folder structure in [README.md](README.md#-project-structure)
4. Review security features in [README.md](README.md#-security-features)

## 📞 Need Help?

- Check logs in terminal
- Verify MongoDB Atlas connection
- Ensure Node.js version is 18+
- Check if ports 3000 is available

---
**Happy Ordering! 🍽️**
