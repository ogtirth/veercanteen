"use client";

import React, { useEffect, useState, useCallback, useRef } from "react";
import { Skeleton, SkeletonText } from "@/components/ui/skeleton";
import { getAllOrders, updateOrderStatus } from "@/lib/admin-actions";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useSounds } from "@/lib/sounds";
import {
  Search,
  ChevronDown,
  Package,
  Clock,
  CheckCircle,
  XCircle,
  UtensilsCrossed,
  IndianRupee,
  User,
  Store,
  Calendar,
  RefreshCw,
  Bell,
  Flame,
  CreditCard,
  Volume2,
  VolumeX
} from "lucide-react";

interface Order {
  id: string;
  invoiceNumber: string;
  totalAmount: number;
  status: string;
  isWalkIn: boolean;
  createdAt: Date;
  user?: { name: string | null; email: string } | null;
  items: { name: string; quantity: number; priceAtTime: number }[];
}

// Use capitalized status to match database
const statusFlow = ["Pending", "Paid", "Preparing", "Ready", "Completed"];
const statusConfig: Record<string, { variant: "default" | "secondary" | "success" | "warning" | "destructive"; icon: any; label: string; color: string; bg: string }> = {
  Pending: { variant: "warning", icon: Clock, label: "Pending", color: "text-amber-600", bg: "bg-amber-100 dark:bg-amber-900/30" },
  Paid: { variant: "default", icon: CreditCard, label: "Paid", color: "text-blue-600", bg: "bg-blue-100 dark:bg-blue-900/30" },
  Preparing: { variant: "secondary", icon: Flame, label: "Preparing", color: "text-orange-600", bg: "bg-orange-100 dark:bg-orange-900/30" },
  Ready: { variant: "success", icon: Package, label: "Ready", color: "text-green-600", bg: "bg-green-100 dark:bg-green-900/30" },
  Completed: { variant: "success", icon: CheckCircle, label: "Completed", color: "text-emerald-600", bg: "bg-emerald-100 dark:bg-emerald-900/30" },
  Cancelled: { variant: "destructive", icon: XCircle, label: "Cancelled", color: "text-red-600", bg: "bg-red-100 dark:bg-red-900/30" },
};

