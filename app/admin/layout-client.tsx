"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  UtensilsCrossed, 
  ShoppingBag, 
  Users, 
  Settings, 
  Store,
  ChevronLeft,
  ChevronRight,
  Menu
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const sidebarItems = [
  { href: "/admin", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/admin/menu", icon: UtensilsCrossed, label: "Menu Items" },
  { href: "/admin/orders", icon: ShoppingBag, label: "Orders" },
  { href: "/admin/counter", icon: Store, label: "Counter" },
  { href: "/admin/users", icon: Users, label: "Users" },
  { href: "/admin/settings", icon: Settings, label: "Settings" },
];

export default function AdminLayoutClient({
  children,
}: {
  children: React.ReactNode;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-secondary/30">
      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-white border-b shadow-smooth z-50 flex items-center justify-between px-4">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            <Menu className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-primary to-primary/80 rounded-lg flex items-center justify-center">
              <UtensilsCrossed className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-lg">Admin Panel</span>
          </div>
        </div>
      </div>

      {/* Mobile Sidebar Overlay */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-40 animate-fade-in"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed top-0 left-0 h-full bg-white border-r shadow-smooth z-50 transition-all duration-300",
          collapsed ? "w-20" : "w-64",
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        {/* Logo */}
        <div className="h-16 flex items-center justify-between px-4 border-b">
          <Link href="/admin" className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-primary to-primary/80 rounded-xl flex items-center justify-center shadow-card">
              <UtensilsCrossed className="w-5 h-5 text-white" />
            </div>
            {!collapsed && (
              <div className="animate-fade-in">
                <div className="font-bold text-lg">Veer Canteen</div>
                <div className="text-xs text-muted-foreground -mt-1">Admin Panel</div>
              </div>
            )}
          </Link>
          <Button
            variant="ghost"
            size="icon"
            className="hidden lg:flex"
            onClick={() => setCollapsed(!collapsed)}
          >
            {collapsed ? (
              <ChevronRight className="w-4 h-4" />
            ) : (
              <ChevronLeft className="w-4 h-4" />
            )}
          </Button>
        </div>

        {/* Navigation */}
        <nav className="p-4 space-y-2">
          {sidebarItems.map((item, index) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200",
                  isActive
                    ? "bg-primary text-white shadow-card"
                    : "hover:bg-secondary text-foreground",
                  "animate-slide-up"
                )}
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <item.icon className={cn("w-5 h-5", collapsed && "mx-auto")} />
                {!collapsed && <span className="font-medium">{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        {!collapsed && (
          <div className="absolute bottom-0 left-0 right-0 p-4 border-t">
            <Link href="/">
              <Button variant="outline" className="w-full gap-2">
                <Store className="w-4 h-4" />
                View Store
              </Button>
            </Link>
          </div>
        )}
      </aside>

      {/* Main Content */}
      <main
        className={cn(
          "transition-all duration-300 pt-16 lg:pt-0",
          collapsed ? "lg:ml-20" : "lg:ml-64"
        )}
      >
        <div className="p-6 lg:p-8 min-h-screen">
          <div className="animate-fade-in">{children}</div>
        </div>
      </main>
    </div>
  );
}
