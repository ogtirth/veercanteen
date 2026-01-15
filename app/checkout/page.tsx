"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import { useCartStore } from "@/lib/cart-store";
import { validateAndCreateOrder, confirmPayment } from "@/lib/actions";
import { toast } from "sonner";
import Link from "next/link";
import { Copy, Check } from "lucide-react";

interface CheckoutState {
  stage: "cart" | "payment" | "success";
  orderId?: string;
  invoiceNumber?: string;
  qrCodeDataUrl?: string;
  upiId?: string;
  amount?: number;
}

export default function CheckoutPage() {
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
        setState({
          stage: "payment",
          orderId: result.orderId,
          invoiceNumber: result.invoiceNumber,
          qrCodeDataUrl: result.qrCodeDataUrl,
          upiId: result.upiId,
          amount: result.amount,
        });
      } else {
        toast.error(result.error || "Failed to create order");
      }
    } catch (error) {
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
        toast.success("Payment confirmed!");
        setState({ stage: "success", orderId: state.orderId, invoiceNumber: state.invoiceNumber });
        clearCart();
        setTimeout(() => {
          router.push("/my-orders");
        }, 2000);
      } else {
        toast.error(result.error || "Failed to confirm payment");
      }
    } catch (error) {
      toast.error("An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (state.stage === "success") {
    return (
      <>
        <Header />
        <main className="container py-16">
          <div className="max-w-md mx-auto text-center">
            <div className="text-6xl mb-4">✅</div>
            <h1 className="text-3xl font-bold mb-2">Order Confirmed!</h1>
            <p className="text-muted-foreground mb-6">
              Your order has been successfully placed.
            </p>
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-8">
              <p className="text-sm text-muted-foreground">Invoice Number</p>
              <p className="text-xl font-bold text-green-700">
                {state.invoiceNumber}
              </p>
            </div>
            <p className="text-muted-foreground mb-8">
              Redirecting to your orders...
            </p>
            <Link
              href="/my-orders"
              className="inline-block bg-primary text-white px-8 py-3 rounded-lg hover:bg-primary/90"
            >
              View My Orders
            </Link>
          </div>
        </main>
      </>
    );
  }

  if (state.stage === "payment") {
    return (
      <>
        <Header />
        <main className="container max-w-2xl py-8">
          <div className="space-y-8">
            <div>
              <h1 className="text-3xl font-bold mb-2">Complete Payment</h1>
              <p className="text-muted-foreground">
                Invoice #{state.invoiceNumber}
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              {/* QR Code */}
              <div className="flex flex-col items-center justify-center border rounded-lg p-8 bg-card">
                {state.qrCodeDataUrl && (
                  <>
                    <img
                      src={state.qrCodeDataUrl}
                      alt="UPI QR Code"
                      className="w-full max-w-sm mb-4"
                    />
                    <p className="text-sm text-muted-foreground text-center">
                      Scan with GPay, PhonePe, or any UPI app
                    </p>
                  </>
                )}
              </div>

              {/* Payment Details */}
              <div className="space-y-6">
                <div>
                  <h2 className="font-bold text-lg mb-4">Payment Details</h2>
                  <div className="bg-secondary rounded-lg p-4 space-y-3">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Amount</span>
                      <span className="font-bold text-lg text-primary">
                        ₹{state.amount?.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">UPI ID</span>
                      <span className="font-mono">{state.upiId}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="font-bold mb-2">Or enter UPI ID manually:</h3>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={state.upiId || ""}
                      readOnly
                      className="flex-1 border rounded-lg px-4 py-2 bg-muted"
                    />
                    <button
                      onClick={() => copyToClipboard(state.upiId || "")}
                      className="bg-secondary hover:bg-muted p-2 rounded-lg transition"
                    >
                      {copied ? (
                        <Check className="h-5 w-5 text-green-600" />
                      ) : (
                        <Copy className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-blue-900">
                    📱 Open your UPI app, scan the QR code, and complete the
                    payment. Then click "I have paid" below.
                  </p>
                </div>

                <button
                  onClick={handleConfirmPayment}
                  disabled={loading}
                  className="w-full bg-primary text-white py-3 rounded-lg hover:bg-primary/90 disabled:opacity-50 transition font-bold"
                >
                  {loading ? "Processing..." : "I Have Paid"}
                </button>

                <Link
                  href="/menu"
                  className="w-full border border-primary text-primary py-3 rounded-lg text-center hover:bg-primary/10 transition block"
                >
                  Continue Shopping
                </Link>
              </div>
            </div>

            {/* Order Items Summary */}
            <div className="border-t pt-8">
              <h2 className="font-bold text-lg mb-4">Order Items</h2>
              <div className="space-y-2">
                {items.map((item) => (
                  <div key={item.itemId} className="flex justify-between">
                    <span>
                      {item.name} × {item.quantity}
                    </span>
                    <span>₹{(item.price * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
              </div>
              <div className="border-t mt-4 pt-4 flex justify-between font-bold text-lg">
                <span>Total</span>
                <span className="text-primary">₹{state.amount?.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <Header />
      <main className="container max-w-2xl py-8">
        <h1 className="text-3xl font-bold mb-8">Review Order</h1>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <h2 className="font-bold text-lg mb-4">Items</h2>
            <div className="space-y-4 border rounded-lg p-4">
              {items.map((item) => (
                <div key={item.itemId} className="flex justify-between items-center">
                  <div>
                    <p className="font-medium">{item.name}</p>
                    <p className="text-sm text-muted-foreground">
                      Qty: {item.quantity}
                    </p>
                  </div>
                  <p className="font-bold">
                    ₹{(item.price * item.quantity).toFixed(2)}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="lg:col-span-1">
            <div className="border rounded-lg p-6 sticky top-20 space-y-4">
              <h2 className="font-bold text-lg">Order Summary</h2>

              <div className="border-t pt-4 space-y-2">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>₹{getTotal().toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>Delivery</span>
                  <span>Free</span>
                </div>
              </div>

              <div className="border-t pt-4 flex justify-between font-bold text-lg">
                <span>Total</span>
                <span className="text-primary">₹{getTotal().toFixed(2)}</span>
              </div>

              <button
                onClick={handleCreateOrder}
                disabled={loading}
                className="w-full bg-primary text-white py-3 rounded-lg hover:bg-primary/90 disabled:opacity-50 transition"
              >
                {loading ? "Creating Order..." : "Proceed to Payment"}
              </button>

              <Link
                href="/cart"
                className="w-full border border-primary text-primary py-3 rounded-lg text-center hover:bg-primary/10 transition block"
              >
                Back to Cart
              </Link>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
