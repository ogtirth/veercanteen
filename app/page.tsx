"use client";

import Header from "@/components/Header";
import Link from "next/link";
import { ArrowRight, Clock, Shield, Sparkles, ChefHat } from "lucide-react";
import { useEffect, useState } from "react";

const floatingEmojis = ["🍔", "🍕", "🌮", "🍟", "☕", "🧃", "🍩", "🥤", "🍪", "🥪", "🍳", "🥗"];

function FloatingEmoji({ emoji, delay, duration, left }: { emoji: string; delay: number; duration: number; left: number }) {
  return (
    <div
      className="absolute text-4xl md:text-5xl animate-float pointer-events-none select-none opacity-60"
      style={{
        left: `${left}%`,
        animationDelay: `${delay}s`,
        animationDuration: `${duration}s`,
      }}
    >
      {emoji}
    </div>
  );
}

function TypewriterText({ text }: { text: string }) {
  const [displayText, setDisplayText] = useState("");
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (currentIndex < text.length) {
      const timeout = setTimeout(() => {
        setDisplayText(prev => prev + text[currentIndex]);
        setCurrentIndex(prev => prev + 1);
      }, 80);
      return () => clearTimeout(timeout);
    }
  }, [currentIndex, text]);

  return (
    <span>
      {displayText}
      <span className="animate-blink">|</span>
    </span>
  );
}

function CountUpNumber({ end, duration = 2000, suffix = "" }: { end: number; duration?: number; suffix?: string }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let startTime: number;
    const animate = (currentTime: number) => {
      if (!startTime) startTime = currentTime;
      const progress = Math.min((currentTime - startTime) / duration, 1);
      setCount(Math.floor(progress * end));
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };
    requestAnimationFrame(animate);
  }, [end, duration]);

  return <span>{count}{suffix}</span>;
}

