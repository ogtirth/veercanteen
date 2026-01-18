"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getDashboardStats, getAnalytics } from "@/lib/admin-actions";
import { Skeleton, SkeletonText } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useSounds } from "@/lib/sounds";
import { 
  TrendingUp, 
  TrendingDown,
  ShoppingBag, 
  IndianRupee, 
  Clock, 
  AlertTriangle,
  CheckCircle,
  Package,
  Users,
  ArrowRight,
  Store,
  Utensils,
  Calendar,
  BarChart3,
  PieChart,
  Award,
  Target,
  Zap,
  RefreshCw,
  Coffee,
  Eye
} from "lucide-react";

interface Stats {
  todayOrders: number;
  todayRevenue: number;
  totalRevenue: number;
  pendingCount: number;
  lowStockItems: number;
  recentOrders: any[];
}

interface Analytics {
  totalOrders: number;
  totalRevenue: number;
  avgOrderValue: number;
  topSellingItems: { name: string; totalSold: number; revenue: number }[];
  salesByCategory: { category: string; count: number; revenue: number }[];
  dailyRevenue: { date: string; revenue: number; orders: number }[];
  customerStats: {
    totalCustomers: number;
    newToday: number;
    repeatCustomers: number;
  };
  ordersByStatus: Record<string, number>;
  peakHours: { hour: number; orders: number }[];
}

