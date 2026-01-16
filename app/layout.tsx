import type { Metadata, Viewport } from "next";
import { Toaster } from "sonner";
import SessionProvider from "@/components/SessionProvider";
import { ThemeProvider } from "@/components/ThemeProvider";
import "./globals.css";

export const metadata: Metadata = {
  title: "Veer Canteen - Food Ordering",
  description: "Fast and secure food ordering system - Order delicious food from Veer Canteen!",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Veer Canteen",
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    type: "website",
    siteName: "Veer Canteen",
    title: "Veer Canteen - Food Ordering",
    description: "Order delicious food from Veer Canteen!",
  },
  twitter: {
    card: "summary",
    title: "Veer Canteen",
    description: "Order delicious food from Veer Canteen!",
  },
};

export const viewport: Viewport = {
  themeColor: "#f97316",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
      </head>
      <body>
        <ThemeProvider>
          <SessionProvider>
            {children}
            <Toaster 
              position="top-center" 
              richColors 
              closeButton
              toastOptions={{
                className: "font-medium",
              }}
            />
            <ServiceWorkerRegistration />
          </SessionProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

function ServiceWorkerRegistration() {
  return (
    <script
      dangerouslySetInnerHTML={{
        __html: `
          if ('serviceWorker' in navigator) {
            window.addEventListener('load', function() {
              navigator.serviceWorker.register('/sw.js').then(
                function(registration) {
                  console.log('SW registered: ', registration);
                },
                function(err) {
                  console.log('SW registration failed: ', err);
                }
              );
            });
          }
        `,
      }}
    />
  );
}
