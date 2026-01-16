import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🗑️  Flushing data (keeping users)...\n");

  // Delete order items first (due to foreign key)
  const orderItems = await prisma.orderItem.deleteMany({});
  console.log(`✓ Deleted ${orderItems.count} order items`);

  // Delete orders
  const orders = await prisma.order.deleteMany({});
  console.log(`✓ Deleted ${orders.count} orders`);

  // Delete menu items
  const menuItems = await prisma.menuItem.deleteMany({});
  console.log(`✓ Deleted ${menuItems.count} menu items`);

  // Delete settings
  const settings = await prisma.settings.deleteMany({});
  console.log(`✓ Deleted ${settings.count} settings`);

  // Show remaining users
  const users = await prisma.user.findMany({
    select: { id: true, email: true, name: true, isAdmin: true }
  });
  console.log(`\n👤 Kept ${users.length} users:`);
  users.forEach(u => console.log(`   - ${u.email} (${u.isAdmin ? "Admin" : "User"})`));

  console.log("\n✅ Data flush complete! Ready for real data.");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
