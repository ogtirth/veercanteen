"use client";

import { useEffect, useState } from "react";
import { getMenuItems, createWalkInOrder, confirmWalkInPayment, getSettings } from "@/lib/admin-actions";
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
  Banknote,
  QrCode,
  Package,
  X,
  Store,
  Infinity,
  Zap,
  Hash,
  Smartphone,
  Wallet,
  CheckCircle2,
  AlertCircle
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
  const [upiId, setUpiId] = useState<string>("");
  const [orderCount, setOrderCount] = useState(0);

  const categories = ["all", "Snacks", "Beverages", "Meals", "Desserts", "Breakfast"];

  useEffect(() => {
    loadItems();
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const result = await getSettings();
      if (result.success && result.data) {
        setUpiId(result.data.upiId || "");
      }
    } catch (error) {
      console.error("Failed to load settings");
    }
  };

  const loadItems = async () => {
    try {
      const result = await getMenuItems();
      if (result.success) {
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

  const clearCart = () => {
    setCart([]);
    sounds.removeFromCart();
  };

  const cartTotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const handleCheckout = async (method: "cash" | "upi") => {
    if (cart.length === 0) {
      toast.error("Cart is empty");
      return;
    }

    if (method === "upi" && !upiId) {
      toast.error("UPI ID not configured. Please set it in Settings.");
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
        if (method === "upi" && result.data.qrCode) {
          setQrCode(result.data.qrCode);
        }
        setShowPayment(true);
        sounds.orderPlaced();
      } else {
        toast.error(result.error || "Failed to create order");
        sounds.error();
      }
    } catch (error) {
      toast.error("Something went wrong");
      sounds.error();
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
        toast.success("Payment confirmed!");
        setCart([]);
        setShowPayment(false);
        setOrderData(null);
        setQrCode("");
        setOrderCount(prev => prev + 1);
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
    <div className="space-y-4 pb-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center shadow-lg">
            <Store className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Counter POS</h1>
            <p className="text-muted-foreground text-sm flex items-center gap-2">
              <span className="flex items-center gap-1">
                <Zap className="w-3 h-3 text-yellow-500" />
                Quick billing
              </span>
              {orderCount > 0 && (
                <Badge variant="secondary" className="text-xs">
                  {orderCount} orders today
                </Badge>
              )}
            </p>
          </div>
        </div>
        
        {!upiId && (
          <Badge variant="destructive" className="gap-1">
            <AlertCircle className="w-3 h-3" />
            UPI not configured
          </Badge>
        )}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        {/* Menu Section - 2 columns */}
        <div className="xl:col-span-2 space-y-4">
          {/* Search & Categories */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search items..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-10"
              />
            </div>
            <div className="flex gap-1.5 overflow-x-auto scrollbar-hide">
              {categories.map((cat) => (
                <Button
                  key={cat}
                  variant={selectedCategory === cat ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setSelectedCategory(cat)}
                  className={`whitespace-nowrap h-10 px-4 ${
                    selectedCategory === cat 
                      ? "bg-primary shadow-md" 
                      : "hover:bg-secondary"
                  }`}
                >
                  {cat === "all" ? "All Items" : cat}
                </Button>
              ))}
            </div>
          </div>

          {/* Menu Items Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {filteredItems.map((item) => {
              const inCart = cart.find(c => c.id === item.id);
              return (
                <div
                  key={item.id}
                  onClick={() => addToCart(item)}
                  className={`relative bg-card rounded-xl border-2 cursor-pointer transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 active:scale-95 overflow-hidden ${
                    inCart ? "border-primary shadow-md" : "border-transparent hover:border-primary/30"
                  }`}
                >
                  {/* Image */}
                  <div className="relative h-24 bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-950/30 dark:to-amber-950/30">
                    {item.image ? (
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Package className="w-8 h-8 text-muted-foreground/20" />
                      </div>
                    )}
                    
                    {/* Stock Badge */}
                    {item.unlimitedStock ? (
                      <Badge className="absolute top-1.5 right-1.5 bg-emerald-500 text-[10px] px-1.5 py-0">
                        <Infinity className="w-3 h-3" />
                      </Badge>
                    ) : item.stock < 10 && (
                      <Badge variant="destructive" className="absolute top-1.5 right-1.5 text-[10px] px-1.5 py-0">
                        {item.stock} left
                      </Badge>
                    )}

                    {/* In Cart Indicator */}
                    {inCart && (
                      <div className="absolute top-1.5 left-1.5 w-6 h-6 rounded-full bg-primary text-white text-xs font-bold flex items-center justify-center shadow-lg">
                        {inCart.quantity}
                      </div>
                    )}
                  </div>

                  {/* Details */}
                  <div className="p-2.5">
                    <h3 className="font-semibold text-sm line-clamp-1">{item.name}</h3>
                    <div className="flex items-center justify-between mt-1">
                      <span className="font-bold text-primary text-lg">₹{item.price}</span>
                      <Button size="sm" variant="ghost" className="h-7 w-7 p-0 hover:bg-primary hover:text-white">
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {filteredItems.length === 0 && (
            <div className="text-center py-16 bg-secondary/30 rounded-2xl">
              <Package className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-muted-foreground">No items found</p>
            </div>
          )}
        </div>

        {/* Cart Section */}
        <div className="xl:col-span-1">
          <Card className="sticky top-4 border-2 shadow-xl overflow-hidden">
            {/* Cart Header */}
            <CardHeader className="bg-gradient-to-r from-primary to-primary/80 text-white py-4">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-white">
                  <ShoppingCart className="w-5 h-5" />
                  Current Order
                </CardTitle>
                {cart.length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearCart}
                    className="text-white/80 hover:text-white hover:bg-white/20 h-8 px-2"
                  >
                    <Trash2 className="w-4 h-4 mr-1" />
                    Clear
                  </Button>
                )}
              </div>
              {cart.length > 0 && (
                <div className="flex items-center gap-2 mt-2">
                  <Badge className="bg-white/20 text-white border-0">
                    {cartCount} items
                  </Badge>
                </div>
              )}
            </CardHeader>

            <CardContent className="p-4">
              {cart.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-20 h-20 rounded-full bg-secondary/50 flex items-center justify-center mx-auto mb-4">
                    <ShoppingCart className="w-10 h-10 text-muted-foreground/30" />
                  </div>
                  <p className="text-muted-foreground font-medium">Cart is empty</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Tap items to add them here
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Cart Items */}
                  <div className="space-y-2 max-h-[35vh] overflow-y-auto pr-1">
                    {cart.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center gap-3 p-2 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors"
                      >
                        {/* Image */}
                        <div className="w-12 h-12 rounded-lg overflow-hidden bg-card flex-shrink-0 shadow-sm">
                          {item.image ? (
                            <img
                              src={item.image}
                              alt={item.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-950/30 dark:to-amber-950/30">
                              <Package className="w-5 h-5 text-muted-foreground/30" />
                            </div>
                          )}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-sm line-clamp-1">{item.name}</h4>
                          <p className="text-sm text-primary font-bold">
                            ₹{item.price * item.quantity}
                          </p>
                        </div>
                        
                        {/* Quantity Controls */}
                        <div className="flex items-center gap-1 bg-background rounded-lg p-1 shadow-sm">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 hover:bg-destructive/10 hover:text-destructive"
                            onClick={(e) => {
                              e.stopPropagation();
                              updateQuantity(item.id, -1);
                            }}
                          >
                            <Minus className="w-3 h-3" />
                          </Button>
                          <span className="w-6 text-center font-bold text-sm">{item.quantity}</span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 hover:bg-primary/10 hover:text-primary"
                            onClick={(e) => {
                              e.stopPropagation();
                              updateQuantity(item.id, 1);
                            }}
                          >
                            <Plus className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Divider */}
                  <div className="border-t border-dashed" />

                  {/* Total */}
                  <div className="bg-gradient-to-r from-primary/5 to-primary/10 rounded-xl p-4">
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Total Amount</span>
                      <span className="text-3xl font-bold text-primary flex items-center">
                        <IndianRupee className="w-6 h-6" />
                        {cartTotal}
                      </span>
                    </div>
                  </div>

                  {/* Payment Buttons */}
                  <div className="grid grid-cols-2 gap-3">
                    <Button
                      onClick={() => handleCheckout("cash")}
                      disabled={processing || cart.length === 0}
                      variant="outline"
                      className="h-14 flex-col gap-1 border-2 hover:border-green-500 hover:bg-green-50 dark:hover:bg-green-950/30"
                    >
                      <Banknote className="w-5 h-5 text-green-600" />
                      <span className="text-xs font-semibold">Cash</span>
                    </Button>
                    <Button
                      onClick={() => handleCheckout("upi")}
                      disabled={processing || cart.length === 0}
                      className="h-14 flex-col gap-1 bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700"
                    >
                      <QrCode className="w-5 h-5" />
                      <span className="text-xs font-semibold">UPI</span>
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Payment Modal */}
      {showPayment && orderData && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <Card className="max-w-md w-full shadow-2xl border-0 overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className={`p-6 text-center text-white ${
              paymentMethod === "cash" 
                ? "bg-gradient-to-br from-green-500 to-emerald-600" 
                : "bg-gradient-to-br from-violet-500 to-purple-600"
            }`}>
              <div className="w-20 h-20 rounded-full bg-white/20 backdrop-blur flex items-center justify-center mx-auto mb-4">
                {paymentMethod === "cash" ? (
                  <Wallet className="w-10 h-10" />
                ) : (
                  <Smartphone className="w-10 h-10" />
                )}
              </div>
              <h2 className="text-2xl font-bold">
                {paymentMethod === "cash" ? "Cash Payment" : "UPI Payment"}
              </h2>
              <div className="flex items-center justify-center gap-2 mt-2 text-white/80">
                <Hash className="w-4 h-4" />
                <span className="font-mono text-lg tracking-wider">{orderData.invoiceNumber}</span>
              </div>
            </div>

            <CardContent className="p-6 space-y-6">
              {/* Amount Display */}
              <div className="text-center py-4 bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-950/30 dark:to-amber-950/30 rounded-2xl">
                <p className="text-sm text-muted-foreground mb-1">Amount to Collect</p>
                <p className="text-5xl font-bold text-primary flex items-center justify-center">
                  <IndianRupee className="w-10 h-10" />
                  {orderData.totalAmount}
                </p>
              </div>

              {/* QR Code for UPI */}
              {paymentMethod === "upi" && (
                <div className="space-y-3">
                  {qrCode ? (
                    <div className="bg-white dark:bg-white p-4 rounded-2xl shadow-inner border-2 border-dashed border-violet-200">
                      <img 
                        src={qrCode} 
                        alt="UPI QR Code" 
                        className="w-48 h-48 mx-auto"
                      />
                    </div>
                  ) : (
                    <div className="bg-secondary/50 p-8 rounded-2xl text-center">
                      <AlertCircle className="w-12 h-12 text-muted-foreground/50 mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">QR Code not available</p>
                    </div>
                  )}
                  {orderData.upiId && (
                    <p className="text-center text-sm text-muted-foreground">
                      UPI ID: <span className="font-mono font-medium text-foreground">{orderData.upiId}</span>
                    </p>
                  )}
                </div>
              )}

              {/* Order Items Summary */}
              <div className="bg-secondary/30 rounded-xl p-3">
                <p className="text-xs text-muted-foreground mb-2 font-medium">Order Summary</p>
                <div className="space-y-1 max-h-24 overflow-y-auto">
                  {orderData.items?.map((item: any) => (
                    <div key={item.id} className="flex justify-between text-sm">
                      <span className="text-muted-foreground">
                        {item.quantity}x {item.name}
                      </span>
                      <span className="font-medium">₹{item.priceAtTime * item.quantity}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-3">
                <Button
                  variant="outline"
                  onClick={cancelOrder}
                  disabled={processing}
                  className="h-12 border-2"
                >
                  <X className="w-4 h-4 mr-2" />
                  Cancel
                </Button>
                <Button
                  onClick={handleConfirmPayment}
                  disabled={processing}
                  className={`h-12 ${
                    paymentMethod === "cash"
                      ? "bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
                      : "bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700"
                  }`}
                >
                  {processing ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4 mr-2" />
                      Confirm Payment
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
