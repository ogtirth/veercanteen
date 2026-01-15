"use client";

import { useEffect, useState } from "react";
import { getMenuItems, createWalkInOrder, confirmWalkInPayment } from "@/lib/admin-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Search,
  Plus,
  Minus,
  Trash2,
  ShoppingCart,
  IndianRupee,
  CreditCard,
  Banknote,
  ImageIcon,
  X,
  Percent,
  Calculator,
  Receipt,
  QrCode,
  Wallet,
  Check,
  Clock,
  TrendingUp,
  Package
} from "lucide-react";
import Image from "next/image";

interface MenuItem {
  id: string;
  name: string;
  price: number;
  description: string | null;
  category: string | null;
  stock: number;
  unlimitedStock: boolean;
  isAvailable: boolean;
  image: string | null;
}

interface CartItem {
  menuItem: MenuItem;
  quantity: number;
}

export default function CounterPage() {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [orderId, setOrderId] = useState<string | null>(null);
  const [upiId, setUpiId] = useState("");
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [discount, setDiscount] = useState(0);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "upi" | "card">("cash");
  const [receivedAmount, setReceivedAmount] = useState("");
  const [todayStats, setTodayStats] = useState({ orders: 0, revenue: 0 });

  const categories = Array.from(new Set(menuItems.map(item => item.category).filter(Boolean)));

  useEffect(() => {
    loadMenu();
    loadTodayStats();
    const interval = setInterval(loadTodayStats, 60000); // Refresh every minute
    return () => clearInterval(interval);
  }, []);

  const loadMenu = async () => {
    try {
      const result = await getMenuItems();
      if (result.success && result.data) {
        setMenuItems(result.data.filter((item: any) => item.isAvailable).map(item => ({
          ...item,
          unlimitedStock: (item as any).unlimitedStock || false
        })) as MenuItem[]);
      }
    } catch (error) {
      toast.error("Failed to load menu");
    } finally {
      setLoading(false);
    }
  };

  const loadTodayStats = () => {
    // This would be replaced with actual API call
    // For now using placeholder
    setTodayStats({ orders: 0, revenue: 0 });
  };

  const filteredItems = menuItems.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "all" || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const addToCart = (item: MenuItem) => {
    const existing = cart.find((c) => c.menuItem.id === item.id);
    if (existing) {
      if (item.unlimitedStock || existing.quantity < item.stock) {
        setCart(
          cart.map((c) =>
            c.menuItem.id === item.id ? { ...c, quantity: c.quantity + 1 } : c
          )
        );
        toast.success(`${item.name} added`);
      } else {
        toast.error("Not enough stock");
      }
    } else {
      setCart([...cart, { menuItem: item, quantity: 1 }]);
      toast.success(`${item.name} added to cart`);
    }
  };

  const updateQuantity = (itemId: string, change: number) => {
    const item = cart.find((c) => c.menuItem.id === itemId);
    if (item) {
      const newQty = item.quantity + change;
      if (newQty <= 0) {
        setCart(cart.filter((c) => c.menuItem.id !== itemId));
      } else if (item.menuItem.unlimitedStock || newQty <= item.menuItem.stock) {
        setCart(
          cart.map((c) =>
            c.menuItem.id === itemId ? { ...c, quantity: newQty } : c
          )
        );
      } else {
        toast.error("Not enough stock");
      }
    }
  };

  const removeFromCart = (itemId: string) => {
    setCart(cart.filter((c) => c.menuItem.id !== itemId));
    toast.success("Item removed");
  };

  const clearCart = () => {
    setCart([]);
    setDiscount(0);
    setCustomerName("");
    setCustomerPhone("");
    setReceivedAmount("");
  };

  const subtotal = cart.reduce((sum, item) => sum + item.menuItem.price * item.quantity, 0);
  const discountAmount = (subtotal * discount) / 100;
  const total = subtotal - discountAmount;
  const changeAmount = receivedAmount ? parseFloat(receivedAmount) - total : 0;

  const handleCheckout = async () => {
    if (cart.length === 0) {
      toast.error("Cart is empty");
      return;
    }

    try {
      const items = cart.map((c) => ({
        menuItemId: c.menuItem.id,
        quantity: c.quantity
      }));

      const result = await createWalkInOrder(items);

      if (result.success && result.data) {
        setOrderId(result.data.id);
        
        if (paymentMethod === "cash") {
          await handlePaymentConfirmation(result.data.id);
        } else {
          setShowPaymentModal(true);
        }
      } else {
        toast.error(result.error || "Failed to create order");
      }
    } catch (error) {
      toast.error("Failed to process order");
    }
  };

  const handlePaymentConfirmation = async (id: string) => {
    try {
      const result = await confirmWalkInPayment(
        id,
        paymentMethod.toUpperCase(),
        paymentMethod === "upi" ? upiId : undefined
      );

      if (result.success) {
        toast.success("Order completed successfully!");
        setShowPaymentModal(false);
        clearCart();
        setOrderId(null);
        setUpiId("");
        loadTodayStats();
      } else {
        toast.error(result.error || "Payment failed");
      }
    } catch (error) {
      toast.error("Something went wrong");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading menu...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Stats */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">POS Counter</h1>
          <p className="text-muted-foreground mt-1">Walk-in order management</p>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Today's Orders</p>
                  <p className="text-2xl font-bold">{todayStats.orders}</p>
                </div>
                <div className="p-3 bg-blue-50 rounded-lg">
                  <Receipt className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Today's Revenue</p>
                  <p className="text-2xl font-bold">₹{todayStats.revenue.toFixed(0)}</p>
                </div>
                <div className="p-3 bg-green-50 rounded-lg">
                  <TrendingUp className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Products Section */}
        <div className="lg:col-span-2 space-y-4">
          {/* Search and Filters */}
          <Card>
            <CardContent className="p-4 space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
                <Input
                  placeholder="Search items by name or description..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>

              <div className="flex gap-2 overflow-x-auto pb-2">
                <Button
                  variant={selectedCategory === "all" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedCategory("all")}
                >
                  All Items
                </Button>
                {categories.map((cat) => (
                  <Button
                    key={cat}
                    variant={selectedCategory === cat ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedCategory(cat || "all")}
                  >
                    {cat}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Menu Items Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {filteredItems.map((item) => (
              <Card
                key={item.id}
                className="hover:shadow-lg transition-all cursor-pointer group"
                onClick={() => addToCart(item)}
              >
                <CardContent className="p-4">
                  <div className="aspect-square relative mb-3 bg-gray-100 rounded-lg overflow-hidden">
                    {item.image ? (
                      <Image
                        src={item.image}
                        alt={item.name}
                        fill
                        className="object-cover group-hover:scale-110 transition-transform duration-200"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <ImageIcon className="w-12 h-12 text-gray-400" />
                      </div>
                    )}
                    {item.unlimitedStock && (
                      <Badge className="absolute top-2 right-2 bg-green-500">∞ Stock</Badge>
                    )}
                  </div>
                  
                  <h3 className="font-semibold line-clamp-1 mb-1">{item.name}</h3>
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-bold text-primary">₹{item.price}</span>
                    {!item.unlimitedStock && (
                      <Badge variant={item.stock < 10 ? "destructive" : "secondary"}>
                        {item.stock} left
                      </Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredItems.length === 0 && (
            <Card>
              <CardContent className="p-12 text-center text-muted-foreground">
                <Package className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No items found</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Cart Section */}
        <div className="space-y-4">
          <Card className="sticky top-4">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShoppingCart className="w-5 h-5" />
                  Current Order
                </div>
                <Badge>{cart.length} items</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Customer Info */}
              <div className="space-y-2">
                <Input
                  placeholder="Customer Name (Optional)"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                />
                <Input
                  placeholder="Phone Number (Optional)"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                />
              </div>

              {/* Cart Items */}
              <div className="space-y-2 max-h-[300px] overflow-y-auto">
                {cart.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <ShoppingCart className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>Cart is empty</p>
                  </div>
                ) : (
                  cart.map((item) => (
                    <div
                      key={item.menuItem.id}
                      className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg"
                    >
                      <div className="flex-1">
                        <p className="font-semibold text-sm">{item.menuItem.name}</p>
                        <p className="text-sm text-muted-foreground">
                          ₹{item.menuItem.price} × {item.quantity}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          size="icon"
                          variant="outline"
                          className="h-8 w-8"
                          onClick={() => updateQuantity(item.menuItem.id, -1)}
                        >
                          <Minus className="w-4 h-4" />
                        </Button>
                        <span className="w-8 text-center font-semibold">{item.quantity}</span>
                        <Button
                          size="icon"
                          variant="outline"
                          className="h-8 w-8"
                          onClick={() => updateQuantity(item.menuItem.id, 1)}
                        >
                          <Plus className="w-4 h-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 text-destructive"
                          onClick={() => removeFromCart(item.menuItem.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {cart.length > 0 && (
                <>
                  {/* Discount */}
                  <div className="space-y-2 pt-4 border-t">
                    <label className="text-sm font-medium flex items-center gap-2">
                      <Percent className="w-4 h-4" />
                      Discount (%)
                    </label>
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      value={discount}
                      onChange={(e) => setDiscount(Math.min(100, Math.max(0, parseFloat(e.target.value) || 0)))}
                      placeholder="0"
                    />
                  </div>

                  {/* Totals */}
                  <div className="space-y-2 pt-4 border-t">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Subtotal:</span>
                      <span className="font-semibold">₹{subtotal.toFixed(2)}</span>
                    </div>
                    {discount > 0 && (
                      <div className="flex justify-between text-sm text-green-600">
                        <span>Discount ({discount}%):</span>
                        <span>-₹{discountAmount.toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-lg font-bold pt-2 border-t">
                      <span>Total:</span>
                      <span className="text-primary">₹{total.toFixed(2)}</span>
                    </div>
                  </div>

                  {/* Payment Method */}
                  <div className="space-y-2 pt-4 border-t">
                    <label className="text-sm font-medium">Payment Method</label>
                    <div className="grid grid-cols-3 gap-2">
                      <Button
                        variant={paymentMethod === "cash" ? "default" : "outline"}
                        onClick={() => setPaymentMethod("cash")}
                        className="flex-col h-auto py-3"
                      >
                        <Banknote className="w-5 h-5 mb-1" />
                        <span className="text-xs">Cash</span>
                      </Button>
                      <Button
                        variant={paymentMethod === "upi" ? "default" : "outline"}
                        onClick={() => setPaymentMethod("upi")}
                        className="flex-col h-auto py-3"
                      >
                        <QrCode className="w-5 h-5 mb-1" />
                        <span className="text-xs">UPI</span>
                      </Button>
                      <Button
                        variant={paymentMethod === "card" ? "default" : "outline"}
                        onClick={() => setPaymentMethod("card")}
                        className="flex-col h-auto py-3"
                      >
                        <CreditCard className="w-5 h-5 mb-1" />
                        <span className="text-xs">Card</span>
                      </Button>
                    </div>
                  </div>

                  {paymentMethod === "cash" && (
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Amount Received</label>
                      <Input
                        type="number"
                        value={receivedAmount}
                        onChange={(e) => setReceivedAmount(e.target.value)}
                        placeholder="Enter amount"
                      />
                      {changeAmount > 0 && (
                        <p className="text-sm text-green-600 font-semibold">
                          Change to return: ₹{changeAmount.toFixed(2)}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="space-y-2 pt-4">
                    <Button
                      onClick={handleCheckout}
                      className="w-full"
                      size="lg"
                    >
                      <Check className="w-5 h-5 mr-2" />
                      Complete Order - ₹{total.toFixed(2)}
                    </Button>
                    <Button
                      onClick={clearCart}
                      variant="outline"
                      className="w-full"
                    >
                      <X className="w-4 h-4 mr-2" />
                      Clear Cart
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Payment Confirmation Modal */}
      {showPaymentModal && orderId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Complete Payment</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center p-6 bg-gray-50 rounded-lg">
                <p className="text-3xl font-bold text-primary mb-2">₹{total.toFixed(2)}</p>
                <p className="text-sm text-muted-foreground">Amount to Collect</p>
              </div>

              {paymentMethod === "upi" && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">UPI Transaction ID</label>
                  <Input
                    value={upiId}
                    onChange={(e) => setUpiId(e.target.value)}
                    placeholder="Enter UPI Transaction ID"
                  />
                </div>
              )}

              <div className="flex gap-2">
                <Button
                  onClick={() => handlePaymentConfirmation(orderId)}
                  className="flex-1"
                >
                  Confirm Payment
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowPaymentModal(false);
                    setOrderId(null);
                  }}
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
