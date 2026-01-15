"use server";

import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { z } from "zod";
import QRCode from "qrcode";

const validateCartSchema = z.array(
  z.object({
    itemId: z.string(),
    quantity: z.number().int().positive(),
  })
);

export async function validateAndCreateOrder(
  cartItems: unknown
): Promise<{
  success: boolean;
  error?: string;
  orderId?: string;
  invoiceNumber?: string;
  qrCodeDataUrl?: string;
  upiId?: string;
  amount?: number;
  message?: string;
}> {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return { success: false, error: "Unauthorized" };
    }

    // Validate input
    const items = validateCartSchema.parse(cartItems);
    if (items.length === 0) {
      return { success: false, error: "Cart is empty" };
    }

    // Fetch all menu items and current prices from DB
    const menuItemIds = items.map((i) => i.itemId);
    const menuItems = await prisma.menuItem.findMany({
      where: { id: { in: menuItemIds } },
    });

    // Create a map for quick lookup
    const menuItemMap = new Map(menuItems.map((m) => [m.id, m]));

    // Validate stock and prices
    let totalAmount = 0;
    const orderItems: Array<{
      menuItemId: string;
      quantity: number;
      name: string;
      priceAtTime: number;
    }> = [];

    for (const cartItem of items) {
      const menuItem = menuItemMap.get(cartItem.itemId);

      if (!menuItem) {
        return {
          success: false,
          error: `Item ${cartItem.itemId} not found`,
        };
      }

      if (!menuItem.isAvailable) {
        return {
          success: false,
          error: `${menuItem.name} is not available`,
        };
      }

      if (menuItem.stock < cartItem.quantity) {
        return {
          success: false,
          error: `${menuItem.name} has only ${menuItem.stock} in stock`,
        };
      }

      const itemTotal = menuItem.price * cartItem.quantity;
      totalAmount += itemTotal;

      orderItems.push({
        menuItemId: menuItem.id,
        quantity: cartItem.quantity,
        name: menuItem.name,
        priceAtTime: menuItem.price,
      });
    }

    // Get user
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return { success: false, error: "User not found" };
    }

    // Generate invoice number
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const todayOrders = await prisma.order.findMany({
      where: {
        createdAt: {
          gte: todayStart,
          lte: todayEnd,
        },
      },
    });

    const datePart = todayStart.toISOString().split("T")[0] || "";
    const invoiceNumber = `CAN-${datePart.replace(/-/g, "")}-${String(todayOrders.length + 1).padStart(4, "0")}`;

    // Create order in transaction
    const order = await prisma.order.create({
      data: {
        invoiceNumber,
        userId: user.id,
        totalAmount,
        status: "Pending",
        items: {
          create: orderItems,
        },
      },
      include: { items: true },
    });

    // Get UPI ID from settings
    let upiId = process.env.NEXT_PUBLIC_UPI_ID || "default@paytm";
    const upiSetting = await prisma.settings.findUnique({
      where: { key: "upiId" },
    });
    if (upiSetting) {
      upiId = upiSetting.value;
    }

    // Generate UPI string
    const upiString = `upi://pay?pa=${upiId}&pn=VeerCanteen&am=${totalAmount.toFixed(2)}&cu=INR&tn=Order%20${invoiceNumber}`;

    // Generate QR code
    const qrCodeDataUrl = await QRCode.toDataURL(upiString, {
      width: 400,
      margin: 2,
    });

    return {
      success: true,
      orderId: order.id,
      invoiceNumber: order.invoiceNumber,
      qrCodeDataUrl,
      upiId,
      amount: totalAmount,
      message: `Total Amount: ₹${totalAmount.toFixed(2)}`,
    };
  } catch (error) {
    console.error("validateAndCreateOrder error:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to create order",
    };
  }
}

export async function confirmPayment(orderId: string): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return { success: false, error: "Unauthorized" };
    }

    // Get user
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return { success: false, error: "User not found" };
    }

    // Get order and verify ownership
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true },
    });

    if (!order) {
      return { success: false, error: "Order not found" };
    }

    if (order.userId !== user.id) {
      return { success: false, error: "Unauthorized" };
    }

    // Update order status and deduct stock in transaction
    await prisma.$transaction(async (tx) => {
      // Update order status
      await tx.order.update({
        where: { id: orderId },
        data: { status: "Paid" },
      });

      // Deduct stock for each item
      for (const item of order.items) {
        await tx.menuItem.update({
          where: { id: item.menuItemId },
          data: {
            stock: {
              decrement: item.quantity,
            },
          },
        });
      }
    });

    return { success: true };
  } catch (error) {
    console.error("confirmPayment error:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to confirm payment",
    };
  }
}

