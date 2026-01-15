"use client";

import { useEffect, useState } from "react";
import { getMenuItems, createWalkInOrder, confirmWalkInPayment } from "@/lib/admin-actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useSounds } from "@/lib/sounds";
import {
  Search,
  Plus,
  Minus,
  Trash2,
  ShoppingCart,
  IndianRupee,
  CreditCard,
  Banknote,
  QrCode,
  ImageIcon,
  Package,
  X,
  Check,
  Store,
  Infinity
} from "lucide-react";

interface MenuItem {
  id: string;
  name: string;
  price: number;
  description?: string | null;
  category?: string | null;
  stock: number;
  unlimitedStock?: boolean;
  isAvailable: boolean;
  image?: string | null;
}

interface CartItem extends MenuItem {
  quantity: number;
}

export default function CounterPage() {
  const sounds = useSounds();
  const [items, setItems] = useState<MenuItem[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "upi">("cash");
  const [orderData, setOrderData] = useState<any>(null);
  const [qrCode, setQrCode] = useState<string>("");

  const categories = ["all", "Snacks", "Beverages", "Meals", "Desserts", "Breakfast"];

  useEffect(() => {
    loadItems();
  }, []);

  const loadItems = async () => {
    try {
      const result = await getMenuItems();
      if (result.success) {
        // Show items that are available and have stock OR have unlimited stock
        setItems(result.data.filter((item: MenuItem) => 
          item.isAvailable && (item.stock > 0 || item.unlimitedStock)
        ));
      }
    } catch (error) {
      toast.error("Failed to load menu items");
    } finally {
      setLoading(false);
    }
  };

  const filteredItems = items.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "all" || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const addToCart = (item: MenuItem) => {
    const existing = cart.find((c) => c.id === item.id);
    if (existing) {
      if (!item.unlimitedStock && existing.quantity >= item.stock) {
        toast.error("Not enough stock");
        sounds.error();
        return;
      }
      setCart(
        cart.map((c) =>
          c.id === item.id ? { ...c, quantity: c.quantity + 1 } : c
        )
      );
    } else {
      setCart([...cart, { ...item, quantity: 1 }]);
    }
    sounds.addToCart();
    toast.success(`${item.name} added to cart`);
  };

  const updateQuantity = (id: string, delta: number) => {
    const item = cart.find((c) => c.id === id);
    if (!item) return;

    const newQty = item.quantity + delta;
    if (newQty <= 0) {
      setCart(cart.filter((c) => c.id !== id));
      sounds.removeFromCart();
    } else if (item.unlimitedStock || newQty <= item.stock) {
      setCart(
        cart.map((c) => (c.id === id ? { ...c, quantity: newQty } : c))
      );
      sounds.updateQuantity();
    } else {
      toast.error("Not enough stock");
      sounds.error();
    }
  };

  const removeFromCart = (id: string) => {
    setCart(cart.filter((c) => c.id !== id));
    sounds.removeFromCart();
  };

  const cartTotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const handleCheckout = async (method: "cash" | "upi") => {
    if (cart.length === 0) {
      toast.error("Cart is empty");
      return;
    }

    setProcessing(true);
    setPaymentMethod(method);

    try {
      const cartItems = cart.map((item) => ({
        menuItemId: item.id,
        quantity: item.quantity,
      }));

      const result = await createWalkInOrder(cartItems);

      if (result.success && result.data) {
        setOrderData(result.data);
        if (method === "upi" && (result.data as any).qrCode) {
          setQrCode((result.data as any).qrCode);
        }
        setShowPayment(true);
      } else {
        toast.error(result.error || "Failed to create order");
      }
    } catch (error) {
      toast.error("Something went wrong");
    } finally {
      setProcessing(false);
    }
  };

  const handleConfirmPayment = async () => {
    if (!orderData) return;

    setProcessing(true);
    try {
      const result = await confirmWalkInPayment(orderData.id, paymentMethod);
      if (result.success) {
        sounds.paymentSuccess();
        toast.success("Payment confirmed! Order completed.");
        setCart([]);
        setShowPayment(false);
        setOrderData(null);
        setQrCode("");
        loadItems();
      } else {
        toast.error(result.error || "Failed to confirm payment");
        sounds.error();
      }
    } catch (error) {
      toast.error("Something went wrong");
      sounds.error();
    } finally {
      setProcessing(false);
    }
  };

  const cancelOrder = () => {
    setShowPayment(false);
    setOrderData(null);
    setQrCode("");
    toast.info("Order cancelled");
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between animate-slide-up">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <Store className="w-8 h-8 text-primary" />
            Counter POS
          </h1>
          <p className="text-muted-foreground mt-1">
            Create walk-in orders for customers
          </p>
        </div>
        {cartCount > 0 && (
          <Badge variant="default" className="text-lg px-4 py-2 gap-2 animate-scale-in">
            <ShoppingCart className="w-5 h-5" />
            {cartCount} items • ₹{cartTotal}
          </Badge>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Menu Section */}
        <div className="lg:col-span-2 space-y-6">
          {/* Search & Filters */}
          <Card className="animate-slide-up" style={{ animationDelay: "100ms" }}>
            <CardContent className="p-4">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    placeholder="Search items..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <div className="flex gap-2 overflow-x-auto pb-2 sm:pb-0">
                  {categories.map((cat) => (
                    <Button
                      key={cat}
                      variant={selectedCategory === cat ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSelectedCategory(cat)}
                      className="whitespace-nowrap"
                    >
                      {cat === "all" ? "All" : cat}
                    </Button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Menu Items Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {filteredItems.map((item, index) => (
              <Card
                key={item.id}
                className="overflow-hidden cursor-pointer hover:shadow-card hover:-translate-y-1 transition-all duration-200 animate-scale-in"
                style={{ animationDelay: `${index * 50}ms` }}
                onClick={() => addToCart(item)}
              >
                {/* Image */}
                <div className="relative h-28 bg-gradient-to-br from-primary/10 to-primary/5">
                  {item.image ? (
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <ImageIcon className="w-10 h-10 text-muted-foreground/30" />
                    </div>
                  )}
                  {item.stock < 10 && (
                    <Badge variant="warning" className="absolute top-2 left-2 text-[10px]">
                      Low
                    </Badge>
                  )}
                </div>
                <CardContent className="p-3">
                  <h3 className="font-semibold text-sm line-clamp-1">{item.name}</h3>
                  <div className="flex items-center justify-between mt-2">
                    <span className="font-bold text-primary">₹{item.price}</span>
                    <Badge variant="secondary" className="text-[10px]">
                      {item.stock} left
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredItems.length === 0 && (
            <div className="text-center py-12">
              <Package className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
              <p className="text-muted-foreground">No items found</p>
            </div>
          )}
        </div>

        {/* Cart Section */}
        <div className="space-y-6">
          <Card className="sticky top-6 animate-slide-up" style={{ animationDelay: "200ms" }}>
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2">
                <ShoppingCart className="w-5 h-5" />
                Current Order
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {cart.length === 0 ? (
                <div className="text-center py-8">
                  <ShoppingCart className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
                  <p className="text-muted-foreground">Cart is empty</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Click on items to add them
                  </p>
                </div>
              ) : (
                <>
                  {/* Cart Items */}
                  <div className="space-y-3 max-h-[40vh] overflow-y-auto">
                    {cart.map((item, index) => (
                      <div
                        key={item.id}
                        className="flex items-center gap-3 p-3 rounded-xl bg-secondary/50 animate-fade-in"
                        style={{ animationDelay: `${index * 50}ms` }}
                      >
                        {/* Image */}
                        <div className="w-14 h-14 rounded-lg overflow-hidden bg-white flex-shrink-0">
                          {item.image ? (
                            <img
                              src={item.image}
                              alt={item.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-primary/10">
                              <ImageIcon className="w-6 h-6 text-muted-foreground/30" />
                            </div>
                          )}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-sm line-clamp-1">{item.name}</h4>
                          <p className="text-sm text-primary font-semibold">
                            ₹{item.price * item.quantity}
                          </p>
                        </div>
                        
                        <div className="flex items-center gap-1">
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8"
                            onClick={(e) => {
                              e.stopPropagation();
                              updateQuantity(item.id, -1);
                            }}
                          >
                            <Minus className="w-3 h-3" />
                          </Button>
                          <span className="w-8 text-center font-semibold">{item.quantity}</span>
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8"
                            onClick={(e) => {
                              e.stopPropagation();
                              updateQuantity(item.id, 1);
                            }}
                          >
                            <Plus className="w-3 h-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive"
                            onClick={(e) => {
                              e.stopPropagation();
                              removeFromCart(item.id);
                            }}
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Total */}
                  <div className="border-t pt-4">
                    <div className="flex justify-between items-center text-lg font-bold">
                      <span>Total</span>
                      <span className="text-primary flex items-center gap-1">
                        <IndianRupee className="w-5 h-5" />
                        {cartTotal}
                      </span>
                    </div>
                  </div>

                  {/* Payment Buttons */}
                  <div className="grid grid-cols-2 gap-3">
                    <Button
                      onClick={() => handleCheckout("cash")}
                      disabled={processing || cart.length === 0}
                      className="gap-2"
                      variant="outline"
                    >
                      <Banknote className="w-4 h-4" />
                      Cash
                    </Button>
                    <Button
                      onClick={() => handleCheckout("upi")}
                      disabled={processing || cart.length === 0}
                      className="gap-2"
                    >
                      <QrCode className="w-4 h-4" />
                      UPI
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Payment Modal */}
      {showPayment && orderData && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <Card className="max-w-md w-full animate-scale-in">
            <CardHeader className="text-center pb-2">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                {paymentMethod === "cash" ? (
                  <Banknote className="w-8 h-8 text-primary" />
                ) : (
                  <QrCode className="w-8 h-8 text-primary" />
                )}
              </div>
              <CardTitle className="text-2xl">
                {paymentMethod === "cash" ? "Cash Payment" : "UPI Payment"}
              </CardTitle>
              <p className="text-muted-foreground">
                Order #{orderData.invoiceNumber}
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="text-center">
                <p className="text-muted-foreground">Amount to collect</p>
                <p className="text-4xl font-bold text-primary flex items-center justify-center gap-2 mt-2">
                  <IndianRupee className="w-8 h-8" />
                  {orderData.total}
                </p>
              </div>

              {paymentMethod === "upi" && qrCode && (
                <div className="flex justify-center p-4 bg-white rounded-xl">
                  <img src={qrCode} alt="UPI QR Code" className="w-48 h-48" />
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <Button
                  variant="outline"
                  onClick={cancelOrder}
                  disabled={processing}
                  className="gap-2"
                >
                  <X className="w-4 h-4" />
                  Cancel
                </Button>
                <Button
                  onClick={handleConfirmPayment}
                  disabled={processing}
                  className="gap-2"
                >
                  {processing ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Check className="w-4 h-4" />
                  )}
                  Confirm
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
