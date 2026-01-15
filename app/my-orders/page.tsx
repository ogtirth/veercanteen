"use client";

import { useEffect, useState } from "react";
import Header from "@/components/Header";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Package,
  Calendar,
  IndianRupee,
  Clock,
  CheckCircle,
  XCircle,
  ChefHat,
  UtensilsCrossed,
  ShoppingBag,
  ArrowRight,
  ChevronDown,
  ChevronUp
} from "lucide-react";

interface OrderItem {
  name: string;
  priceAtTime: number;
  quantity: number;
}

interface Order {
  id: string;
  invoiceNumber: string;
  totalAmount: number;
  status: string;
  createdAt: string;
  items: OrderItem[];
}

const statusConfig: Record<string, { variant: "default" | "secondary" | "success" | "warning" | "destructive"; icon: any; label: string }> = {
  pending: { variant: "warning", icon: Clock, label: "Pending" },
  confirmed: { variant: "default", icon: CheckCircle, label: "Confirmed" },
  preparing: { variant: "secondary", icon: ChefHat, label: "Preparing" },
  ready: { variant: "success", icon: Package, label: "Ready" },
  completed: { variant: "success", icon: CheckCircle, label: "Completed" },
  cancelled: { variant: "destructive", icon: XCircle, label: "Cancelled" },
  Paid: { variant: "success", icon: CheckCircle, label: "Paid" },
};

export default function MyOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const { data: session } = useSession();

  useEffect(() => {
    if (!session?.user?.email) return;

    const fetchOrders = async () => {
      try {
        const response = await fetch("/api/my-orders");
        const data = await response.json();
        if (data.success) {
          setOrders(data.data);
        }
      } catch (error) {
        console.error("Error fetching orders:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [session?.user?.email]);

  if (loading) {
    return (
      <>
        <Header />
        <main className="container py-8">
          <h1 className="text-3xl font-bold mb-8">My Orders</h1>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <div className="h-24 animate-pulse bg-secondary rounded" />
                </CardContent>
              </Card>
            ))}
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <Header />
      <main className="container py-8 pb-16">
        {/* Header */}
        <div className="mb-8 animate-slide-up">
          <h1 className="text-3xl font-bold">My Orders</h1>
          <p className="text-muted-foreground mt-1">
            Track and view your order history
          </p>
        </div>

        {orders.length === 0 ? (
          <div className="text-center py-16 animate-scale-in">
            <div className="w-24 h-24 mx-auto mb-6 bg-secondary rounded-full flex items-center justify-center">
              <ShoppingBag className="w-12 h-12 text-muted-foreground/50" />
            </div>
            <h2 className="text-2xl font-bold mb-2">No orders yet</h2>
            <p className="text-muted-foreground mb-8 max-w-sm mx-auto">
              Looks like you haven't placed any orders. Explore our menu and order your favorites!
            </p>
            <Button asChild size="lg" className="gap-2">
              <Link href="/menu">
                Browse Menu
                <ArrowRight className="w-5 h-5" />
              </Link>
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order, index) => {
              const config = (statusConfig[order.status as keyof typeof statusConfig] ?? statusConfig.pending)!;
              const isExpanded = expandedOrder === order.id;

              return (
                <Card
                  key={order.id}
                  className="overflow-hidden hover:shadow-card transition-all duration-200 animate-slide-up"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <CardContent className="p-0">
                    {/* Order Header - Clickable */}
                    <div
                      className="p-6 cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                      onClick={() => setExpandedOrder(isExpanded ? null : order.id)}
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                          <Package className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-bold text-lg">{order.invoiceNumber}</h3>
                            <Badge variant={config.variant} className="gap-1">
                              <config.icon className="w-3 h-3" />
                              {config.label}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {new Date(order.createdAt).toLocaleDateString()}
                            </span>
                            <span className="flex items-center gap-1">
                              <UtensilsCrossed className="w-3 h-3" />
                              {order.items.length} items
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-2xl font-bold text-primary flex items-center gap-1">
                            <IndianRupee className="w-5 h-5" />
                            {order.totalAmount.toFixed(0)}
                          </p>
                        </div>
                        {isExpanded ? (
                          <ChevronUp className="w-5 h-5 text-muted-foreground" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-muted-foreground" />
                        )}
                      </div>
                    </div>

                    {/* Expanded Order Details */}
                    {isExpanded && (
                      <div className="px-6 pb-6 border-t animate-fade-in">
                        <h4 className="font-semibold text-sm text-muted-foreground mt-4 mb-3">Order Items</h4>
                        <div className="space-y-2">
                          {order.items.map((item, idx) => (
                            <div
                              key={idx}
                              className="flex items-center justify-between p-3 bg-secondary/50 rounded-xl"
                            >
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                                  <UtensilsCrossed className="w-4 h-4 text-primary" />
                                </div>
                                <span className="font-medium">{item.name}</span>
                              </div>
                              <div className="flex items-center gap-4">
                                <Badge variant="secondary">×{item.quantity}</Badge>
                                <span className="font-semibold">
                                  ₹{(item.priceAtTime * item.quantity).toFixed(0)}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </main>
    </>
  );
}