export async function createWalkInOrder(
  cartItems: unknown,
  paymentMethod: "cash" | "upi"
): Promise<{
  success: boolean;
  error?: string;
  orderId?: string;
  invoiceNumber?: string;
  qrCodeDataUrl?: string;
  upiId?: string;
  amount?: number;
}> {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return { success: false, error: "Unauthorized" };
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user || !user.isAdmin) {
      return { success: false, error: "Admin access required" };
    }

    // Validate input
    const items = validateCartSchema.parse(cartItems);
    if (items.length === 0) {
      return { success: false, error: "Cart is empty" };
    }

    // Fetch menu items
    const menuItemIds = items.map((i) => i.itemId);
    const menuItems = await prisma.menuItem.findMany({
      where: { id: { in: menuItemIds } },
    });

    const menuItemMap = new Map(menuItems.map((m) => [m.id, m]));

    // Validate and calculate
    let totalAmount = 0;
    const orderItems: Array<{
      menuItemId: string;
      quantity: number;
      name: string;
      priceAtTime: number;
    }> = [];

    for (const cartItem of items) {
      const menuItem = menuItemMap.get(cartItem.itemId);

      if (!menuItem) {
        return {
          success: false,
          error: `Item ${cartItem.itemId} not found`,
        };
      }

      if (menuItem.stock < cartItem.quantity) {
        return {
          success: false,
          error: `${menuItem.name} has only ${menuItem.stock} in stock`,
        };
      }

      totalAmount += menuItem.price * cartItem.quantity;
      orderItems.push({
        menuItemId: menuItem.id,
        quantity: cartItem.quantity,
        name: menuItem.name,
        priceAtTime: menuItem.price,
      });
    }

    // Generate invoice
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const todayOrders = await prisma.order.findMany({
      where: {
        createdAt: {
          gte: todayStart,
          lte: todayEnd,
        },
      },
    });

    const datePart = todayStart.toISOString().split("T")[0] || "";
    const invoiceNumber = `CAN-${datePart.replace(/-/g, "")}-${String(todayOrders.length + 1).padStart(4, "0")}`;

    // Create order and deduct stock
    const order = await prisma.$transaction(async (tx) => {
      const newOrder = await tx.order.create({
        data: {
          invoiceNumber,
          isWalkIn: true,
          totalAmount,
          status: paymentMethod === "cash" ? "Paid" : "Pending",
          items: {
            create: orderItems,
          },
        },
        include: { items: true },
      });

      // If cash, deduct stock immediately
      if (paymentMethod === "cash") {
        for (const item of orderItems) {
          await tx.menuItem.update({
            where: { id: item.menuItemId },
            data: { stock: { decrement: item.quantity } },
          });
        }
      }

      return newOrder;
    });

    let qrCodeDataUrl: string | undefined;
    let upiId: string | undefined;

    if (paymentMethod === "upi") {
      upiId = process.env.NEXT_PUBLIC_UPI_ID || "default@paytm";
      const upiSetting = await prisma.settings.findUnique({
        where: { key: "upiId" },
      });
      if (upiSetting) {
        upiId = upiSetting.value;
      }

      const upiString = `upi://pay?pa=${upiId}&pn=VeerCanteen&am=${totalAmount.toFixed(2)}&cu=INR&tn=Order%20${invoiceNumber}`;
      qrCodeDataUrl = await QRCode.toDataURL(upiString, {
        width: 400,
        margin: 2,
      });
    }

    return {
      success: true,
      orderId: order.id,
      invoiceNumber: order.invoiceNumber,
      qrCodeDataUrl,
      upiId,
      amount: totalAmount,
    };
  } catch (error) {
    console.error("createWalkInOrder error:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to create walk-in order",
    };
  }
}

export async function confirmWalkInPayment(
  orderId: string,
  paymentMethod: "cash" | "upi"
): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return { success: false, error: "Unauthorized" };
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user || !user.isAdmin) {
      return { success: false, error: "Admin access required" };
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true },
    });

    if (!order) {
      return { success: false, error: "Order not found" };
    }

    if (!order.isWalkIn) {
      return { success: false, error: "Not a walk-in order" };
    }

    // Update status and deduct stock if not already done
    await prisma.$transaction(async (tx) => {
      await tx.order.update({
        where: { id: orderId },
        data: { status: "Paid" },
      });

      if (paymentMethod === "upi") {
        // Deduct stock for UPI payment
        for (const item of order.items) {
          await tx.menuItem.update({
            where: { id: item.menuItemId },
            data: { stock: { decrement: item.quantity } },
          });
        }
      }
    });

    return { success: true };
  } catch (error) {
    console.error("confirmWalkInPayment error:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to confirm payment",
    };
  }
}
