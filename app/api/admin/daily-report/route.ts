import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import nodemailer from "nodemailer";

// This endpoint should be called by a cron job at 12:00 AM IST daily
// For Vercel, use vercel.json cron or external cron service
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    // Verify cron secret (optional security)
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;
    
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get email settings
    const settings = await prisma.settings.findMany({
      where: {
        key: {
          in: ["reportEmail", "smtpHost", "smtpPort", "smtpUser", "smtpPass", "businessName"],
        },
      },
    });

    const settingsMap = settings.reduce((acc, s) => {
      acc[s.key] = s.value;
      return acc;
    }, {} as Record<string, string>);

    if (!settingsMap.reportEmail || !settingsMap.smtpHost || !settingsMap.smtpUser || !settingsMap.smtpPass) {
      return NextResponse.json({ error: "Email settings not configured" }, { status: 400 });
    }

    // Calculate yesterday's date range in IST
    const now = new Date();
    // Convert to IST (UTC+5:30)
    const istOffset = 5.5 * 60 * 60 * 1000;
    const istNow = new Date(now.getTime() + istOffset);
    
    // Yesterday in IST
    const yesterday = new Date(istNow);
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(0, 0, 0, 0);
    
    const todayStart = new Date(istNow);
    todayStart.setHours(0, 0, 0, 0);

    // Convert back to UTC for database query
    const startDate = new Date(yesterday.getTime() - istOffset);
    const endDate = new Date(todayStart.getTime() - istOffset);

    // Get yesterday's stats
    const yesterdayOrders = await prisma.order.findMany({
      where: {
        createdAt: {
          gte: startDate,
          lt: endDate,
        },
        status: { not: "Cancelled" },
      },
      include: {
        items: {
          include: {
            menuItem: true,
          },
        },
      },
    });

    // Calculate stats
    const totalOrders = yesterdayOrders.length;
    const totalRevenue = yesterdayOrders.reduce((sum, o) => sum + o.totalAmount, 0);
    const walkInOrders = yesterdayOrders.filter(o => o.isWalkIn).length;
    const onlineOrders = totalOrders - walkInOrders;
    const completedOrders = yesterdayOrders.filter(o => o.status === "Completed").length;
    const pendingOrders = yesterdayOrders.filter(o => o.status === "Pending").length;

    // Get top selling items
    const itemSales: Record<string, { name: string; quantity: number; revenue: number }> = {};
    yesterdayOrders.forEach(order => {
      order.items.forEach(item => {
        if (!itemSales[item.menuItemId]) {
          itemSales[item.menuItemId] = {
            name: item.name,
            quantity: 0,
            revenue: 0,
          };
        }
        itemSales[item.menuItemId].quantity += item.quantity;
        itemSales[item.menuItemId].revenue += item.priceAtTime * item.quantity;
      });
    });

    const topItems = Object.values(itemSales)
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5);

    // Format date for display
    const reportDate = yesterday.toLocaleDateString('en-IN', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      timeZone: 'Asia/Kolkata',
    });

    // Create email HTML
    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Daily Sales Report</title>
      </head>
      <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #f5f5f5;">
        <div style="background: white; border-radius: 12px; padding: 30px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #f97316; margin: 0;">📊 Daily Sales Report</h1>
            <p style="color: #666; margin: 10px 0 0 0;">${settingsMap.businessName || 'Veer Canteen'}</p>
            <p style="color: #999; font-size: 14px; margin: 5px 0 0 0;">${reportDate}</p>
          </div>

          <!-- Summary Cards -->
          <div style="display: flex; gap: 15px; margin-bottom: 30px; flex-wrap: wrap;">
            <div style="flex: 1; min-width: 120px; background: linear-gradient(135deg, #f97316, #ea580c); color: white; padding: 20px; border-radius: 12px; text-align: center;">
              <div style="font-size: 32px; font-weight: bold;">₹${totalRevenue.toLocaleString('en-IN')}</div>
              <div style="font-size: 14px; opacity: 0.9;">Total Revenue</div>
            </div>
            <div style="flex: 1; min-width: 120px; background: linear-gradient(135deg, #3b82f6, #2563eb); color: white; padding: 20px; border-radius: 12px; text-align: center;">
              <div style="font-size: 32px; font-weight: bold;">${totalOrders}</div>
              <div style="font-size: 14px; opacity: 0.9;">Total Orders</div>
            </div>
          </div>

          <!-- Order Breakdown -->
          <div style="background: #f8fafc; border-radius: 12px; padding: 20px; margin-bottom: 20px;">
            <h3 style="margin: 0 0 15px 0; color: #333;">📦 Order Breakdown</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">🏪 Walk-in Orders</td>
                <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; text-align: right; font-weight: bold;">${walkInOrders}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">📱 Online Orders</td>
                <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; text-align: right; font-weight: bold;">${onlineOrders}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">✅ Completed</td>
                <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; text-align: right; font-weight: bold; color: #16a34a;">${completedOrders}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0;">⏳ Pending</td>
                <td style="padding: 8px 0; text-align: right; font-weight: bold; color: #f59e0b;">${pendingOrders}</td>
              </tr>
            </table>
          </div>

          <!-- Top Selling Items -->
          ${topItems.length > 0 ? `
          <div style="background: #f8fafc; border-radius: 12px; padding: 20px; margin-bottom: 20px;">
            <h3 style="margin: 0 0 15px 0; color: #333;">🏆 Top Selling Items</h3>
            <table style="width: 100%; border-collapse: collapse;">
              ${topItems.map((item, index) => `
              <tr>
                <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">
                  <span style="background: ${index === 0 ? '#fbbf24' : index === 1 ? '#9ca3af' : index === 2 ? '#cd7f32' : '#e5e7eb'}; color: ${index < 3 ? 'white' : '#333'}; padding: 2px 8px; border-radius: 12px; font-size: 12px; margin-right: 8px;">${index + 1}</span>
                  ${item.name}
                </td>
                <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; text-align: center;">${item.quantity} sold</td>
                <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; text-align: right; font-weight: bold;">₹${item.revenue}</td>
              </tr>
              `).join('')}
            </table>
          </div>
          ` : ''}

          <!-- Average Order Value -->
          <div style="text-align: center; padding: 20px; background: linear-gradient(135deg, #10b981, #059669); color: white; border-radius: 12px;">
            <div style="font-size: 14px; opacity: 0.9;">Average Order Value</div>
            <div style="font-size: 28px; font-weight: bold;">₹${totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0}</div>
          </div>

          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
          
          <p style="color: #999; font-size: 12px; text-align: center; margin: 0;">
            This is an automated daily report from ${settingsMap.businessName || 'Veer Canteen'}.<br>
            Generated at ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })} IST
          </p>
        </div>
      </body>
      </html>
    `;

    // Create transporter and send email
    const transporter = nodemailer.createTransport({
      host: settingsMap.smtpHost,
      port: parseInt(settingsMap.smtpPort || "587"),
      secure: settingsMap.smtpPort === "465",
      auth: {
        user: settingsMap.smtpUser,
        pass: settingsMap.smtpPass,
      },
    });

    await transporter.sendMail({
      from: `"${settingsMap.businessName || 'Veer Canteen'}" <${settingsMap.smtpUser}>`,
      to: settingsMap.reportEmail,
      subject: `📊 Daily Report - ${reportDate} | ₹${totalRevenue.toLocaleString('en-IN')} Revenue`,
      html: emailHtml,
    });

    return NextResponse.json({ 
      success: true, 
      stats: {
        date: reportDate,
        totalOrders,
        totalRevenue,
        walkInOrders,
        onlineOrders,
      }
    });
  } catch (error) {
    console.error("Daily report error:", error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : "Failed to send daily report" 
    }, { status: 500 });
  }
}