export default function OrdersPage() {
  const sounds = useSounds();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const [lastOrderCount, setLastOrderCount] = useState(0);
  const [isLive, setIsLive] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const eventSourceRef = useRef<EventSource | null>(null);
  const processedOrdersRef = useRef<Set<string>>(new Set());

  const loadOrders = useCallback(async (showToast = false) => {
    try {
      const result = await getAllOrders();
      if (result.success && result.data) {
        const newOrders = result.data;
        setOrders(newOrders);
        setLastOrderCount(newOrders.length);
        
        if (showToast) {
          toast.success("Orders refreshed");
        }
      }
    } catch (error) {
      if (showToast) {
        toast.error("Failed to load orders");
      }
    } finally {
      setLoading(false);
    }
  }, []);

  // Handle new order from SSE
  const handleNewOrder = useCallback((order: any) => {
    // Prevent duplicate processing
    if (processedOrdersRef.current.has(order.id)) return;
    processedOrdersRef.current.add(order.id);
    
    // Keep only last 100 order IDs to prevent memory leak
    if (processedOrdersRef.current.size > 100) {
      const arr = Array.from(processedOrdersRef.current);
      processedOrdersRef.current = new Set(arr.slice(-50));
    }

    // Play sound and announce
    sounds.announceNewOrder(order.totalAmount, order.invoiceNumber);
    
    // Show toast notification
    const itemsList = order.items?.map((i: any) => `${i.quantity}x ${i.menuItem?.name || i.name}`).join(', ') || '';
    toast.success(
      <div className="flex flex-col gap-1">
        <span className="font-bold">🔔 New Order! ₹{order.totalAmount}</span>
        <span className="text-xs opacity-80">{itemsList}</span>
        <span className="text-xs opacity-60">#{order.invoiceNumber}</span>
      </div>,
      { duration: 5000 }
    );

    // Reload orders to get the new one in the list
    loadOrders();
  }, [sounds, loadOrders]);

  // Connect to live orders SSE
  useEffect(() => {
    if (!isLive) {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
        setIsConnected(false);
      }
      return;
    }

    const connectSSE = () => {
      const eventSource = new EventSource('/api/admin/live-orders');
      eventSourceRef.current = eventSource;

      eventSource.onopen = () => {
        setIsConnected(true);
      };

      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'connected') {
            setIsConnected(true);
          } else if (data.type === 'new_order') {
            handleNewOrder(data.order);
          } else if (data.type === 'order_update') {
            // Refresh orders when status changes
            loadOrders();
          }
        } catch (error) {
          console.error('Error parsing SSE data:', error);
        }
      };

      eventSource.onerror = () => {
        setIsConnected(false);
        eventSource.close();
        // Reconnect after 5 seconds
        setTimeout(connectSSE, 5000);
      };
    };

    connectSSE();

    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
    };
  }, [isLive, handleNewOrder, loadOrders]);

  // Initial load
  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  const handleStatusUpdate = async (orderId: string, newStatus: string) => {
    try {
      const result = await updateOrderStatus(orderId, newStatus);
      if (result.success) {
        sounds.statusUpdate();
        toast.success(`Order updated to ${newStatus}`);
        loadOrders();
      } else {
        sounds.error();
        toast.error(result.error || "Failed to update order");
      }
    } catch (error) {
      sounds.error();
      toast.error("Something went wrong");
    }
  };

  const filteredOrders = orders.filter((order) => {
    const matchesSearch =
      order.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.user?.name?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const ordersByStatus = {
    Pending: orders.filter((o) => o.status === "Pending").length,
    Paid: orders.filter((o) => o.status === "Paid").length,
    Preparing: orders.filter((o) => o.status === "Preparing").length,
    Ready: orders.filter((o) => o.status === "Ready").length,
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between animate-slide-up">
          <Skeleton className="h-8 w-1/3" />
          <div className="flex gap-2">
            <Skeleton className="h-8 w-20" />
            <Skeleton className="h-8 w-20" />
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 animate-slide-up">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
        <div className="space-y-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="p-4">
              <SkeletonText lines={2} />
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between animate-slide-up">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Order Management</h1>
          <p className="text-muted-foreground mt-1">
            Track and manage all orders
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={isLive ? "default" : "outline"}
            size="sm"
            onClick={() => setIsLive(!isLive)}
            className={`gap-2 ${isLive ? "bg-green-600 hover:bg-green-700" : ""}`}
          >
            {isLive ? (
              <>
                <Volume2 className="w-4 h-4" />
                Live
                {isConnected && (
                  <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                )}
              </>
            ) : (
              <>
                <VolumeX className="w-4 h-4" />
                Muted
              </>
            )}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => loadOrders(true)}
            className="gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 animate-slide-up" style={{ animationDelay: "100ms" }}>
        {Object.entries(ordersByStatus).map(([status, count]) => {
          const config = statusConfig[status];
          if (!config) return null;
          const IconComponent = config.icon;
          return (
            <Card
              key={status}
              className={`cursor-pointer transition-all duration-200 ${
                statusFilter === status ? "ring-2 ring-primary shadow-lg" : "hover:shadow-card"
              }`}
              onClick={() => setStatusFilter(statusFilter === status ? "all" : status)}
            >
              <CardContent className="p-4 flex items-center gap-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${config.bg}`}>
                  <IconComponent className={`w-6 h-6 ${config.color}`} />
                </div>
                <div>
                  <p className="text-2xl font-bold">{count}</p>
                  <p className="text-sm text-muted-foreground">{status}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Search & Filter */}
      <Card className="animate-slide-up" style={{ animationDelay: "200ms" }}>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                placeholder="Search by invoice or customer..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 h-11 border border-input rounded-xl focus:outline-none focus:ring-2 focus:ring-ring bg-background"
            >
              <option value="all">All Status</option>
              {Object.keys(statusConfig).map((status) => (
                <option key={status} value={status}>
                  {statusConfig[status]!.label}
                </option>
              ))}
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Orders List */}
      <div className="space-y-4">
        {filteredOrders.map((order, index) => {
          const config = statusConfig[order.status] || statusConfig.Pending!;
          const isExpanded = expandedOrder === order.id;
          const currentStatusIndex = statusFlow.indexOf(order.status);

          return (
            <Card
              key={order.id}
              className={`overflow-hidden transition-all duration-200 animate-slide-up ${
                order.status === "Pending" ? "border-l-4 border-l-amber-500" :
                order.status === "Paid" ? "border-l-4 border-l-blue-500" :
                order.status === "Preparing" ? "border-l-4 border-l-orange-500" :
                order.status === "Ready" ? "border-l-4 border-l-green-500" : ""
              } hover:shadow-card`}
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <CardContent className="p-0">
                {/* Order Header */}
                <div
                  className="p-4 cursor-pointer flex items-center justify-between"
                  onClick={() => setExpandedOrder(isExpanded ? null : order.id)}
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${config?.bg || "bg-gray-100"}`}>
                      {order.isWalkIn ? (
                        <Store className={`w-6 h-6 ${config?.color || "text-gray-600"}`} />
                      ) : (
                        <Package className={`w-6 h-6 ${config?.color || "text-gray-600"}`} />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-bold text-lg">{order.invoiceNumber}</h3>
                        <Badge variant={config?.variant || "secondary"} className="gap-1">
                          {config?.icon && <config.icon className="w-3 h-3" />}
                          {config?.label || order.status}
                        </Badge>
                        {order.isWalkIn && (
                          <Badge variant="outline" className="text-xs">
                            Walk-in
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {new Date(order.createdAt).toLocaleString()}
                        </span>
                        <span className="flex items-center gap-1">
                          <User className="w-3 h-3" />
                          {order.isWalkIn ? "Walk-in Customer" : order.user?.name || "Customer"}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="font-bold text-xl text-primary flex items-center gap-1">
                        <IndianRupee className="w-5 h-5" />
                        {order.totalAmount}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {order.items.length} item{order.items.length > 1 ? 's' : ''}
                      </p>
                    </div>
                    <div className={`transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`}>
                      <ChevronDown className="w-5 h-5 text-muted-foreground" />
                    </div>
                  </div>
                </div>

                {/* Expanded Content */}
                {isExpanded && (
                  <div className="px-4 pb-4 border-t animate-fade-in">
                    {/* Items */}
                    <div className="mt-4 space-y-2">
                      <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Order Items</h4>
                      <div className="grid gap-2">
                        {order.items.map((item, i) => (
                          <div
                            key={i}
                            className="flex items-center justify-between p-3 rounded-xl bg-secondary/50"
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                                <UtensilsCrossed className="w-5 h-5 text-primary" />
                              </div>
                              <div>
                                <span className="font-medium">{item.name}</span>
                                <p className="text-xs text-muted-foreground">₹{item.priceAtTime} each</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-4">
                              <Badge variant="secondary" className="text-sm">×{item.quantity}</Badge>
                              <span className="font-bold text-primary">₹{item.priceAtTime * item.quantity}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                      
                      {/* Total */}
                      <div className="flex justify-between items-center p-3 rounded-xl bg-primary/10 mt-3">
                        <span className="font-semibold">Total Amount</span>
                        <span className="text-xl font-bold text-primary">₹{order.totalAmount}</span>
                      </div>
                    </div>

                    {/* Status Actions */}
                    {order.status !== "Completed" && order.status !== "Cancelled" && (
                      <div className="mt-4 pt-4 border-t">
                        <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide mb-3">Update Status</h4>
                        <div className="flex flex-wrap gap-2">
                          {statusFlow.slice(currentStatusIndex + 1).map((status) => {
                            const statusCfg = statusConfig[status];
                            if (!statusCfg) return null;
                            return (
                              <Button
                                key={status}
                                variant="outline"
                                size="sm"
                                onClick={() => handleStatusUpdate(order.id, status)}
                                className="gap-2"
                              >
                                {React.createElement(statusCfg.icon, { className: `w-4 h-4 ${statusCfg.color}` })}
                                {statusCfg.label}
                              </Button>
                            );
                          })}
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleStatusUpdate(order.id, "Cancelled")}
                            className="gap-2"
                          >
                            <XCircle className="w-4 h-4" />
                            Cancel
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {filteredOrders.length === 0 && (
        <div className="text-center py-16 bg-secondary/30 rounded-2xl">
          <Package className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
          <p className="text-muted-foreground font-medium">No orders found</p>
          <p className="text-sm text-muted-foreground mt-1">Orders will appear here when customers place them</p>
        </div>
      )}
    </div>
  );
}
