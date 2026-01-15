"use client";

import { useEffect, useState } from "react";
import {
  getMenuItems,
  createMenuItem,
  updateMenuItem,
  deleteMenuItem,
} from "@/lib/admin-actions";
import { Plus, Edit2, Trash2, X, Search, ImageIcon, IndianRupee, Filter } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface MenuItem {
  id: string;
  name: string;
  price: number;
  description: string | null;
  category: string | null;
  stock: number;
  unlimitedStock: boolean;
  isAvailable: boolean;
  image: string | null;
}

export default function AdminMenuPage() {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [filteredItems, setFilteredItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [formData, setFormData] = useState({
    name: "",
    price: "",
    description: "",
    category: "",
    stock: "",
    unlimitedStock: false,
    isAvailable: true,
    image: "",
  });

  const categories = ["Snacks", "Beverages", "Meals", "Desserts", "Breakfast"];

  useEffect(() => {
    loadItems();
  }, []);

  useEffect(() => {
    filterItems();
  }, [items, searchQuery, selectedCategory]);

  const loadItems = async () => {
    try {
      const result = await getMenuItems();
      if (result.success && result.data) {
        setItems(result.data.map(item => ({
          ...item,
          unlimitedStock: (item as any).unlimitedStock || false
        })));
      }
    } catch (error) {
      toast.error("Failed to load menu items");
    } finally {
      setLoading(false);
    }
  };

  const filterItems = () => {
    let filtered = items;
    
    if (searchQuery) {
      filtered = filtered.filter((item) =>
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    if (selectedCategory !== "all") {
      filtered = filtered.filter((item) => item.category === selectedCategory);
    }
    
    setFilteredItems(filtered);
  };

  const openModal = (item?: MenuItem) => {
    if (item) {
      setEditingItem(item);
      setFormData({
        name: item.name,
        price: item.price.toString(),
        description: item.description || "",
        category: item.category || "",
        stock: item.stock.toString(),
        unlimitedStock: item.unlimitedStock,
        isAvailable: item.isAvailable,
        image: item.image || "",
      });
    } else {
      setEditingItem(null);
      setFormData({
        name: "",
        price: "",
        description: "",
        category: "",
        stock: "",
        unlimitedStock: false,
        isAvailable: true,
        image: "",
      });
    }
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingItem(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const data = {
      name: formData.name,
      price: parseFloat(formData.price),
      description: formData.description || null,
      category: formData.category || null,
      stock: parseInt(formData.stock),
      unlimitedStock: formData.unlimitedStock,
      isAvailable: formData.isAvailable,
      image: formData.image || null,
    };

    try {
      let result;
      if (editingItem) {
        result = await updateMenuItem(editingItem.id, data);
      } else {
        result = await createMenuItem(data);
      }

      if (result.success) {
        toast.success(editingItem ? "Item updated!" : "Item added!");
        closeModal();
        loadItems();
      } else {
        toast.error(result.error || "Operation failed");
      }
    } catch (error) {
      toast.error("Something went wrong");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this item?")) return;

    try {
      const result = await deleteMenuItem(id);
      if (result.success) {
        toast.success("Item deleted!");
        loadItems();
      } else {
        toast.error(result.error || "Delete failed");
      }
    } catch (error) {
      toast.error("Something went wrong");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading menu...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Menu Management</h1>
          <p className="text-muted-foreground mt-1">
            Manage your food items and availability
          </p>
        </div>
        <Button onClick={() => openModal()} size="lg" className="gap-2">
          <Plus className="w-5 h-5" />
          Add Item
        </Button>
      </div>

      {/* Filters & Stats */}
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                placeholder="Search menu items..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Category Filter */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-4 py-2 h-11 border border-input rounded-xl focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent bg-background"
            >
              <option value="all">All Categories</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>
        </CardHeader>

        <CardContent>
          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 rounded-xl bg-primary/5">
              <div className="text-3xl font-bold text-primary">{items.length}</div>
              <div className="text-sm text-muted-foreground mt-1">Total Items</div>
            </div>
            <div className="text-center p-4 rounded-xl bg-green-50">
              <div className="text-3xl font-bold text-green-600">
                {items.filter((i) => i.isAvailable).length}
              </div>
              <div className="text-sm text-muted-foreground mt-1">Available</div>
            </div>
            <div className="text-center p-4 rounded-xl bg-amber-50">
              <div className="text-3xl font-bold text-amber-600">
                {items.filter((i) => i.stock < 10).length}
              </div>
              <div className="text-sm text-muted-foreground mt-1">Low Stock</div>
            </div>
            <div className="text-center p-4 rounded-xl bg-red-50">
              <div className="text-3xl font-bold text-red-600">
                {items.filter((i) => i.stock === 0).length}
              </div>
              <div className="text-sm text-muted-foreground mt-1">Out of Stock</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Menu Items Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredItems.map((item) => (
          <div
            key={item.id}
            className="bg-white rounded-2xl overflow-hidden shadow-smooth hover:shadow-card hover:-translate-y-1 transition-all duration-200 animate-slide-up"
          >
            {/* Image */}
            <div className="relative h-48 bg-gradient-to-br from-primary/10 to-primary/5">
              {item.image ? (
                <img
                  src={item.image}
                  alt={item.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <ImageIcon className="w-16 h-16 text-muted-foreground/30" />
                </div>
              )}
              
              {/* Availability Badge */}
              <div className="absolute top-3 right-3">
                <Badge variant={item.isAvailable ? "success" : "secondary"}>
                  {item.isAvailable ? "Available" : "Unavailable"}
                </Badge>
              </div>

              {/* Stock Badge */}
              {item.unlimitedStock ? (
                <div className="absolute top-3 left-3">
                  <Badge className="bg-green-500">∞ Unlimited</Badge>
                </div>
              ) : (
                <>
                  {item.stock < 10 && item.stock > 0 && (
                    <div className="absolute top-3 left-3">
                      <Badge variant="warning">Low Stock</Badge>
                    </div>
                  )}
                  {item.stock === 0 && (
                    <div className="absolute top-3 left-3">
                      <Badge variant="destructive">Out of Stock</Badge>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Content */}
            <div className="p-4 space-y-3">
              <div>
                <h3 className="font-bold text-lg mb-1">{item.name}</h3>
                {item.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {item.description}
                  </p>
                )}
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1 text-primary font-bold text-xl">
                  <IndianRupee className="w-5 h-5" />
                  {item.price}
                </div>
                <div className="text-sm">
                  <span className="text-muted-foreground">Stock:</span>{" "}
                  <span className="font-semibold">{item.stock}</span>
                </div>
              </div>

              {item.category && (
                <Badge variant="secondary" className="text-xs">
                  {item.category}
                </Badge>
              )}

              {/* Actions */}
              <div className="flex gap-2 pt-3 border-t">
                <Button
                  onClick={() => openModal(item)}
                  variant="outline"
                  size="sm"
                  className="flex-1 gap-2"
                >
                  <Edit2 className="w-4 h-4" />
                  Edit
                </Button>
                <Button
                  onClick={() => handleDelete(item.id)}
                  variant="destructive"
                  size="sm"
                  className="flex-1 gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredItems.length === 0 && (
        <div className="text-center py-16">
          <div className="text-muted-foreground text-lg">
            No items found. Add your first menu item!
          </div>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-elevated animate-scale-in">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b sticky top-0 bg-white">
              <h2 className="text-2xl font-bold">
                {editingItem ? "Edit Menu Item" : "Add New Item"}
              </h2>
              <button
                onClick={closeModal}
                className="p-2 hover:bg-secondary rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Name */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold mb-2">
                    Item Name *
                  </label>
                  <Input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    placeholder="e.g., Masala Dosa"
                  />
                </div>

                {/* Price */}
                <div>
                  <label className="block text-sm font-semibold mb-2">
                    Price (₹) *
                  </label>
                  <Input
                    type="number"
                    required
                    step="0.01"
                    min="0"
                    value={formData.price}
                    onChange={(e) =>
                      setFormData({ ...formData, price: e.target.value })
                    }
                    placeholder="50.00"
                  />
                </div>

                {/* Stock */}
                <div>
                  <label className="block text-sm font-semibold mb-2">
                    Stock Quantity *
                  </label>
                  <Input
                    type="number"
                    required
                    min="0"
                    value={formData.stock}
                    onChange={(e) =>
                      setFormData({ ...formData, stock: e.target.value })
                    }
                    placeholder="100"
                    disabled={formData.unlimitedStock}
                  />
                  <div className="mt-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.unlimitedStock}
                        onChange={(e) =>
                          setFormData({ ...formData, unlimitedStock: e.target.checked, stock: e.target.checked ? "999999" : "0" })
                        }
                        className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
                      />
                      <span className="text-sm text-muted-foreground">Unlimited Stock (Tea, Burgers, etc.)</span>
                    </label>
                  </div>
                </div>

                {/* Category */}
                <div>
                  <label className="block text-sm font-semibold mb-2">
                    Category
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) =>
                      setFormData({ ...formData, category: e.target.value })
                    }
                    className="w-full px-4 py-3 border border-input rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  >
                    <option value="">Select category</option>
                    {categories.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Availability */}
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="isAvailable"
                    checked={formData.isAvailable}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        isAvailable: e.target.checked,
                      })
                    }
                    className="w-5 h-5 rounded border-input text-primary focus:ring-2 focus:ring-primary"
                  />
                  <label htmlFor="isAvailable" className="font-semibold cursor-pointer">
                    Available for orders
                  </label>
                </div>

                {/* Description */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold mb-2">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    placeholder="Brief description of the item..."
                    rows={3}
                    className="w-full px-4 py-3 border border-input rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
                  />
                </div>

                {/* Image URL */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold mb-2">
                    Image URL
                  </label>
                  <Input
                    type="url"
                    value={formData.image}
                    onChange={(e) =>
                      setFormData({ ...formData, image: e.target.value })
                    }
                    placeholder="https://example.com/image.jpg"
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  onClick={closeModal}
                  variant="secondary"
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="flex-1"
                >
                  {editingItem ? "Update Item" : "Add Item"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
