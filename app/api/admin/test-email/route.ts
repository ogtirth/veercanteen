import { NextResponse } from "next/server";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import nodemailer from "nodemailer";

export async function POST() {
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

    // Create transporter
    const transporter = nodemailer.createTransport({
      host: settingsMap.smtpHost,
      port: parseInt(settingsMap.smtpPort || "587"),
      secure: settingsMap.smtpPort === "465",
      auth: {
        user: settingsMap.smtpUser,
        pass: settingsMap.smtpPass,
      },
    });

    // Send test email
    await transporter.sendMail({
      from: `"${settingsMap.businessName || 'Veer Canteen'}" <${settingsMap.smtpUser}>`,
      to: settingsMap.reportEmail,
      subject: "✅ Test Email - Veer Canteen",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #f97316;">🎉 Email Configuration Successful!</h2>
          <p>This is a test email from <strong>${settingsMap.businessName || 'Veer Canteen'}</strong>.</p>
          <p>Your daily sales reports will be sent to this email address at <strong>12:00 AM IST</strong> every day.</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
          <p style="color: #666; font-size: 12px;">
            This email was sent from Veer Canteen Admin Panel.
          </p>
        </div>
      `,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Test email error:", error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : "Failed to send test email" 
    }, { status: 500 });
  }
}
