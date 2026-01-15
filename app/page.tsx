import Header from "@/components/Header";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

export default function Home() {
  return (
    <>
      <Header />
      <main>
        <section className="container py-20 text-center space-y-6">
          <div className="space-y-3">
            <h1 className="text-4xl md:text-6xl font-bold">
              Welcome to Veer Canteen
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Fast, fresh, and delicious food at your fingertips. Order now and
              enjoy our special menu items.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row justify-center gap-4 pt-8">
            <Link
              href="/menu"
              className="inline-flex items-center justify-center gap-2 bg-primary text-white px-8 py-3 rounded-lg hover:bg-primary/90 transition"
            >
              View Menu <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/register"
              className="inline-flex items-center justify-center gap-2 border border-primary text-primary px-8 py-3 rounded-lg hover:bg-primary/10 transition"
            >
              Create Account
            </Link>
          </div>
        </section>

        <section className="bg-secondary py-16">
          <div className="container">
            <h2 className="text-2xl font-bold mb-12 text-center">Why Choose Us?</h2>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="text-4xl mb-4">⚡</div>
                <h3 className="font-bold text-lg mb-2">Fast Delivery</h3>
                <p className="text-muted-foreground">
                  Get your food prepared quickly with our efficient ordering system
                </p>
              </div>
              <div className="text-center">
                <div className="text-4xl mb-4">✨</div>
                <h3 className="font-bold text-lg mb-2">Fresh Food</h3>
                <p className="text-muted-foreground">
                  All items prepared fresh daily using quality ingredients
                </p>
              </div>
              <div className="text-center">
                <div className="text-4xl mb-4">🔒</div>
                <h3 className="font-bold text-lg mb-2">Secure Payment</h3>
                <p className="text-muted-foreground">
                  UPI and cash payment options with secure transactions
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
