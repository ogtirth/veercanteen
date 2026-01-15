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

      if (menuItem.stock < item.quantity) {
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

    // Generate unique invoice number
    const invoiceNumber = `WI-${Date.now()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;

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

    return { success: true, data: order };
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

    // Update stock for all items
    for (const item of order.items) {
      await prisma.menuItem.update({
        where: { id: item.menuItemId },
        data: {
          stock: {
            decrement: item.quantity,
          },
        },
      });
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

    const [todayOrders, totalRevenue, pendingCount, lowStockItems] =
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
      ]);

    return {
      success: true,
      data: {
        todayOrders,
        totalRevenue: totalRevenue._sum.totalAmount || 0,
        pendingCount,
        lowStockItems,
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
