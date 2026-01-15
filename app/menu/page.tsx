"use client";

import { useEffect, useState } from "react";
import Header from "@/components/Header";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useCartStore } from "@/lib/cart-store";
import { useSounds } from "@/lib/sounds";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Plus,
  Minus,
  Search,
  ShoppingCart,
  ImageIcon,
  UtensilsCrossed,
  Sparkles,
  CheckCircle,
  XCircle,
  Filter
} from "lucide-react";

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

export default function MenuPage() {
  const sounds = useSounds();
  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
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

  const filteredItems = items.filter((item) => {
    const matchesCategory = !selectedCategory || item.category === selectedCategory;
    const matchesSearch =
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleAddToCart = (item: MenuItem) => {
    if (!session?.user) {
      router.push("/login");
      toast.error("Please login to add items to cart");
      sounds.error();
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

    sounds.addToCart();
    toast.success(`${qty}x ${item.name} added to cart!`, {
      icon: <ShoppingCart className="w-4 h-4" />,
    });
    setCartQuantities((prev) => ({ ...prev, [item.id]: 1 }));
  };

  const updateQty = (itemId: string, qty: number) => {
    sounds.updateQuantity();
    setCartQuantities((prev) => ({
      ...prev,
      [itemId]: Math.max(1, qty),
    }));
  };

  return (
    <>
      <Header />
      <main className="min-h-screen">
        {/* Hero Section */}
        <section className="relative py-16 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-orange-50 via-white to-amber-50" />
          <div className="absolute top-0 right-0 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl" />

          <div className="container relative z-10">
            <div className="text-center max-w-2xl mx-auto animate-slide-up">
              <Badge variant="secondary" className="mb-4 gap-2">
                <Sparkles className="w-4 h-4" />
                Fresh & Delicious
              </Badge>
              <h1 className="text-4xl md:text-5xl font-bold mb-4">
                Our <span className="text-primary">Menu</span>
              </h1>
              <p className="text-muted-foreground text-lg">
                Explore our wide variety of delicious food and beverages
              </p>
            </div>

            {/* Search & Filter */}
            <div className="max-w-3xl mx-auto mt-8 animate-slide-up" style={{ animationDelay: "100ms" }}>
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    placeholder="Search menu items..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-12 h-12 text-base"
                  />
                </div>
              </div>
            </div>

            {/* Category Pills */}
            {categories.length > 0 && (
              <div className="flex flex-wrap justify-center gap-2 mt-6 animate-slide-up" style={{ animationDelay: "200ms" }}>
                <Button
                  variant={selectedCategory === null ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedCategory(null)}
                  className="rounded-full"
                >
                  All Items
                </Button>
                {categories.map((cat) => (
                  <Button
                    key={cat}
                    variant={selectedCategory === cat ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedCategory(cat)}
                    className="rounded-full"
                  >
                    {cat}
                  </Button>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Menu Items */}
        <section className="container py-8 pb-16">
          {loading ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {[...Array(8)].map((_, i) => (
                <Card key={i} className="overflow-hidden">
                  <div className="h-48 bg-secondary animate-pulse" />
                  <CardContent className="p-4 space-y-3">
                    <div className="h-5 bg-secondary rounded animate-pulse" />
                    <div className="h-4 bg-secondary rounded w-2/3 animate-pulse" />
                    <div className="h-10 bg-secondary rounded animate-pulse" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="text-center py-16">
              <UtensilsCrossed className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
              <p className="text-lg text-muted-foreground">No items found</p>
              <p className="text-sm text-muted-foreground mt-1">
                Try adjusting your search or filter
              </p>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredItems.map((item, index) => (
                <Card
                  key={item.id}
                  className="overflow-hidden group hover:shadow-card transition-all duration-300 animate-scale-in"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  {/* Image */}
                  <div className="relative h-48 bg-secondary overflow-hidden">
                    {item.image ? (
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-secondary to-secondary/50">
                        <UtensilsCrossed className="w-16 h-16 text-muted-foreground/30" />
                      </div>
                    )}
                    {/* Overlay Badges */}
                    <div className="absolute top-3 left-3 flex gap-2">
                      {item.category && (
                        <Badge variant="secondary" className="backdrop-blur-sm bg-white/90">
                          {item.category}
                        </Badge>
                      )}
                    </div>
                    <div className="absolute top-3 right-3">
                      {item.isAvailable && item.stock > 0 ? (
                        <Badge variant="success" className="backdrop-blur-sm gap-1">
                          <CheckCircle className="w-3 h-3" />
                          In Stock
                        </Badge>
                      ) : (
                        <Badge variant="destructive" className="backdrop-blur-sm gap-1">
                          <XCircle className="w-3 h-3" />
                          Sold Out
                        </Badge>
                      )}
                    </div>
                  </div>

                  <CardContent className="p-4">
                    <h3 className="font-bold text-lg mb-1 line-clamp-1">{item.name}</h3>
                    {item.description && (
                      <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                        {item.description}
                      </p>
                    )}

                    <div className="flex items-center justify-between mb-4">
                      <span className="text-2xl font-bold text-primary">
                        ₹{item.price}
                      </span>
                      {item.stock > 0 && item.stock <= 10 && (
                        <span className="text-xs text-amber-600 font-medium">
                          Only {item.stock} left!
                        </span>
                      )}
                    </div>

                    {item.isAvailable && item.stock > 0 ? (
                      <div className="space-y-3">
                        {/* Quantity Selector */}
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-9 w-9"
                            onClick={() =>
                              updateQty(item.id, (cartQuantities[item.id] || 1) - 1)
                            }
                          >
                            <Minus className="w-4 h-4" />
                          </Button>
                          <span className="flex-1 text-center font-semibold text-lg">
                            {cartQuantities[item.id] || 1}
                          </span>
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-9 w-9"
                            onClick={() =>
                              updateQty(item.id, (cartQuantities[item.id] || 1) + 1)
                            }
                          >
                            <Plus className="w-4 h-4" />
                          </Button>
                        </div>

                        {/* Add to Cart Button */}
                        <Button
                          className="w-full gap-2 h-11"
                          onClick={() => handleAddToCart(item)}
                        >
                          <ShoppingCart className="w-4 h-4" />
                          Add to Cart
                        </Button>
                      </div>
                    ) : (
                      <Button disabled className="w-full h-11">
                        Not Available
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </section>
      </main>
    </>
  );
}
