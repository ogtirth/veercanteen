"use client";

import { useEffect, useState } from "react";
import Header from "@/components/Header";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useCartStore } from "@/lib/cart-store";
import { Plus, Minus } from "lucide-react";
import { toast } from "sonner";
import prisma from "@/lib/prisma";

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
  itemId: string;
  quantity: number;
}

export default function MenuPage() {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [cartQuantities, setCartQuantities] = useState<Record<string, number>>({});
  const { data: session } = useSession();
  const router = useRouter();
  const addItem = useCartStore((state) => state.addItem);

  useEffect(() => {
    const fetchMenu = async () => {
      try {
        const response = await fetch("/api/menu");
        const data = await response.json();
        if (data.success) {
          setItems(data.data);
        }
      } catch (error) {
        console.error("Error fetching menu:", error);
        toast.error("Failed to load menu");
      } finally {
        setLoading(false);
      }
    };

    fetchMenu();
  }, []);

  const categories = Array.from(
    new Set(items.map((item) => item.category).filter((c): c is string => !!c))
  );
  const filteredItems = selectedCategory
    ? items.filter((item) => item.category === selectedCategory)
    : items;

  const handleAddToCart = (item: MenuItem) => {
    if (!session?.user) {
      router.push("/login");
      toast.error("Please login first");
      return;
    }

    const qty = cartQuantities[item.id] || 1;
    addItem({
      itemId: item.id,
      name: item.name,
      price: item.price,
      quantity: qty,
      image: item.image,
    });

    toast.success(`${item.name} added to cart`);
    setCartQuantities((prev) => ({ ...prev, [item.id]: 1 }));
  };

  const updateQty = (itemId: string, qty: number) => {
    setCartQuantities((prev) => ({
      ...prev,
      [itemId]: Math.max(1, qty),
    }));
  };

  return (
    <>
      <Header />
      <main className="container py-8">
        <h1 className="text-4xl font-bold mb-8">Menu</h1>

        {categories.length > 0 && (
          <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
            <button
              onClick={() => setSelectedCategory(null)}
              className={`px-4 py-2 rounded-lg whitespace-nowrap transition ${
                selectedCategory === null
                  ? "bg-primary text-white"
                  : "bg-secondary hover:bg-muted"
              }`}
            >
              All Items
            </button>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 rounded-lg whitespace-nowrap transition ${
                  selectedCategory === cat
                    ? "bg-primary text-white"
                    : "bg-secondary hover:bg-muted"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        )}

        {loading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-muted rounded-lg p-4 animate-pulse h-80" />
            ))}
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-lg text-muted-foreground">No items found</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredItems.map((item) => (
              <div
                key={item.id}
                className="border rounded-lg overflow-hidden hover:shadow-lg transition"
              >
                {item.image && (
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-full h-48 object-cover"
                  />
                )}
                <div className="p-4">
                  <h3 className="font-bold text-lg">{item.name}</h3>
                  {item.description && (
                    <p className="text-sm text-muted-foreground mb-2">
                      {item.description}
                    </p>
                  )}

                  <div className="flex justify-between items-center mb-4">
                    <span className="text-lg font-bold text-primary">
                      ₹{item.price.toFixed(2)}
                    </span>
                    <span
                      className={`text-sm ${
                        item.stock > 0
                          ? "text-green-600"
                          : "text-red-600"
                      }`}
                    >
                      {item.stock > 0 ? `${item.stock} in stock` : "Out of stock"}
                    </span>
                  </div>

                  {item.isAvailable && item.stock > 0 ? (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() =>
                            updateQty(
                              item.id,
                              (cartQuantities[item.id] || 1) - 1
                            )
                          }
                          className="border rounded p-1"
                        >
                          <Minus className="h-4 w-4" />
                        </button>
                        <span className="flex-1 text-center">
                          {cartQuantities[item.id] || 1}
                        </span>
                        <button
                          onClick={() =>
                            updateQty(
                              item.id,
                              (cartQuantities[item.id] || 1) + 1
                            )
                          }
                          className="border rounded p-1"
                        >
                          <Plus className="h-4 w-4" />
                        </button>
                      </div>
                      <button
                        onClick={() => handleAddToCart(item)}
                        className="w-full bg-primary text-white py-2 rounded-lg hover:bg-primary/90 transition"
                      >
                        Add to Cart
                      </button>
                    </div>
                  ) : (
                    <button
                      disabled
                      className="w-full bg-muted text-muted-foreground py-2 rounded-lg cursor-not-allowed"
                    >
                      Not Available
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </>
  );
}