export default function AdminDashboard() {
  const sounds = useSounds();
  const [stats, setStats] = useState<Stats | null>(null);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [statsResult, analyticsResult] = await Promise.all([
        getDashboardStats(),
        getAnalytics(),
      ]);
      
      if (statsResult.success && statsResult.data) {
        setStats(statsResult.data);
      }
      if (analyticsResult.success && analyticsResult.data) {
        setAnalytics(analyticsResult.data);
      }
    } catch (error) {
      console.error("Failed to load dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const refreshData = () => {
    sounds.click();
    setLoading(true);
    loadData();
  };

  const getStatusBadge = (status: string) => {
    const config: Record<string, { variant: "default" | "secondary" | "success" | "warning" | "destructive"; label: string }> = {
      Pending: { variant: "warning", label: "Pending" },
      Paid: { variant: "success", label: "Paid" },
      Preparing: { variant: "secondary", label: "Preparing" },
      Ready: { variant: "default", label: "Ready" },
      Completed: { variant: "success", label: "Completed" },
      Cancelled: { variant: "destructive", label: "Cancelled" },
    };
    const { variant, label } = config[status] || { variant: "secondary" as const, label: status };
    return <Badge variant={variant}>{label}</Badge>;
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <Skeleton className="h-8 w-40 mb-2" />
            <Skeleton className="h-4 w-64" />
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-8 w-24" />
            <Skeleton className="h-8 w-24" />
          </div>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="p-6">
              <Skeleton className="h-8 w-1/2 mb-2" />
              <SkeletonText lines={2} />
            </Card>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {Array.from({ length: 2 }).map((_, i) => (
            <Card key={i} className="p-6">
              <Skeleton className="h-8 w-1/3 mb-2" />
              <SkeletonText lines={3} />
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const totalRevenue = analytics?.totalRevenue || 0;
  const avgOrderValue = analytics?.avgOrderValue || 0;
  const growthRate = 12.5; // Calculate from historical data in production

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="animate-slide-up">
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Welcome back! Here&apos;s your business overview
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={refreshData} className="gap-2">
            <RefreshCw className="w-4 h-4" />
            Refresh
          </Button>
          <Button asChild size="sm" className="gap-2">
            <Link href="/admin/counter">
              <Store className="w-4 h-4" />
              Counter
            </Link>
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 animate-slide-up" style={{ animationDelay: "50ms" }}>
        <Card className="hover:shadow-card transition-all bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Today&apos;s Revenue</p>
                <p className="text-3xl font-bold text-primary">₹{stats?.todayRevenue?.toLocaleString() || 0}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {stats?.todayOrders || 0} orders today
                </p>
              </div>
              <div className="w-14 h-14 rounded-2xl bg-primary/20 flex items-center justify-center">
                <IndianRupee className="w-7 h-7 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-card transition-all bg-gradient-to-br from-green-500/5 to-green-500/10 border-green-500/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Revenue</p>
                <p className="text-3xl font-bold text-green-600">₹{stats?.totalRevenue?.toLocaleString() || 0}</p>
                <p className="text-xs text-green-600 flex items-center gap-1 mt-1">
                  <TrendingUp className="w-3 h-3" />
                  All time earnings
                </p>
              </div>
              <div className="w-14 h-14 rounded-2xl bg-green-100 flex items-center justify-center">
                <TrendingUp className="w-7 h-7 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-card transition-all">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Orders</p>
                <p className="text-3xl font-bold">{analytics?.totalOrders || 0}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {stats?.pendingCount || 0} pending
                </p>
              </div>
              <div className="w-14 h-14 rounded-2xl bg-blue-100 flex items-center justify-center">
                <ShoppingBag className="w-7 h-7 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-card transition-all">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg Order Value</p>
                <p className="text-3xl font-bold">₹{avgOrderValue.toFixed(0)}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {analytics?.customerStats?.totalCustomers || 0} customers
                </p>
              </div>
              <div className="w-14 h-14 rounded-2xl bg-purple-100 flex items-center justify-center">
                <Target className="w-7 h-7 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alerts Section */}
      {(stats?.lowStockItems || 0) > 0 && (
        <Card className="border-amber-200 bg-amber-50/50 animate-slide-up" style={{ animationDelay: "100ms" }}>
          <CardContent className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="font-medium">Low Stock Alert</p>
                <p className="text-sm text-muted-foreground">
                  {stats?.lowStockItems} items are running low on stock
                </p>
              </div>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link href="/admin/menu">
                View Items
                <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="animate-slide-up" style={{ animationDelay: "150ms" }}>
        <TabsList className="grid w-full max-w-md grid-cols-3">
          <TabsTrigger value="overview" className="gap-2">
            <BarChart3 className="w-4 h-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="products" className="gap-2">
            <Award className="w-4 h-4" />
            Top Products
          </TabsTrigger>
          <TabsTrigger value="orders" className="gap-2">
            <Package className="w-4 h-4" />
            Orders
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="mt-6">
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Revenue Chart Placeholder */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Revenue Trend</CardTitle>
                    <CardDescription>Last 7 days performance</CardDescription>
                  </div>
                  <Badge variant="secondary" className="gap-1">
                    <TrendingUp className="w-3 h-3" />
                    Live
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {(analytics?.dailyRevenue || []).slice(0, 7).map((day, index) => {
                    const maxRevenue = Math.max(...(analytics?.dailyRevenue || []).map(d => d.revenue));
                    const percentage = maxRevenue > 0 ? (day.revenue / maxRevenue) * 100 : 0;
                    
                    return (
                      <div key={day.date} className="space-y-1">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">
                            {new Date(day.date).toLocaleDateString('en-US', { weekday: 'short', day: 'numeric' })}
                          </span>
                          <span className="font-medium">₹{day.revenue.toLocaleString()}</span>
                        </div>
                        <div className="h-2 bg-secondary rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-primary rounded-full transition-all duration-500"
                            style={{ width: `${percentage}%`, animationDelay: `${index * 100}ms` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                  {(!analytics?.dailyRevenue || analytics.dailyRevenue.length === 0) && (
                    <div className="text-center py-8 text-muted-foreground">
                      <BarChart3 className="w-12 h-12 mx-auto mb-2 opacity-30" />
                      <p>No revenue data available</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Sales by Category */}
            <Card>
              <CardHeader>
                <CardTitle>Sales by Category</CardTitle>
                <CardDescription>Revenue distribution across categories</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {(analytics?.salesByCategory || []).map((cat, index) => {
                    const totalCatRevenue = (analytics?.salesByCategory || []).reduce((sum, c) => sum + c.revenue, 0);
                    const percentage = totalCatRevenue > 0 ? (cat.revenue / totalCatRevenue) * 100 : 0;
                    const colors = [
                      "bg-blue-500", "bg-green-500", "bg-amber-500", 
                      "bg-purple-500", "bg-pink-500"
                    ];
                    
                    return (
                      <div key={cat.category} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className={`w-3 h-3 rounded-full ${colors[index % colors.length]}`} />
                            <span className="font-medium">{cat.category || "Other"}</span>
                          </div>
                          <div className="text-right">
                            <p className="font-medium">₹{cat.revenue.toLocaleString()}</p>
                            <p className="text-xs text-muted-foreground">{cat.count} orders</p>
                          </div>
                        </div>
                        <div className="h-2 bg-secondary rounded-full overflow-hidden">
                          <div 
                            className={`h-full ${colors[index % colors.length]} rounded-full transition-all duration-500`}
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                  {(!analytics?.salesByCategory || analytics.salesByCategory.length === 0) && (
                    <div className="text-center py-8 text-muted-foreground">
                      <PieChart className="w-12 h-12 mx-auto mb-2 opacity-30" />
                      <p>No category data available</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Peak Hours */}
            <Card>
              <CardHeader>
                <CardTitle>Peak Hours</CardTitle>
                <CardDescription>Busiest hours of operation</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-6 gap-2">
                  {Array.from({ length: 12 }, (_, i) => {
                    const hour = i + 8; // 8 AM to 7 PM
                    const peakData = analytics?.peakHours?.find(p => p.hour === hour);
                    const orders = peakData?.orders || 0;
                    const maxOrders = Math.max(...(analytics?.peakHours || []).map(p => p.orders), 1);
                    const intensity = orders / maxOrders;
                    
                    return (
                      <div key={hour} className="text-center">
                        <div 
                          className={`h-16 rounded-lg flex items-end justify-center transition-all ${
                            intensity > 0.7 ? "bg-primary" :
                            intensity > 0.4 ? "bg-primary/60" :
                            intensity > 0.1 ? "bg-primary/30" :
                            "bg-secondary"
                          }`}
                        >
                          <span className={`text-xs font-medium mb-1 ${intensity > 0.4 ? "text-white" : "text-muted-foreground"}`}>
                            {orders}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {hour > 12 ? `${hour - 12}PM` : hour === 12 ? "12PM" : `${hour}AM`}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Order Status Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Order Status</CardTitle>
                <CardDescription>Current order distribution</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(analytics?.ordersByStatus || {}).map(([status, count]) => {
                    const icons: Record<string, any> = {
                      Pending: Clock,
                      Paid: CheckCircle,
                      Preparing: Coffee,
                      Ready: Package,
                      Completed: CheckCircle,
                      Cancelled: AlertTriangle,
                    };
                    const colors: Record<string, string> = {
                      Pending: "text-amber-600 bg-amber-100",
                      Paid: "text-green-600 bg-green-100",
                      Preparing: "text-blue-600 bg-blue-100",
                      Ready: "text-purple-600 bg-purple-100",
                      Completed: "text-green-600 bg-green-100",
                      Cancelled: "text-red-600 bg-red-100",
                    };
                    const Icon = icons[status] || Package;
                    const colorClass = colors[status] || "text-gray-600 bg-gray-100";
                    
                    return (
                      <div key={status} className="flex items-center justify-between p-3 rounded-lg bg-secondary/50">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${colorClass}`}>
                            <Icon className="w-4 h-4" />
                          </div>
                          <span className="font-medium">{status}</span>
                        </div>
                        <Badge variant="secondary">{count}</Badge>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Top Products Tab */}
        <TabsContent value="products" className="mt-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Award className="w-5 h-5 text-amber-500" />
                    Top Selling Products
                  </CardTitle>
                  <CardDescription>Best performing items by revenue</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {(analytics?.topSellingItems || []).length > 0 ? (
                <div className="space-y-4">
                  {analytics?.topSellingItems.map((item, index) => (
                    <div 
                      key={item.name}
                      className="flex items-center gap-4 p-4 rounded-xl bg-secondary/50 hover:bg-secondary transition-colors animate-slide-up"
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-lg ${
                        index === 0 ? "bg-amber-100 text-amber-600" :
                        index === 1 ? "bg-gray-200 text-gray-600" :
                        index === 2 ? "bg-orange-100 text-orange-600" :
                        "bg-secondary text-muted-foreground"
                      }`}>
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold">{item.name}</h4>
                        <p className="text-sm text-muted-foreground">
                          {item.totalSold} units sold
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-primary">₹{item.revenue.toLocaleString()}</p>
                        <p className="text-xs text-muted-foreground">revenue</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <Award className="w-16 h-16 mx-auto mb-4 opacity-30" />
                  <p className="text-lg font-medium">No sales data yet</p>
                  <p className="text-sm">Start selling to see top products</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Recent Orders Tab */}
        <TabsContent value="orders" className="mt-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Recent Orders</CardTitle>
                  <CardDescription>Latest order activity</CardDescription>
                </div>
                <Button variant="outline" size="sm" asChild>
                  <Link href="/admin/orders">
                    View All
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                {(stats?.recentOrders || []).length > 0 ? (
                  <div className="space-y-4">
                    {stats?.recentOrders.map((order: any, index: number) => (
                      <div
                        key={order.id}
                        className="flex items-center justify-between p-4 rounded-xl bg-secondary/50 hover:bg-secondary transition-colors animate-slide-up"
                        style={{ animationDelay: `${index * 50}ms` }}
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
                            <p className="font-semibold">{order.invoiceNumber}</p>
                            <p className="text-sm text-muted-foreground">
                              {order.items?.length || 0} items • {new Date(order.createdAt).toLocaleString()}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <p className="font-bold text-primary">₹{order.totalAmount}</p>
                            <p className="text-xs text-muted-foreground">
                              {order.isWalkIn ? "Walk-in" : "Online"}
                            </p>
                          </div>
                          {getStatusBadge(order.status)}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    <ShoppingBag className="w-16 h-16 mx-auto mb-4 opacity-30" />
                    <p className="text-lg font-medium">No recent orders</p>
                    <p className="text-sm">Orders will appear here as they come in</p>
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 animate-slide-up" style={{ animationDelay: "200ms" }}>
        <Link href="/admin/counter" className="block">
          <Card className="hover:shadow-card transition-all cursor-pointer group h-full">
            <CardContent className="p-6 flex flex-col items-center text-center">
              <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <Store className="w-7 h-7 text-primary" />
              </div>
              <h3 className="font-semibold">Counter Sales</h3>
              <p className="text-sm text-muted-foreground">Process walk-in orders</p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/admin/menu" className="block">
          <Card className="hover:shadow-card transition-all cursor-pointer group h-full">
            <CardContent className="p-6 flex flex-col items-center text-center">
              <div className="w-14 h-14 rounded-2xl bg-green-100 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <Utensils className="w-7 h-7 text-green-600" />
              </div>
              <h3 className="font-semibold">Menu Items</h3>
              <p className="text-sm text-muted-foreground">Manage food items</p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/admin/orders" className="block">
          <Card className="hover:shadow-card transition-all cursor-pointer group h-full">
            <CardContent className="p-6 flex flex-col items-center text-center">
              <div className="w-14 h-14 rounded-2xl bg-blue-100 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <Package className="w-7 h-7 text-blue-600" />
              </div>
              <h3 className="font-semibold">Orders</h3>
              <p className="text-sm text-muted-foreground">View all orders</p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/admin/users" className="block">
          <Card className="hover:shadow-card transition-all cursor-pointer group h-full">
            <CardContent className="p-6 flex flex-col items-center text-center">
              <div className="w-14 h-14 rounded-2xl bg-purple-100 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <Users className="w-7 h-7 text-purple-600" />
              </div>
              <h3 className="font-semibold">Users</h3>
              <p className="text-sm text-muted-foreground">Manage customers</p>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  );
}
