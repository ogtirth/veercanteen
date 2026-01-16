"use server";

import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { z } from "zod";
import { hash } from "bcryptjs";

const menuItemSchema = z.object({
  name: z.string().min(1),
  price: z.number().positive(),
  description: z.string().optional().nullable().transform(val => val ?? null),
  category: z.string().optional().nullable().transform(val => val ?? null),
  stock: z.number().int().nonnegative(),
  unlimitedStock: z.boolean().default(false),
  isAvailable: z.boolean(),
  image: z.string().optional().nullable().transform(val => val ?? null),
});

const checkAdmin = async () => {
  const session = await auth();
  if (!session?.user?.email) {
    throw new Error("Unauthorized");
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  });

  if (!user || !user.isAdmin) {
    throw new Error("Admin access required");
  }

  return user;
};

// MenuItem Actions
export async function createMenuItem(data: unknown) {
  try {
    await checkAdmin();
    const parsed = menuItemSchema.parse(data);

    const item = await prisma.menuItem.create({
      data: parsed,
    });

    return { success: true, data: item };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create item",
    };
  }
}

export async function updateMenuItem(id: string, data: unknown) {
  try {
    await checkAdmin();
    const parsed = menuItemSchema.partial().parse(data);

    const item = await prisma.menuItem.update({
      where: { id },
      data: parsed,
    });

    return { success: true, data: item };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update item",
    };
  }
}

export async function deleteMenuItem(id: string) {
  try {
    await checkAdmin();

    await prisma.menuItem.delete({
      where: { id },
    });

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to delete item",
    };
  }
}

// Order Actions
export async function updateOrderStatus(
  orderId: string,
  status: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await checkAdmin();

    const validStatuses = [
      "Pending",
      "Paid",
      "Preparing",
      "Ready",
      "Completed",
      "Cancelled",
    ];
    if (!validStatuses.includes(status)) {
      return { success: false, error: "Invalid status" };
    }

    await prisma.order.update({
      where: { id: orderId },
      data: { status },
    });

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update order",
    };
  }
}

