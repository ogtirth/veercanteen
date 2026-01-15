"use client";

import { useEffect, useState } from "react";
import { getAllOrders, updateOrderStatus } from "@/lib/admin-actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { ChevronDown, ChevronRight, IndianRupee, Clock, CheckCircle2, XCircle, Package } from "lucide-react";

interface Order {
  id: string;
  invoiceNumber: string;
  totalAmount: number;
  status: string;
  createdAt: string;
  items: any[];
  user?: { name: string | null; email: string } | null;
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedOrders, setExpandedOrders] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    try {
      const result = await getAllOrders();
      if (result.success && result.data) {
        setOrders(result.data.map(order => ({
          ...order,
          createdAt: order.createdAt.toString()
        })));
      }
    } catch (error) {
      toast.error("Failed to load orders");
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    try {
      const result = await updateOrderStatus(orderId, newStatus);
      if (result.success) {
        toast.success("Status updated!");
        loadOrders();
      }
    } catch (error) {
      toast.error("Failed to update status");
    }
  };

  const toggleExpand = (orderId: string) => {
    const newExpanded = new Set(expandedOrders);
    if (newExpanded.has(orderId)) {
      newExpanded.delete(orderId);
    } else {
      newExpanded.add(orderId);
    }
    setExpandedOrders(newExpanded);
  };

  const getStatusBadge = (status: string) => {
    const variants: any = {
      pending: { variant: "warning", label: "Pending", icon: Clock },
      confirmed: { variant: "secondary", label: "Confirmed", icon: CheckCircle2 },
      preparing: { variant: "secondary", label: "Preparing", icon: Package },
      ready: { variant: "success", label: "Ready", icon: CheckCircle2 },
      completed: { variant: "success", label: "Completed", icon: CheckCircle2 },
      cancelled: { variant: "destructive", label: "Cancelled", icon: XCircle },
    };

    const config = variants[status] || variants.pending;
    const Icon = config.icon;
    
    return (
      <Badge variant={config.variant} className="gap-1">
        <Icon className="w-3 h-3" />
        {config.label}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading orders...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Orders Management</h1>
        <p className="text-muted-foreground mt-1">Track and manage all orders</p>
      </div>

      <div className="space-y-4">
        {orders.map((order, index) => {
          const isExpanded = expandedOrders.has(order.id);
          
          return (
            <Card 
              key={order.id}
              className="hover:shadow-card transition-all duration-200 animate-slide-up"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <CardHeader 
                className="cursor-pointer"
                onClick={() => toggleExpand(order.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    {isExpanded ? (
                      <ChevronDown className="w-5 h-5 text-muted-foreground" />
                    ) : (
                      <ChevronRight className="w-5 h-5 text-muted-foreground" />
                    )}
                    <div>
                      <CardTitle className="text-lg">{order.invoiceNumber}</CardTitle>
                      <p className="text-sm text-muted-foreground mt-1">
                        {new Date(order.createdAt).toLocaleString()} • {order.items.length} items
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="flex items-center gap-1 font-bold text-lg">
                        <IndianRupee className="w-5 h-5" />
                        {order.totalAmount}
                      </div>
                    </div>
                    {getStatusBadge(order.status)}
                  </div>
                </div>
              </CardHeader>

              {isExpanded && (
                <CardContent className="space-y-4 border-t animate-slide-up">
                  {/* Items */}
                  <div>
                    <h4 className="font-semibold mb-3">Order Items</h4>
                    <div className="space-y-2">
                      {order.items.map((item: any) => (
                        <div
                          key={item.id}
                          className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                        >
                          <div>
                            <p className="font-medium">{item.name}</p>
                            <p className="text-sm text-muted-foreground">
                              Quantity: {item.quantity}
                            </p>
                          </div>
                          <div className="flex items-center gap-1 font-semibold">
                            <IndianRupee className="w-4 h-4" />
                            {item.priceAtTime * item.quantity}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Status Actions */}
                  <div>
                    <h4 className="font-semibold mb-3">Update Status</h4>
                    <div className="flex flex-wrap gap-2">
                      {["pending", "confirmed", "preparing", "ready", "completed", "cancelled"].map(
                        (status) => (
                          <Button
                            key={status}
                            size="sm"
                            variant={order.status === status ? "default" : "outline"}
                            onClick={() => handleStatusChange(order.id, status)}
                          >
                            {status.charAt(0).toUpperCase() + status.slice(1)}
                          </Button>
                        )
                      )}
                    </div>
                  </div>
                </CardContent>
              )}
            </Card>
          );
        })}

        {orders.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              No orders found
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
