import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: Request) {
  const session = await auth();
  
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  });

  if (!user?.isAdmin) {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      let lastOrderTime = new Date();

      const sendEvent = (data: any) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
      };

      // Send initial connection confirmation
      sendEvent({ type: "connected", message: "Live orders connected" });

      // Poll for new orders every 3 seconds
      const interval = setInterval(async () => {
        try {
          const newOrders = await prisma.order.findMany({
            where: {
              createdAt: { gt: lastOrderTime },
            },
            include: {
              items: {
                include: {
                  menuItem: true,
                },
              },
              user: {
                select: {
                  name: true,
                  email: true,
                },
              },
            },
            orderBy: { createdAt: "desc" },
          });

          if (newOrders.length > 0) {
            lastOrderTime = new Date();
            for (const order of newOrders) {
              sendEvent({ type: "new_order", order });
            }
          }

          // Also check for status updates
          const recentUpdates = await prisma.order.findMany({
            where: {
              updatedAt: { gt: new Date(Date.now() - 5000) },
              createdAt: { lt: new Date(Date.now() - 5000) }, // Not new orders
            },
            include: {
              items: true,
              user: {
                select: {
                  name: true,
                  email: true,
                },
              },
            },
          });

          for (const order of recentUpdates) {
            sendEvent({ type: "order_update", order });
          }
        } catch (error) {
          console.error("SSE polling error:", error);
        }
      }, 3000);

      // Cleanup on close
      request.signal.addEventListener("abort", () => {
        clearInterval(interval);
        controller.close();
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
    },
  });
}
