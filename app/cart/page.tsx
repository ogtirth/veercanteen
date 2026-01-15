"use client";

import { useEffect, useState } from "react";
import Header from "@/components/Header";
import Link from "next/link";
import { useCartStore } from "@/lib/cart-store";
import { useSounds } from "@/lib/sounds";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  X,
  Plus,
  Minus,
  ShoppingCart,
  ArrowRight,
  UtensilsCrossed,
  Trash2,
  IndianRupee,
  Package
} from "lucide-react";

export default function CartPage() {
  const sounds = useSounds();
  const [mounted, setMounted] = useState(false);
  const items = useCartStore((state) => state.items);
  const removeItem = useCartStore((state) => state.removeItem);
  const updateQuantity = useCartStore((state) => state.updateQuantity);
  const clearCart = useCartStore((state) => state.clear);
  const getTotal = useCartStore((state) => state.getTotal);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <>
        <Header />
        <main className="container py-8" />
      </>
    );
  }

  const total = getTotal();

  if (items.length === 0) {
    return (
      <>
        <Header />
        <main className="min-h-[calc(100vh-80px)] flex items-center justify-center p-4">
          <div className="text-center animate-scale-in">
            <div className="w-24 h-24 mx-auto mb-6 bg-secondary rounded-full flex items-center justify-center">
              <ShoppingCart className="w-12 h-12 text-muted-foreground/50" />
            </div>
            <h1 className="text-2xl font-bold mb-2">Your cart is empty</h1>
            <p className="text-muted-foreground mb-8 max-w-sm">
              Looks like you haven't added any delicious items yet
            </p>
            <Button asChild size="lg" className="gap-2">
              <Link href="/menu">
                Browse Menu
                <ArrowRight className="w-5 h-5" />
              </Link>
            </Button>
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
        <div className="flex items-center justify-between mb-8 animate-slide-up">
          <div>
            <h1 className="text-3xl font-bold">Shopping Cart</h1>
            <p className="text-muted-foreground mt-1">
              {items.length} {items.length === 1 ? "item" : "items"} in your cart
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              clearCart();
              sounds.removeFromCart();
            }}
            className="gap-2 text-destructive hover:text-destructive"
          >
            <Trash2 className="w-4 h-4" />
            Clear Cart
          </Button>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            {items.map((item, index) => (
              <Card
                key={item.itemId}
                className="overflow-hidden hover:shadow-card transition-all duration-200 animate-slide-up"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <CardContent className="p-4">
                  <div className="flex gap-4">
                    {/* Product Image */}
                    <div className="w-24 h-24 rounded-xl bg-secondary overflow-hidden flex-shrink-0">
                      {item.image ? (
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <UtensilsCrossed className="w-8 h-8 text-muted-foreground/30" />
                        </div>
                      )}
                    </div>

                    {/* Product Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h3 className="font-semibold text-lg truncate">{item.name}</h3>
                          <p className="text-primary font-bold text-lg mt-1">
                            ₹{item.price}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            removeItem(item.itemId);
                            sounds.removeFromCart();
                          }}
                          className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 -mt-1 -mr-2"
                        >
                          <X className="w-5 h-5" />
                        </Button>
                      </div>

                      <div className="flex items-center justify-between mt-3">
                        {/* Quantity Controls */}
                        <div className="flex items-center gap-1 border rounded-xl p-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => {
                              updateQuantity(item.itemId, item.quantity - 1);
                              sounds.updateQuantity();
                            }}
                          >
                            <Minus className="w-4 h-4" />
                          </Button>
                          <span className="w-10 text-center font-semibold">
                            {item.quantity}
                          </span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => {
                              updateQuantity(item.itemId, item.quantity + 1);
                              sounds.updateQuantity();
                            }}
                          >
                            <Plus className="w-4 h-4" />
                          </Button>
                        </div>

                        {/* Item Subtotal */}
                        <div className="text-right">
                          <p className="text-xs text-muted-foreground">Subtotal</p>
                          <p className="font-bold text-lg">
                            ₹{(item.price * item.quantity).toFixed(0)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <Card className="sticky top-24 border-0 shadow-card animate-slide-up" style={{ animationDelay: "200ms" }}>
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2">
                  <Package className="w-5 h-5 text-primary" />
                  Order Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Items Breakdown */}
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {items.map((item) => (
                    <div key={item.itemId} className="flex justify-between text-sm">
                      <span className="text-muted-foreground truncate max-w-[60%]">
                        {item.name} × {item.quantity}
                      </span>
                      <span>₹{item.price * item.quantity}</span>
                    </div>
                  ))}
                </div>

                <div className="border-t pt-4 space-y-3">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span>₹{total.toFixed(0)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Delivery</span>
                    <Badge variant="success" className="text-xs">Free</Badge>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-lg">Total</span>
                    <span className="text-2xl font-bold text-primary flex items-center">
                      <IndianRupee className="w-5 h-5" />
                      {total.toFixed(0)}
                    </span>
                  </div>
                </div>

                <div className="space-y-3 pt-2">
                  <Button asChild className="w-full h-12 text-base font-semibold gap-2">
                    <Link href="/checkout">
                      Proceed to Checkout
                      <ArrowRight className="w-5 h-5" />
                    </Link>
                  </Button>
                  <Button asChild variant="outline" className="w-full">
                    <Link href="/menu">
                      Continue Shopping
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </>
  );
}
