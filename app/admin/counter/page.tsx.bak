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
  X
} from "lucide-react";
import Image from "next/image";

interface MenuItem {
  id: string;
  name: string;
  price: number;
  description?: string;
  category?: string;
  stock: number;
  isAvailable: boolean;
  image?: string;
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

  const categories = ["Snacks", "Beverages", "Meals", "Desserts", "Breakfast"];

  useEffect(() => {
    loadMenu();
  }, []);

  const loadMenu = async () => {
    try {
      const result = await getMenuItems();
      if (result.success && result.data) {
        setMenuItems(result.data.filter((item: any) => item.isAvailable) as MenuItem[]);
      }
    } catch (error) {
      toast.error("Failed to load menu");
    } finally {
      setLoading(false);
    }
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
      if (existing.quantity < item.stock) {
        setCart(
          cart.map((c) =>
            c.menuItem.id === item.id ? { ...c, quantity: c.quantity + 1 } : c
          )
        );
      } else {
        toast.error("Not enough stock");
      }
    } else {
      setCart([...cart, { menuItem: item, quantity: 1 }]);
    }
  };

  const updateQuantity = (itemId: string, change: number) => {
    const item = cart.find((c) => c.menuItem.id === itemId);
    if (item) {
      const newQty = item.quantity + change;
      if (newQty <= 0) {
        setCart(cart.filter((c) => c.menuItem.id !== itemId));
      } else if (newQty <= item.menuItem.stock) {
        setCart(cart.map((c) => (c.menuItem.id === itemId ? { ...c, quantity: newQty } : c)));
      } else {
        toast.error("Not enough stock");
      }
    }
  };

  const totalAmount = cart.reduce((sum, item) => sum + item.menuItem.price * item.quantity, 0);

  const handleCreateOrder = async (paymentMethod: "cash" | "upi") => {
    if (cart.length === 0) {
      toast.error("Cart is empty");
      return;
    }

    const cartData = cart.map((item) => ({
      menuItemId: item.menuItem.id,
      quantity: item.quantity,
    }));

    try {
      const result = await createWalkInOrder(cartData);
      if (result.success && result.data) {
        setOrderId(result.data.id);
        if (paymentMethod === "upi") {
          setShowPaymentModal(true);
        } else {
          await confirmWalkInPayment(result.data.id, "cash");
          toast.success("Order completed!");
          setCart([]);
          loadMenu();
        }
      } else {
        toast.error(result.error || "Failed to create order");
      }
    } catch (error) {
      toast.error("Something went wrong");
    }
  };

  const handleConfirmPayment = async () => {
    if (!orderId) return;
    try {
      const result = await confirmWalkInPayment(orderId, "UPI", upiId);
      if (result.success) {
        toast.success("Payment confirmed!");
        setShowPaymentModal(false);
        setOrderId(null);
        setUpiId("");
        setCart([]);
        loadMenu();
      }
    } catch (error) {
      toast.error("Payment confirmation failed");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading counter...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Counter</h1>
        <p className="text-muted-foreground mt-1">Create walk-in orders</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Menu Items */}
        <div className="lg:col-span-2 space-y-4">
          {/* Search & Filter */}
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-col md:flex-row gap-3">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    placeholder="Search items..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="px-4 py-2 h-11 border border-input rounded-xl focus:outline-none focus:ring-2 focus:ring-ring bg-background"
                >
                  <option value="all">All Categories</option>
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>
            </CardContent>
          </Card>

          {/* Menu Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredItems.map((item) => (
              <Card
                key={item.id}
                className="hover:shadow-card transition-all duration-200 cursor-pointer group animate-scale-in"
                onClick={() => addToCart(item)}
              >
                <CardContent className="p-4">
                  <div className="flex gap-4">
                    {/* Item Image */}
                    <div className="w-24 h-24 rounded-xl overflow-hidden bg-gradient-to-br from-primary/10 to-primary/5 flex-shrink-0">
                      {item.image ? (
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <ImageIcon className="w-10 h-10 text-muted-foreground/30" />
                        </div>
                      )}
                    </div>

                    {/* Item Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-semibold truncate">{item.name}</h3>
                        {item.stock < 10 && (
                          <Badge variant="warning" className="text-xs">
                            {item.stock} left
                          </Badge>
                        )}
                      </div>
                      {item.description && (
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                          {item.description}
                        </p>
                      )}
                      <div className="flex items-center justify-between mt-2">
                        <div className="flex items-center gap-1 font-bold text-lg text-primary">
                          <IndianRupee className="w-4 h-4" />
                          {item.price}
                        </div>
                        {item.category && (
                          <Badge variant="secondary" className="text-xs">
                            {item.category}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Cart */}
        <div>
          <Card className="sticky top-4">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShoppingCart className="w-5 h-5" />
                Cart ({cart.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {cart.length > 0 ? (
                <>
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {cart.map((item) => (
                      <div
                        key={item.menuItem.id}
                        className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl"
                      >
                        <div className="w-16 h-16 rounded-lg overflow-hidden bg-white flex-shrink-0">
                          {item.menuItem.image ? (
                            <img
                              src={item.menuItem.image}
                              alt={item.menuItem.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <ImageIcon className="w-6 h-6 text-muted-foreground/30" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm truncate">{item.menuItem.name}</p>
                          <div className="flex items-center gap-1 text-sm text-primary font-semibold">
                            <IndianRupee className="w-3 h-3" />
                            {item.menuItem.price}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            size="icon"
                            variant="outline"
                            className="h-8 w-8"
                            onClick={() => updateQuantity(item.menuItem.id, -1)}
                          >
                            <Minus className="w-3 h-3" />
                          </Button>
                          <span className="w-8 text-center font-semibold">{item.quantity}</span>
                          <Button
                            size="icon"
                            variant="outline"
                            className="h-8 w-8"
                            onClick={() => updateQuantity(item.menuItem.id, 1)}
                          >
                            <Plus className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="pt-4 border-t space-y-3">
                    <div className="flex items-center justify-between text-lg font-bold">
                      <span>Total</span>
                      <div className="flex items-center gap-1 text-primary">
                        <IndianRupee className="w-5 h-5" />
                        {totalAmount}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Button
                        className="w-full gap-2"
                        onClick={() => handleCreateOrder("cash")}
                      >
                        <Banknote className="w-5 h-5" />
                        Cash Payment
                      </Button>
                      <Button
                        variant="outline"
                        className="w-full gap-2"
                        onClick={() => handleCreateOrder("upi")}
                      >
                        <CreditCard className="w-5 h-5" />
                        UPI Payment
                      </Button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  Cart is empty
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* UPI Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <Card className="w-full max-w-md animate-scale-in">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>UPI Payment</CardTitle>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowPaymentModal(false)}
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-2">UPI Transaction ID</label>
                <Input
                  placeholder="Enter UPI transaction ID"
                  value={upiId}
                  onChange={(e) => setUpiId(e.target.value)}
                />
              </div>
              <Button className="w-full" onClick={handleConfirmPayment}>
                Confirm Payment
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