// Walk-in Counter Actions
export async function createWalkInOrder(items: { menuItemId: string; quantity: number }[]) {
  try {
    await checkAdmin();

    if (!items || items.length === 0) {
      return { success: false, error: "No items in cart" };
    }

    // Calculate total and check stock
    let totalAmount = 0;
    const orderItems = [];

    for (const item of items) {
      const menuItem = await prisma.menuItem.findUnique({
        where: { id: item.menuItemId },
      });

      if (!menuItem) {
        return { success: false, error: `Menu item not found: ${item.menuItemId}` };
      }

      // Skip stock check for unlimited stock items
      if (!menuItem.unlimitedStock && menuItem.stock < item.quantity) {
        return { success: false, error: `Insufficient stock for ${menuItem.name}` };
      }

      if (!menuItem.isAvailable) {
        return { success: false, error: `${menuItem.name} is not available` };
      }

      totalAmount += menuItem.price * item.quantity;
      orderItems.push({
        menuItemId: item.menuItemId,
        name: menuItem.name,
        priceAtTime: menuItem.price,
        quantity: item.quantity,
      });
    }

    // Generate simple 6-character order ID
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let orderId = '';
    for (let i = 0; i < 6; i++) {
      orderId += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    const invoiceNumber = orderId;

    // Get UPI ID from settings for QR generation
    const upiSetting = await prisma.settings.findUnique({
      where: { key: "upiId" },
    });
    const upiId = upiSetting?.value || "";

    // Create walk-in order (no user associated)
    const order = await prisma.order.create({
      data: {
        invoiceNumber,
        totalAmount,
        status: "Pending",
        isWalkIn: true,
        items: {
          create: orderItems,
        },
      },
      include: {
        items: {
          include: {
            menuItem: true,
          },
        },
      },
    });

    // Generate UPI QR code URL if UPI ID exists
    let qrCode = "";
    if (upiId) {
      const upiUrl = `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent("Veer Canteen")}&am=${totalAmount}&cu=INR&tn=${encodeURIComponent(`Order ${invoiceNumber}`)}`;
      qrCode = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(upiUrl)}`;
    }

    return { 
      success: true, 
      data: {
        ...order,
        qrCode,
        upiId,
      }
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create walk-in order",
    };
  }
}

export async function confirmWalkInPayment(orderId: string, paymentMethod: string, upiId?: string) {
  try {
    await checkAdmin();

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: {
          include: {
            menuItem: true,
          },
        },
      },
    });

    if (!order) {
      return { success: false, error: "Order not found" };
    }

    if (order.status !== "Pending") {
      return { success: false, error: "Order is not pending" };
    }

    // Update stock for all items (skip unlimited stock items)
    for (const item of order.items) {
      if (!item.menuItem.unlimitedStock) {
        await prisma.menuItem.update({
          where: { id: item.menuItemId },
          data: {
            stock: {
              decrement: item.quantity,
            },
          },
        });
      }
    }

    // Update order status
    await prisma.order.update({
      where: { id: orderId },
      data: {
        status: "Paid",
        upiIdUsed: paymentMethod === "UPI" ? upiId : undefined,
      },
    });

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to confirm payment",
    };
  }
}

// User Actions
export async function toggleUserActive(
  userId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await checkAdmin();

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return { success: false, error: "User not found" };
    }

    await prisma.user.update({
      where: { id: userId },
      data: { isActive: !user.isActive },
    });

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update user",
    };
  }
}

export async function makeUserAdmin(
  userId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await checkAdmin();

    await prisma.user.update({
      where: { id: userId },
      data: { isAdmin: true },
    });

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update user",
    };
  }
}

export async function removeUserAdmin(
  userId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await checkAdmin();

    await prisma.user.update({
      where: { id: userId },
      data: { isAdmin: false },
    });

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update user",
    };
  }
}

export async function toggleUserRole(data: { userId: string }): Promise<{ success: boolean; error?: string }> {
  try {
    await checkAdmin();

    const user = await prisma.user.findUnique({
      where: { id: data.userId },
    });

    if (!user) {
      return { success: false, error: "User not found" };
    }

    await prisma.user.update({
      where: { id: data.userId },
      data: { isAdmin: !user.isAdmin },
    });

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to toggle user role",
    };
  }
}

// Settings Actions
export async function updateUpiId(
  upiId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await checkAdmin();

    if (!upiId || typeof upiId !== "string") {
      return { success: false, error: "Invalid UPI ID" };
    }

    await prisma.settings.upsert({
      where: { key: "upiId" },
      update: { value: upiId },
      create: { key: "upiId", value: upiId },
    });

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update UPI ID",
    };
  }
}

// Query Actions
export async function getMenuItems() {
  try {
    const items = await prisma.menuItem.findMany({
      orderBy: { createdAt: "desc" },
    });

    return { success: true as const, data: items };
  } catch (error) {
    return {
      success: false as const,
      data: [],
      error:
        error instanceof Error ? error.message : "Failed to fetch menu items",
    };
  }
}

export async function getAllOrders(limit = 50) {
  try {
    await checkAdmin();

    const orders = await prisma.order.findMany({
      include: {
        user: { select: { email: true, name: true } },
        items: true,
      },
      orderBy: { createdAt: "desc" },
      take: limit,
    });

    return { success: true, data: orders };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch orders",
    };
  }
}

export async function getAllUsers() {
  try {
    await checkAdmin();

    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        isAdmin: true,
        isActive: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return { success: true, data: users };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch users",
    };
  }
}

export async function getDashboardStats() {
  try {
    await checkAdmin();

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const [todayOrders, totalRevenue, pendingCount, lowStockItems, recentOrders] =
      await Promise.all([
        prisma.order.count({
          where: {
            createdAt: {
              gte: today,
              lt: tomorrow,
            },
            status: "Paid",
          },
        }),
        prisma.order.aggregate({
          _sum: { totalAmount: true },
          where: {
            createdAt: {
              gte: today,
              lt: tomorrow,
            },
            status: "Paid",
          },
        }),
        prisma.order.count({
          where: { status: "Pending" },
        }),
        prisma.menuItem.count({
          where: { stock: { lt: 5 } },
        }),
        prisma.order.findMany({
          take: 5,
          orderBy: { createdAt: "desc" },
          include: {
            items: true,
          },
        }),
      ]);

    return {
      success: true,
      data: {
        todayOrders,
        totalRevenue: totalRevenue._sum.totalAmount || 0,
        pendingCount,
        lowStockItems,
        recentOrders,
      },
    };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to fetch dashboard stats",
    };
  }
}

// Get Settings
export async function getSettings() {
  try {
    await checkAdmin();

    const settings = await prisma.settings.findMany();
    const settingsObj: Record<string, string> = {};
    settings.forEach((s) => {
      settingsObj[s.key] = s.value;
    });

    return {
      success: true,
      data: {
        upiId: settingsObj.upiId || "",
        businessName: settingsObj.businessName || "",
        phone: settingsObj.phone || "",
        email: settingsObj.email || "",
        address: settingsObj.address || "",
        openingTime: settingsObj.openingTime || "09:00",
        closingTime: settingsObj.closingTime || "21:00",
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch settings",
    };
  }
}

// Update Settings
export async function updateSettings(data: {
  upiId?: string;
  businessName?: string;
  phone?: string;
  email?: string;
  address?: string;
  openingTime?: string;
  closingTime?: string;
}) {
  try {
    await checkAdmin();

    const updates = [
      { key: "upiId", value: data.upiId || "" },
      { key: "businessName", value: data.businessName || "" },
      { key: "phone", value: data.phone || "" },
      { key: "email", value: data.email || "" },
      { key: "address", value: data.address || "" },
      { key: "openingTime", value: data.openingTime || "09:00" },
      { key: "closingTime", value: data.closingTime || "21:00" },
    ];

    for (const update of updates) {
      await prisma.settings.upsert({
        where: { key: update.key },
        update: { value: update.value },
        create: { key: update.key, value: update.value },
      });
    }

    return { success: true };
  } catch (error) {
    console.error("updateSettings error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update settings",
    };
  }
}

// Update User Role
export async function updateUserRole(userId: string, newRole: string) {
  try {
    await checkAdmin();

    const isAdmin = newRole === "admin";
    await prisma.user.update({
      where: { id: userId },
      data: { isAdmin },
    });

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update role",
    };
  }
}
// Get Comprehensive Analytics
export async function getAnalytics() {
  try {
    await checkAdmin();

    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Get all completed orders
    const allOrders = await prisma.order.findMany({
      where: {
        status: { in: ["Paid", "Completed"] },
      },
      include: {
        items: {
          include: {
            menuItem: true,
          },
        },
      },
    });

    // Calculate total revenue and orders
    const totalRevenue = allOrders.reduce((sum, order) => sum + order.totalAmount, 0);
    const totalOrders = allOrders.length;
    const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    // Top selling items
    const itemSales: Record<string, { name: string; totalSold: number; revenue: number }> = {};
    allOrders.forEach((order) => {
      order.items.forEach((item) => {
        if (!itemSales[item.menuItemId]) {
          itemSales[item.menuItemId] = {
            name: item.name,
            totalSold: 0,
            revenue: 0,
          };
        }
        const salesItem = itemSales[item.menuItemId];
        if (salesItem) {
          salesItem.totalSold += item.quantity;
          salesItem.revenue += item.priceAtTime * item.quantity;
        }
      });
    });
    const topSellingItems = Object.values(itemSales)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);

    // Sales by category
    const categorySales: Record<string, { category: string; count: number; revenue: number }> = {};
    allOrders.forEach((order) => {
      order.items.forEach((item) => {
        const category = item.menuItem?.category || "Other";
        if (!categorySales[category]) {
          categorySales[category] = { category, count: 0, revenue: 0 };
        }
        const catItem = categorySales[category];
        if (catItem) {
          catItem.count += 1;
          catItem.revenue += item.priceAtTime * item.quantity;
        }
      });
    });
    const salesByCategory = Object.values(categorySales).sort((a, b) => b.revenue - a.revenue);

    // Daily revenue for last 7 days
    const dailyRevenue: { date: string; revenue: number; orders: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const dateStr = date.toISOString().split("T")[0] ?? "";
      const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());
      const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);

      const dayOrders = allOrders.filter(
        (order) => order.createdAt >= dayStart && order.createdAt < dayEnd
      );
      const dayRevenue = dayOrders.reduce((sum, order) => sum + order.totalAmount, 0);

      dailyRevenue.push({
        date: dateStr,
        revenue: dayRevenue,
        orders: dayOrders.length,
      });
    }

    // Customer stats
    const totalCustomers = await prisma.user.count({ where: { isAdmin: false } });
    const newToday = await prisma.user.count({
      where: {
        isAdmin: false,
        createdAt: { gte: startOfDay },
      },
    });
    const customersWithOrders = await prisma.user.count({
      where: {
        isAdmin: false,
        orders: { some: {} },
      },
    });

    // Orders by status
    const statusCounts = await prisma.order.groupBy({
      by: ["status"],
      _count: { status: true },
    });
    const ordersByStatus: Record<string, number> = {};
    statusCounts.forEach((s) => {
      ordersByStatus[s.status] = s._count.status;
    });

    // Peak hours (group by hour of day)
    const peakHours: { hour: number; orders: number }[] = [];
    const hourCounts: Record<number, number> = {};
    allOrders.forEach((order) => {
      const hour = new Date(order.createdAt).getHours();
      hourCounts[hour] = (hourCounts[hour] || 0) + 1;
    });
    for (let h = 0; h < 24; h++) {
      peakHours.push({ hour: h, orders: hourCounts[h] || 0 });
    }

    return {
      success: true,
      data: {
        totalOrders,
        totalRevenue,
        avgOrderValue,
        topSellingItems,
        salesByCategory,
        dailyRevenue,
        customerStats: {
          totalCustomers,
          newToday,
          repeatCustomers: customersWithOrders,
        },
        ordersByStatus,
        peakHours,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch analytics",
    };
  }
}