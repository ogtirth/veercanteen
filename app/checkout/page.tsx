"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import { useCartStore } from "@/lib/cart-store";
import { useSounds } from "@/lib/sounds";
import { validateAndCreateOrder, confirmPayment } from "@/lib/actions";
import { toast } from "sonner";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Copy,
  Check,
  QrCode,
  IndianRupee,
  ArrowRight,
  Package,
  CreditCard,
  ShoppingBag,
  CheckCircle,
  Loader2,
  Smartphone,
  UtensilsCrossed
} from "lucide-react";

interface CheckoutState {
  stage: "cart" | "payment" | "success";
  orderId?: string;
  invoiceNumber?: string;
  qrCodeDataUrl?: string;
  upiId?: string;
  amount?: number;
}

export default function CheckoutPage() {
  const sounds = useSounds();
  const [state, setState] = useState<CheckoutState>({ stage: "cart" });
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const router = useRouter();
  const items = useCartStore((state) => state.items);
  const clearCart = useCartStore((state) => state.clear);
  const getTotal = useCartStore((state) => state.getTotal);

  useEffect(() => {
    if (items.length === 0 && state.stage === "cart") {
      router.push("/cart");
    }
  }, [items, router, state.stage]);

  const handleCreateOrder = async () => {
    setLoading(true);
    try {
      const cartData = items.map((item) => ({
        itemId: item.itemId,
        quantity: item.quantity,
      }));

      const result = await validateAndCreateOrder(cartData);

      if (result.success) {
        sounds.orderPlaced();
        setState({
          stage: "payment",
          orderId: result.orderId,
          invoiceNumber: result.invoiceNumber,
          qrCodeDataUrl: result.qrCodeDataUrl,
          upiId: result.upiId,
          amount: result.amount,
        });
      } else {
        sounds.error();
        toast.error(result.error || "Failed to create order");
      }
    } catch (error) {
      sounds.error();
      toast.error("An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmPayment = async () => {
    if (!state.orderId) return;

    setLoading(true);
    try {
      const result = await confirmPayment(state.orderId);

      if (result.success) {
        sounds.paymentSuccess();
        toast.success("Payment confirmed!");
        setState({ stage: "success", orderId: state.orderId, invoiceNumber: state.invoiceNumber });
        clearCart();
        setTimeout(() => {
          router.push("/my-orders");
        }, 2000);
      } else {
        sounds.error();
        toast.error(result.error || "Failed to confirm payment");
      }
    } catch (error) {
      sounds.error();
      toast.error("An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    sounds.click();
    toast.success("UPI ID copied!");
    setTimeout(() => setCopied(false), 2000);
  };

  // Success State
  if (state.stage === "success") {
    return (
      <>
        <Header />
        <main className="min-h-[calc(100vh-80px)] flex items-center justify-center p-4">
          <div className="max-w-md text-center animate-scale-in">
            <div className="w-24 h-24 mx-auto mb-6 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle className="w-12 h-12 text-green-600" />
            </div>
            <h1 className="text-3xl font-bold mb-2">Order Confirmed!</h1>
            <p className="text-muted-foreground mb-6">
              Your order has been successfully placed.
            </p>
            <Card className="mb-8 border-green-200 bg-green-50">
              <CardContent className="p-4">
                <p className="text-sm text-muted-foreground mb-1">Invoice Number</p>
                <p className="text-2xl font-bold text-green-700">
                  {state.invoiceNumber}
                </p>
              </CardContent>
            </Card>
            <p className="text-muted-foreground mb-6 flex items-center justify-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              Redirecting to your orders...
            </p>
            <Button asChild size="lg" className="gap-2">
              <Link href="/my-orders">
                View My Orders
                <ArrowRight className="w-5 h-5" />
              </Link>
            </Button>
          </div>
        </main>
      </>
    );
  }

  // Payment State
  if (state.stage === "payment") {
    return (
      <>
        <Header />
        <main className="container max-w-4xl py-8 pb-16">
          <div className="mb-8 animate-slide-up">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <CreditCard className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">Complete Payment</h1>
                <p className="text-muted-foreground">
                  Invoice #{state.invoiceNumber}
                </p>
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* QR Code Card */}
            <Card className="animate-slide-up" style={{ animationDelay: "100ms" }}>
              <CardHeader className="text-center pb-2">
                <CardTitle className="flex items-center justify-center gap-2">
                  <QrCode className="w-5 h-5" />
                  Scan QR Code
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col items-center">
                {state.qrCodeDataUrl && (
                  <div className="p-4 bg-white rounded-2xl shadow-sm border mb-4">
                    <img
                      src={state.qrCodeDataUrl}
                      alt="UPI QR Code"
                      className="w-64 h-64"
                    />
                  </div>
                )}
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Smartphone className="w-4 h-4" />
                  Scan with GPay, PhonePe, or any UPI app
                </div>
              </CardContent>
            </Card>

            {/* Payment Details Card */}
            <div className="space-y-6">
              <Card className="animate-slide-up" style={{ animationDelay: "150ms" }}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Payment Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center p-3 bg-secondary/50 rounded-xl">
                    <span className="text-muted-foreground">Amount</span>
                    <span className="text-2xl font-bold text-primary flex items-center">
                      <IndianRupee className="w-5 h-5" />
                      {state.amount?.toFixed(0)}
                    </span>
                  </div>

                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Or copy UPI ID manually:</p>
                    <div className="flex gap-2">
                      <Input
                        value={state.upiId || ""}
                        readOnly
                        className="font-mono"
                      />
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => copyToClipboard(state.upiId || "")}
                      >
                        {copied ? (
                          <Check className="w-5 h-5 text-green-600" />
                        ) : (
                          <Copy className="w-5 h-5" />
                        )}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-blue-200 bg-blue-50 animate-slide-up" style={{ animationDelay: "200ms" }}>
                <CardContent className="p-4 flex items-start gap-3">
                  <Smartphone className="w-5 h-5 text-blue-600 mt-0.5" />
                  <p className="text-sm text-blue-900">
                    Open your UPI app, scan the QR code, and complete the payment. 
                    Then click "I Have Paid" below.
                  </p>
                </CardContent>
              </Card>

              <div className="space-y-3 animate-slide-up" style={{ animationDelay: "250ms" }}>
                <Button
                  onClick={handleConfirmPayment}
                  disabled={loading}
                  className="w-full h-12 text-base font-semibold gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-5 h-5" />
                      I Have Paid
                    </>
                  )}
                </Button>
                <Button asChild variant="outline" className="w-full">
                  <Link href="/menu">Continue Shopping</Link>
                </Button>
              </div>
            </div>
          </div>

          {/* Order Summary */}
          <Card className="mt-8 animate-slide-up" style={{ animationDelay: "300ms" }}>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-lg">
                <ShoppingBag className="w-5 h-5" />
                Order Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {items.map((item) => (
                  <div key={item.itemId} className="flex items-center justify-between p-3 bg-secondary/50 rounded-xl">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center">
                        {item.image ? (
                          <img src={item.image} alt={item.name} className="w-full h-full object-cover rounded-lg" />
                        ) : (
                          <UtensilsCrossed className="w-5 h-5 text-muted-foreground" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium">{item.name}</p>
                        <p className="text-sm text-muted-foreground">× {item.quantity}</p>
                      </div>
                    </div>
                    <p className="font-semibold">₹{(item.price * item.quantity).toFixed(0)}</p>
                  </div>
                ))}
                <div className="flex justify-between items-center pt-3 border-t">
                  <span className="font-semibold">Total</span>
                  <span className="text-xl font-bold text-primary">₹{state.amount?.toFixed(0)}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </main>
      </>
    );
  }

  // Cart Review State
  return (
    <>
      <Header />
      <main className="container max-w-4xl py-8 pb-16">
        <div className="mb-8 animate-slide-up">
          <h1 className="text-3xl font-bold">Review Order</h1>
          <p className="text-muted-foreground mt-1">
            Verify your items before proceeding to payment
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Order Items */}
          <div className="lg:col-span-2">
            <Card className="animate-slide-up" style={{ animationDelay: "100ms" }}>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Package className="w-5 h-5" />
                  Order Items ({items.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {items.map((item, index) => (
                  <div
                    key={item.itemId}
                    className="flex items-center justify-between p-3 bg-secondary/50 rounded-xl animate-slide-up"
                    style={{ animationDelay: `${150 + index * 50}ms` }}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-lg bg-white flex items-center justify-center overflow-hidden">
                        {item.image ? (
                          <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                        ) : (
                          <UtensilsCrossed className="w-6 h-6 text-muted-foreground" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium">{item.name}</p>
                        <p className="text-sm text-muted-foreground">
                          ₹{item.price} × {item.quantity}
                        </p>
                      </div>
                    </div>
                    <p className="font-bold text-lg">₹{(item.price * item.quantity).toFixed(0)}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Order Summary Sidebar */}
          <div className="lg:col-span-1">
            <Card className="sticky top-24 border-0 shadow-card animate-slide-up" style={{ animationDelay: "200ms" }}>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span>₹{getTotal().toFixed(0)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Delivery</span>
                    <Badge variant="success" className="text-xs">Free</Badge>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <div className="flex justify-between items-center">
                    <span className="font-bold">Total</span>
                    <span className="text-2xl font-bold text-primary flex items-center">
                      <IndianRupee className="w-5 h-5" />
                      {getTotal().toFixed(0)}
                    </span>
                  </div>
                </div>

                <div className="space-y-3 pt-2">
                  <Button
                    onClick={handleCreateOrder}
                    disabled={loading}
                    className="w-full h-12 text-base font-semibold gap-2"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Creating Order...
                      </>
                    ) : (
                      <>
                        Proceed to Payment
                        <ArrowRight className="w-5 h-5" />
                      </>
                    )}
                  </Button>
                  <Button asChild variant="outline" className="w-full">
                    <Link href="/cart">Back to Cart</Link>
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
