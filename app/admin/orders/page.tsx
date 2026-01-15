"use client";

import React, { useEffect, useState } from "react";
import { getAllOrders, updateOrderStatus } from "@/lib/admin-actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Search,
  Filter,
  ChevronDown,
  ChevronUp,
  Package,
  Clock,
  CheckCircle,
  XCircle,
  Truck,
  UtensilsCrossed,
  IndianRupee,
  User,
  Store,
  Calendar
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

const statusFlow = ["pending", "confirmed", "preparing", "ready", "completed"];
const statusConfig: Record<string, { variant: "default" | "secondary" | "success" | "warning" | "destructive"; icon: any; label: string }> = {
  pending: { variant: "warning", icon: Clock, label: "Pending" },
  confirmed: { variant: "default", icon: CheckCircle, label: "Confirmed" },
  preparing: { variant: "secondary", icon: UtensilsCrossed, label: "Preparing" },
  ready: { variant: "success", icon: Package, label: "Ready" },
  completed: { variant: "success", icon: CheckCircle, label: "Completed" },
  cancelled: { variant: "destructive", icon: XCircle, label: "Cancelled" },
};

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    try {
      const result = await getAllOrders();
      if (result.success && result.data) {
        setOrders(result.data);
      }
    } catch (error) {
      toast.error("Failed to load orders");
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (orderId: string, newStatus: string) => {
    try {
      const result = await updateOrderStatus(orderId, newStatus);
      if (result.success) {
        toast.success(`Order updated to ${newStatus}`);
        loadOrders();
      } else {
        toast.error(result.error || "Failed to update order");
      }
    } catch (error) {
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
    pending: orders.filter((o) => o.status === "pending").length,
    confirmed: orders.filter((o) => o.status === "confirmed").length,
    preparing: orders.filter((o) => o.status === "preparing").length,
    ready: orders.filter((o) => o.status === "ready").length,
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
    <div className="space-y-6">
      {/* Header */}
      <div className="animate-slide-up">
        <h1 className="text-3xl font-bold tracking-tight">Order Management</h1>
        <p className="text-muted-foreground mt-1">
          Track and manage all orders
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 animate-slide-up" style={{ animationDelay: "100ms" }}>
        {Object.entries(ordersByStatus).map(([status, count], index) => {
          const config = statusConfig[status as keyof typeof statusConfig] ?? statusConfig.pending;
          const IconComponent = config!.icon;
          return (
            <Card
              key={status}
              className={`cursor-pointer transition-all duration-200 ${
                statusFilter === status ? "ring-2 ring-primary" : "hover:shadow-card"
              }`}
              onClick={() => setStatusFilter(statusFilter === status ? "all" : status)}
            >
              <CardContent className="p-4 flex items-center gap-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                  status === "pending" ? "bg-amber-100" :
                  status === "confirmed" ? "bg-blue-100" :
                  status === "preparing" ? "bg-purple-100" : "bg-green-100"
                }`}>
                  <IconComponent className={`w-6 h-6 ${
                    status === "pending" ? "text-amber-600" :
                    status === "confirmed" ? "text-blue-600" :
                    status === "preparing" ? "text-purple-600" : "text-green-600"
                  }`} />
                </div>
                <div>
                  <p className="text-2xl font-bold">{count}</p>
                  <p className="text-sm text-muted-foreground capitalize">{status}</p>
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
              {(Object.keys(statusConfig) as Array<keyof typeof statusConfig>).map((status) => (
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
          const config = (statusConfig[order.status as keyof typeof statusConfig] ?? statusConfig.pending)!;
          const isExpanded = expandedOrder === order.id;
          const currentStatusIndex = statusFlow.indexOf(order.status);

          return (
            <Card
              key={order.id}
              className="overflow-hidden hover:shadow-card transition-all duration-200 animate-slide-up"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <CardContent className="p-0">
                {/* Order Header */}
                <div
                  className="p-4 cursor-pointer flex items-center justify-between"
                  onClick={() => setExpandedOrder(isExpanded ? null : order.id)}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                      {order.isWalkIn ? (
                        <Store className="w-6 h-6 text-primary" />
                      ) : (
                        <Package className="w-6 h-6 text-primary" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold">{order.invoiceNumber}</h3>
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
                          <User className="w-3 h-3" />
                          {order.isWalkIn ? "Walk-in" : order.user?.name || "Customer"}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="font-bold text-lg text-primary flex items-center gap-1">
                        <IndianRupee className="w-4 h-4" />
                        {order.totalAmount}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {order.items.length} items
                      </p>
                    </div>
                    {isExpanded ? (
                      <ChevronUp className="w-5 h-5 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-muted-foreground" />
                    )}
                  </div>
                </div>

                {/* Expanded Content */}
                {isExpanded && (
                  <div className="px-4 pb-4 border-t animate-fade-in">
                    {/* Items */}
                    <div className="mt-4 space-y-2">
                      <h4 className="font-semibold text-sm text-muted-foreground">Order Items</h4>
                      {order.items.map((item, i) => (
                        <div
                          key={i}
                          className="flex items-center justify-between p-3 rounded-lg bg-secondary/50"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                              <UtensilsCrossed className="w-4 h-4 text-primary" />
                            </div>
                            <span className="font-medium">{item.name}</span>
                          </div>
                          <div className="flex items-center gap-4">
                            <Badge variant="secondary">x{item.quantity}</Badge>
                            <span className="font-semibold">₹{item.priceAtTime * item.quantity}</span>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Status Actions */}
                    {order.status !== "completed" && order.status !== "cancelled" && (
                      <div className="mt-4 pt-4 border-t">
                        <h4 className="font-semibold text-sm text-muted-foreground mb-3">Update Status</h4>
                        <div className="flex flex-wrap gap-2">
                          {statusFlow.slice(currentStatusIndex + 1).map((status) => {
                            const statusCfg = statusConfig[status as keyof typeof statusConfig]!;
                            return (
                              <Button
                                key={status}
                                variant="outline"
                                size="sm"
                                onClick={() => handleStatusUpdate(order.id, status)}
                                className="gap-2"
                              >
                                {React.createElement(statusCfg.icon, { className: "w-4 h-4" })}
                                Mark as {statusCfg.label}
                              </Button>
                            );
                          })}
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleStatusUpdate(order.id, "cancelled")}
                            className="gap-2"
                          >
                            <XCircle className="w-4 h-4" />
                            Cancel Order
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
        <div className="text-center py-16">
          <Package className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
          <p className="text-muted-foreground">No orders found</p>
        </div>
      )}
    </div>
  );
}