export default function Home() {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  return (
    <>
      <Header />
      <main className="overflow-hidden">
        {/* Hero Section */}
        <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-orange-50 via-white to-amber-50" />
          
          <div 
            className="absolute inset-0 opacity-20 transition-all duration-300 ease-out"
            style={{
              background: `radial-gradient(600px circle at ${mousePosition.x}px ${mousePosition.y}px, rgba(249, 115, 22, 0.15) 0%, transparent 100%)`,
            }}
          />

          <div className="absolute inset-0 overflow-hidden">
            {floatingEmojis.map((emoji, i) => (
              <FloatingEmoji
                key={i}
                emoji={emoji}
                delay={i * 0.8}
                duration={15 + Math.random() * 10}
                left={5 + (i * 8)}
              />
            ))}
          </div>

          <div className="absolute top-20 left-10 w-72 h-72 bg-orange-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob" />
          <div className="absolute top-40 right-10 w-72 h-72 bg-yellow-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000" />
          <div className="absolute bottom-20 left-1/2 w-72 h-72 bg-pink-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-4000" />

          <div className="container relative z-10 text-center space-y-8 py-20">
            <div className="inline-flex items-center gap-2 bg-white/80 backdrop-blur-sm border border-orange-200 rounded-full px-4 py-2 text-sm font-medium text-orange-600 animate-bounce-slow shadow-lg">
              <Sparkles className="w-4 h-4" />
              Now serving fresh & hot!
            </div>

            <div className="space-y-4">
              <h1 className="text-5xl md:text-7xl lg:text-8xl font-black tracking-tight">
                <span className="bg-gradient-to-r from-orange-600 via-red-500 to-amber-500 bg-clip-text text-transparent animate-gradient">
                  Veer Canteen
                </span>
              </h1>
              <div className="text-2xl md:text-3xl font-semibold text-gray-700">
                <TypewriterText text="Taste the difference. Feel the love." />
              </div>
            </div>

            <p className="text-lg md:text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed animate-fade-in-up">
              From quick bites to hearty meals — freshly prepared, always delicious. 
              Order in seconds, enjoy in minutes.
            </p>

            <div className="flex flex-col sm:flex-row justify-center gap-4 pt-4 animate-fade-in-up">
              <Link
                href="/menu"
                className="group relative inline-flex items-center justify-center gap-2 bg-gradient-to-r from-orange-500 to-red-500 text-white px-8 py-4 rounded-2xl font-semibold text-lg shadow-xl shadow-orange-500/25 hover:shadow-orange-500/40 transition-all duration-300 hover:scale-105 overflow-hidden"
              >
                <span className="relative z-10 flex items-center gap-2">
                  Explore Menu <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-red-500 to-orange-500 opacity-0 group-hover:opacity-100 transition-opacity" />
              </Link>
              <Link
                href="/register"
                className="inline-flex items-center justify-center gap-2 bg-white border-2 border-orange-200 text-orange-600 px-8 py-4 rounded-2xl font-semibold text-lg hover:border-orange-400 hover:bg-orange-50 transition-all duration-300 hover:scale-105 shadow-lg"
              >
                Get Started Free
              </Link>
            </div>

            <div className="flex flex-wrap justify-center gap-8 md:gap-16 pt-12 animate-fade-in-up">
              <div className="text-center">
                <div className="text-4xl md:text-5xl font-black text-orange-500">
                  <CountUpNumber end={500} suffix="+" />
                </div>
                <div className="text-sm text-gray-500 font-medium">Happy Customers</div>
              </div>
              <div className="text-center">
                <div className="text-4xl md:text-5xl font-black text-orange-500">
                  <CountUpNumber end={50} suffix="+" />
                </div>
                <div className="text-sm text-gray-500 font-medium">Menu Items</div>
              </div>
              <div className="text-center">
                <div className="text-4xl md:text-5xl font-black text-orange-500">
                  <CountUpNumber end={5} suffix=" min" />
                </div>
                <div className="text-sm text-gray-500 font-medium">Avg. Prep Time</div>
              </div>
            </div>
          </div>

          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
            <div className="w-6 h-10 border-2 border-orange-300 rounded-full flex justify-center">
              <div className="w-1 h-3 bg-orange-400 rounded-full mt-2 animate-scroll-down" />
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-24 bg-white relative">
          <div className="absolute inset-0 bg-[radial-gradient(#f97316_1px,transparent_1px)] [background-size:20px_20px] opacity-[0.03]" />
          
          <div className="container relative">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-5xl font-bold mb-4">
                Why <span className="text-orange-500">Choose</span> Us
              </h2>
              <p className="text-gray-500 text-lg max-w-2xl mx-auto">
                We are not just a canteen. We are your daily food companion.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {[
                {
                  icon: Clock,
                  title: "Lightning Fast",
                  description: "Skip the queue. Order ahead and pick up when ready. Your time matters.",
                  gradient: "from-blue-500 to-cyan-500",
                },
                {
                  icon: ChefHat,
                  title: "Fresh & Tasty",
                  description: "Made to order with love. Quality ingredients, amazing taste, every single time.",
                  gradient: "from-orange-500 to-red-500",
                },
                {
                  icon: Shield,
                  title: "Safe Payments",
                  description: "Pay with UPI or cash. Secure transactions with instant confirmation.",
                  gradient: "from-green-500 to-emerald-500",
                },
              ].map((feature, i) => (
                <div
                  key={i}
                  className="group relative bg-white rounded-3xl p-8 shadow-xl hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 border border-gray-100"
                >
                  <div className={`inline-flex p-4 rounded-2xl bg-gradient-to-r ${feature.gradient} mb-6 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                    <feature.icon className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                  <p className="text-gray-500 leading-relaxed">{feature.description}</p>
                  <div className={`absolute inset-0 bg-gradient-to-r ${feature.gradient} opacity-0 group-hover:opacity-5 rounded-3xl transition-opacity duration-300`} />
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Popular Items */}
        <section className="py-24 bg-gradient-to-b from-orange-50 to-white relative overflow-hidden">
          <div className="container">
            <div className="text-center mb-16">
              <span className="inline-block px-4 py-1 bg-orange-100 text-orange-600 rounded-full text-sm font-semibold mb-4">
                🔥 Popular Picks
              </span>
              <h2 className="text-3xl md:text-5xl font-bold mb-4">
                Customer Favorites
              </h2>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {[
                { emoji: "☕", name: "Masala Chai", price: "₹15", tag: "Best Seller" },
                { emoji: "🥪", name: "Veg Sandwich", price: "₹30", tag: "Quick Bite" },
                { emoji: "�", name: "Pizza", price: "₹50", tag: "Popular" },
                { emoji: "🥤", name: "Cold Coffee", price: "₹40", tag: "Refreshing" },
              ].map((item, i) => (
                <div
                  key={i}
                  className="group relative bg-white rounded-3xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-2 cursor-pointer"
                >
                  <div className="absolute top-3 right-3">
                    <span className="px-2 py-1 bg-orange-100 text-orange-600 rounded-full text-xs font-medium">
                      {item.tag}
                    </span>
                  </div>
                  <div className="text-6xl mb-4 group-hover:scale-125 transition-transform duration-300">
                    {item.emoji}
                  </div>
                  <h3 className="font-bold text-lg mb-1">{item.name}</h3>
                  <p className="text-orange-500 font-bold text-xl">{item.price}</p>
                </div>
              ))}
            </div>

            <div className="text-center mt-12">
              <Link
                href="/menu"
                className="inline-flex items-center gap-2 text-orange-500 font-semibold text-lg hover:text-orange-600 transition-colors group"
              >
                View Full Menu
                <ArrowRight className="w-5 h-5 group-hover:translate-x-2 transition-transform" />
              </Link>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-24 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-orange-500 to-red-500" />
          <div className="container relative z-10 text-center text-white">
            <h2 className="text-4xl md:text-6xl font-bold mb-6">
              Ready to Order?
            </h2>
            <p className="text-xl text-white/80 mb-8 max-w-2xl mx-auto">
              Join hundreds of happy customers who save time and enjoy great food every day.
            </p>
            <Link
              href="/menu"
              className="inline-flex items-center gap-2 bg-white text-orange-500 px-10 py-5 rounded-2xl font-bold text-xl hover:bg-gray-100 transition-all duration-300 hover:scale-105 shadow-2xl"
            >
              Start Ordering Now <ArrowRight className="w-6 h-6" />
            </Link>
          </div>
        </section>

        {/* Footer */}
        <footer className="py-12 bg-gray-900 text-white">
          <div className="container">
            <div className="flex flex-col md:flex-row justify-between items-center gap-6">
              <div className="text-center md:text-left">
                <h3 className="text-2xl font-bold mb-2">Veer Canteen</h3>
                <p className="text-gray-400">Serving delicious food since 2024</p>
              </div>
              <div className="flex gap-8 text-sm text-gray-400">
                <Link href="/menu" className="hover:text-white transition-colors">Menu</Link>
                <Link href="/login" className="hover:text-white transition-colors">Login</Link>
                <Link href="/register" className="hover:text-white transition-colors">Register</Link>
              </div>
              <div className="text-gray-400 text-sm">
                Made with ❤️ for food lovers
              </div>
            </div>
          </div>
        </footer>
      </main>
    </>
  );
}
