import { NextResponse } from "next/server";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user || !user.isAdmin) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    // Get total revenue
    const totalRevenue = await prisma.order.aggregate({
      _sum: {
        totalAmount: true,
      },
      where: {
        status: { in: ["Completed", "Ready"] },
      },
    });

    // Get total orders
    const totalOrders = await prisma.order.count();

    // Get orders by status
    const pendingOrders = await prisma.order.count({ where: { status: "Pending" } });
    const readyOrders = await prisma.order.count({ where: { status: "Ready" } });
    const completedOrders = await prisma.order.count({ where: { status: "Completed" } });

    // Get top selling products
    const topProducts = await prisma.orderItem.groupBy({
      by: ['menuItemId'],
      _sum: {
        quantity: true,
      },
      _count: {
        menuItemId: true,
      },
      orderBy: {
        _sum: {
          quantity: 'desc',
        },
      },
      take: 5,
    });

    // Fetch menu item details for top products
    const topProductsWithDetails = await Promise.all(
      topProducts.map(async (product) => {
        const menuItem = await prisma.menuItem.findUnique({
          where: { id: product.menuItemId },
        });
        return {
          name: menuItem?.name || "Unknown",
          totalSold: product._sum.quantity || 0,
          orderCount: product._count.menuItemId,
          image: menuItem?.image,
        };
      })
    );

    // Get revenue by date (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const revenueByDate = await prisma.order.groupBy({
      by: ['createdAt'],
      _sum: {
        totalAmount: true,
      },
      where: {
        createdAt: {
          gte: sevenDaysAgo,
        },
        status: { in: ["Completed", "Ready"] },
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    // Process revenue data by day
    const revenueData = revenueByDate.reduce((acc: any[], item) => {
      const date = new Date(item.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      const existing = acc.find(d => d.date === date);
      if (existing) {
        existing.revenue += item._sum.totalAmount || 0;
      } else {
        acc.push({
          date,
          revenue: item._sum.totalAmount || 0,
        });
      }
      return acc;
    }, []);

    // Get recent orders
    const recentOrders = await prisma.order.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
        items: {
          include: {
            menuItem: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        totalRevenue: totalRevenue._sum.totalAmount || 0,
        totalOrders,
        pendingOrders,
        readyOrders,
        completedOrders,
        topProducts: topProductsWithDetails,
        revenueData,
        recentOrders: recentOrders.map(order => ({
          id: order.id,
          invoiceNumber: order.invoiceNumber,
          customer: order.isWalkIn ? 'Walk-in' : (order.user?.name || 'Unknown'),
          totalAmount: order.totalAmount,
          status: order.status,
          itemCount: order.items.length,
          createdAt: order.createdAt,
        })),
      },
    });
  } catch (error) {
    console.error("Stats error:", error);
    return NextResponse.json(
      { error: "Failed to fetch stats" },
      { status: 500 }
    );
  }
}
