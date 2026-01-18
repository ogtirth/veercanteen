"use client";

import { useEffect, useState } from "react";
import {
  getMenuItems,
  createMenuItem,
  updateMenuItem,
  deleteMenuItem,
} from "@/lib/admin-actions";
import { 
  Plus, 
  Edit2, 
  Trash2, 
  Search, 
  ImageIcon, 
  Package,
  Coffee,
  UtensilsCrossed,
  Cake,
  Sunrise,
  Cookie,
  X,
  Check,
  Infinity,
  AlertCircle,
  Eye,
  EyeOff,
  Sparkles,
  Loader2,
  Upload
} from "lucide-react";
import { toast } from "sonner";
import { useSounds } from "@/lib/sounds";
import { Skeleton, SkeletonText } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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

const categoryIcons: Record<string, any> = {
  Snacks: Cookie,
  Beverages: Coffee,
  Meals: UtensilsCrossed,
  Desserts: Cake,
  Breakfast: Sunrise,
};

const categoryColors: Record<string, string> = {
  Snacks: "bg-amber-100 text-amber-700",
  Beverages: "bg-blue-100 text-blue-700",
  Meals: "bg-green-100 text-green-700",
  Desserts: "bg-pink-100 text-pink-700",
  Breakfast: "bg-orange-100 text-orange-700",
};

export default function AdminMenuPage() {
  const sounds = useSounds();
  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [deletingItem, setDeletingItem] = useState<MenuItem | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  
  // AI Image Search State
  const [searchingImages, setSearchingImages] = useState(false);
  const [imageResults, setImageResults] = useState<Array<{id: string; url: string; thumb: string; alt: string; credit: string}>>([]);
  const [showImagePicker, setShowImagePicker] = useState(false);
  
  const [formData, setFormData] = useState({
    name: "",
    price: "",
    description: "",
    category: "",
    stock: "0",
    unlimitedStock: false,
    isAvailable: true,
    image: "",
  });

  const categories = ["Snacks", "Beverages", "Meals", "Desserts", "Breakfast"];

  useEffect(() => {
    loadItems();
  }, []);

  const loadItems = async () => {
    try {
      const result = await getMenuItems();
      if (result.success && result.data) {
        setItems(result.data.map((item: any) => ({
          ...item,
          unlimitedStock: item.unlimitedStock || false
        })));
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

  const stats = {
    total: items.length,
    available: items.filter(i => i.isAvailable).length,
    lowStock: items.filter(i => !i.unlimitedStock && i.stock < 5 && i.stock > 0).length,
    outOfStock: items.filter(i => !i.unlimitedStock && i.stock === 0).length,
  };

  const openDialog = (item?: MenuItem) => {
    sounds.click();
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
        stock: "0",
        unlimitedStock: false,
        isAvailable: true,
        image: "",
      });
    }
    setShowDialog(true);
  };

  const closeDialog = () => {
    setShowDialog(false);
    setEditingItem(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate required fields
    if (!formData.name.trim()) {
      toast.error("Please enter item name");
      sounds.error();
      return;
    }
    if (!formData.price || parseFloat(formData.price) <= 0) {
      toast.error("Please enter a valid price");
      sounds.error();
      return;
    }
    
    setSaving(true);

    const data = {
      name: formData.name,
      price: parseFloat(formData.price),
      description: formData.description || null,
      category: formData.category || null,
      stock: formData.unlimitedStock ? 9999 : parseInt(formData.stock),
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
        sounds.itemSaved();
        toast.success(editingItem ? "Item updated successfully!" : "Item added successfully!");
        closeDialog();
        loadItems();
      } else {
        sounds.error();
        toast.error(result.error || "Operation failed");
      }
    } catch (error) {
      sounds.error();
      toast.error("Something went wrong");
    } finally {
      setSaving(false);
    }
  };

  const openDeleteDialog = (item: MenuItem) => {
    sounds.click();
    setDeletingItem(item);
    setShowDeleteDialog(true);
  };

  const handleDelete = async () => {
    if (!deletingItem) return;

    try {
      const result = await deleteMenuItem(deletingItem.id);
      if (result.success) {
        sounds.itemDeleted();
        toast.success("Item deleted successfully!");
        setShowDeleteDialog(false);
        setDeletingItem(null);
        loadItems();
      } else {
        sounds.error();
        toast.error(result.error || "Delete failed");
      }
    } catch (error) {
      sounds.error();
      toast.error("Something went wrong");
    }
  };

  const toggleAvailability = async (item: MenuItem) => {
    try {
      const result = await updateMenuItem(item.id, {
        ...item,
        isAvailable: !item.isAvailable,
      });
      if (result.success) {
        sounds.statusUpdate();
        toast.success(`${item.name} is now ${!item.isAvailable ? "available" : "unavailable"}`);
        loadItems();
      }
    } catch (error) {
      sounds.error();
      toast.error("Failed to update availability");
    }
  };

  // AI Image Search Function
  const searchForImages = async () => {
    if (!formData.name.trim()) {
      toast.error("Please enter a product name first");
      return;
    }
    
    setSearchingImages(true);
    setShowImagePicker(true);
    setImageResults([]);
    
    try {
      const response = await fetch(`/api/search-image?q=${encodeURIComponent(formData.name)}`);
      const data = await response.json();
      
      if (data.success && data.images) {
        setImageResults(data.images);
        sounds.click();
      } else {
        toast.error("No images found");
      }
    } catch (error) {
      toast.error("Failed to search images");
      sounds.error();
    } finally {
      setSearchingImages(false);
    }
  };

  const selectImage = (imageUrl: string) => {
    setFormData({ ...formData, image: imageUrl });
    setShowImagePicker(false);
    setImageResults([]);
    sounds.itemSaved();
    toast.success("Image selected!");
  };

  // Compress and upload image
  const handleImageUpload = async (file: File) => {
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be less than 5MB');
      sounds.error();
      return;
    }

    setUploadingImage(true);
    
    try {
      // Create image element to resize
      const img = document.createElement('img');
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      const loadImage = () => new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error('Failed to load image'));
        img.src = URL.createObjectURL(file);
      });

      await loadImage();
      
      // Resize to max 400x400 for storage efficiency
      const maxSize = 400;
      let { width, height } = img;
      
      if (width > maxSize || height > maxSize) {
        if (width > height) {
          height = (height / width) * maxSize;
          width = maxSize;
        } else {
          width = (width / height) * maxSize;
          height = maxSize;
        }
      }
      
      canvas.width = width;
      canvas.height = height;
      ctx?.drawImage(img, 0, 0, width, height);
      
      // Convert to base64 with compression
      const base64 = canvas.toDataURL('image/jpeg', 0.7);
      
      // Clean up
      URL.revokeObjectURL(img.src);
      
      setFormData(prev => ({ ...prev, image: base64 }));
      sounds.itemSaved();
      toast.success('Image uploaded! Saving...');
      
      // Auto-save the item after image upload
      setTimeout(() => {
        const form = document.getElementById('menuItemForm') as HTMLFormElement;
        if (form) {
          form.requestSubmit();
        }
      }, 500);
      
    } catch (error) {
      console.error('Image upload error:', error);
      toast.error('Failed to upload image. Please try again.');
      sounds.error();
    } finally {
      setUploadingImage(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-1/3 mb-4" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="p-4">
              <SkeletonText lines={4} />
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="animate-slide-up">
          <h1 className="text-3xl font-bold tracking-tight">Menu Management</h1>
          <p className="text-muted-foreground mt-1">
            Create, edit and manage your food items
          </p>
        </div>
        <Button onClick={() => openDialog()} size="lg" className="gap-2 shadow-lg hover:shadow-xl transition-all">
          <Plus className="w-5 h-5" />
          Add New Item
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 animate-slide-up" style={{ animationDelay: "50ms" }}>
        <Card className="hover:shadow-card transition-all">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <Package className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.total}</p>
              <p className="text-sm text-muted-foreground">Total Items</p>
            </div>
          </CardContent>
        </Card>
        <Card className="hover:shadow-card transition-all">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
              <Check className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.available}</p>
              <p className="text-sm text-muted-foreground">Available</p>
            </div>
          </CardContent>
        </Card>
        <Card className="hover:shadow-card transition-all">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center">
              <AlertCircle className="w-6 h-6 text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.lowStock}</p>
              <p className="text-sm text-muted-foreground">Low Stock</p>
            </div>
          </CardContent>
        </Card>
        <Card className="hover:shadow-card transition-all">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-red-100 flex items-center justify-center">
              <X className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.outOfStock}</p>
              <p className="text-sm text-muted-foreground">Out of Stock</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filter */}
      <Card className="animate-slide-up" style={{ animationDelay: "100ms" }}>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                placeholder="Search items by name or description..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-11"
              />
            </div>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-full md:w-[180px] h-11">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as "grid" | "table")} className="hidden md:block">
              <TabsList>
                <TabsTrigger value="grid">Grid</TabsTrigger>
                <TabsTrigger value="table">Table</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </CardContent>
      </Card>

      {/* Items Display */}
      {filteredItems.length === 0 ? (
        <Card className="animate-fade-in">
          <CardContent className="p-12 text-center">
            <Package className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">No items found</h3>
            <p className="text-muted-foreground mb-4">
              {searchQuery || selectedCategory !== "all" 
                ? "Try adjusting your search or filter" 
                : "Start by adding your first menu item"}
            </p>
            {!searchQuery && selectedCategory === "all" && (
              <Button onClick={() => openDialog()} className="gap-2">
                <Plus className="w-4 h-4" />
                Add First Item
              </Button>
            )}
          </CardContent>
        </Card>
      ) : viewMode === "grid" ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredItems.map((item, index) => {
            const CategoryIcon = categoryIcons[item.category || ""] || Package;
            const isLowStock = !item.unlimitedStock && item.stock < 5 && item.stock > 0;
            const isOutOfStock = !item.unlimitedStock && item.stock === 0;
            
            return (
              <Card
                key={item.id}
                className={`overflow-hidden hover:shadow-card transition-all duration-200 animate-slide-up ${
                  !item.isAvailable ? "opacity-60" : ""
                }`}
                style={{ animationDelay: `${index * 30}ms` }}
              >
                <div className="relative h-40 bg-gradient-to-br from-secondary to-secondary/50">
                  {item.image ? (
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <CategoryIcon className="w-16 h-16 text-muted-foreground/30" />
                    </div>
                  )}
                  {/* Status Badges */}
                  <div className="absolute top-2 left-2 flex flex-col gap-1">
                    {!item.isAvailable && (
                      <Badge variant="destructive" className="text-xs">Unavailable</Badge>
                    )}
                    {item.unlimitedStock && (
                      <Badge variant="secondary" className="text-xs gap-1">
                        <Infinity className="w-3 h-3" /> Unlimited
                      </Badge>
                    )}
                    {isLowStock && (
                      <Badge className="text-xs bg-amber-500">Low Stock</Badge>
                    )}
                    {isOutOfStock && (
                      <Badge variant="destructive" className="text-xs">Out of Stock</Badge>
                    )}
                  </div>
                  {/* Quick Actions */}
                  <div className="absolute top-2 right-2">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="secondary" size="sm" className="h-8 w-8 p-0 rounded-full">
                          <span className="sr-only">Actions</span>
                          <span className="text-lg">⋮</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => openDialog(item)}>
                          <Edit2 className="w-4 h-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => toggleAvailability(item)}>
                          {item.isAvailable ? (
                            <>
                              <EyeOff className="w-4 h-4 mr-2" />
                              Mark Unavailable
                            </>
                          ) : (
                            <>
                              <Eye className="w-4 h-4 mr-2" />
                              Mark Available
                            </>
                          )}
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => openDeleteDialog(item)}
                          className="text-destructive focus:text-destructive"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="font-semibold line-clamp-1">{item.name}</h3>
                      {item.category && (
                        <Badge variant="secondary" className={`text-xs mt-1 ${categoryColors[item.category] || ""}`}>
                          {item.category}
                        </Badge>
                      )}
                    </div>
                    <p className="font-bold text-primary text-lg">₹{item.price}</p>
                  </div>
                  {item.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                      {item.description}
                    </p>
                  )}
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">
                      {item.unlimitedStock ? (
                        <span className="flex items-center gap-1">
                          <Infinity className="w-4 h-4" /> Stock
                        </span>
                      ) : (
                        `Stock: ${item.stock}`
                      )}
                    </span>
                    <Switch
                      checked={item.isAvailable}
                      onCheckedChange={() => toggleAvailability(item)}
                      className="data-[state=checked]:bg-green-500"
                    />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card className="animate-fade-in">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Item</TableHead>
                <TableHead>Category</TableHead>
                <TableHead className="text-right">Price</TableHead>
                <TableHead className="text-right">Stock</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredItems.map((item) => {
                const isLowStock = !item.unlimitedStock && item.stock < 5 && item.stock > 0;
                const isOutOfStock = !item.unlimitedStock && item.stock === 0;
                
                return (
                  <TableRow key={item.id} className={!item.isAvailable ? "opacity-60" : ""}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center overflow-hidden">
                          {item.image ? (
                            <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                          ) : (
                            <ImageIcon className="w-5 h-5 text-muted-foreground" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium">{item.name}</p>
                          {item.description && (
                            <p className="text-xs text-muted-foreground line-clamp-1">{item.description}</p>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {item.category && (
                        <Badge variant="secondary" className={categoryColors[item.category] || ""}>
                          {item.category}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right font-medium">₹{item.price}</TableCell>
                    <TableCell className="text-right">
                      {item.unlimitedStock ? (
                        <Badge variant="secondary" className="gap-1">
                          <Infinity className="w-3 h-3" /> Unlimited
                        </Badge>
                      ) : (
                        <span className={isLowStock ? "text-amber-600" : isOutOfStock ? "text-red-600" : ""}>
                          {item.stock}
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Switch
                        checked={item.isAvailable}
                        onCheckedChange={() => toggleAvailability(item)}
                        className="data-[state=checked]:bg-green-500"
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button variant="outline" size="sm" onClick={() => openDialog(item)}>
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => openDeleteDialog(item)} className="text-destructive hover:text-destructive">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Card>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingItem ? "Edit Item" : "Add New Item"}</DialogTitle>
            <DialogDescription>
              {editingItem ? "Update the item details below" : "Fill in the details to add a new menu item"}
            </DialogDescription>
          </DialogHeader>
          <form id="menuItemForm" onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Masala Chai"
                required
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="price">Price (₹) *</Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  placeholder="0.00"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select
                  value={formData.category}
                  onValueChange={(v) => setFormData({ ...formData, category: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Brief description of the item..."
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="image">Product Image</Label>
              <div className="flex gap-2">
                <Input
                  id="image"
                  type="url"
                  value={formData.image.startsWith('data:') ? 'Uploaded image' : formData.image}
                  onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                  placeholder="URL or upload from device"
                  className="flex-1"
                  disabled={formData.image.startsWith('data:')}
                />
                <input
                  type="file"
                  id="imageUpload"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      handleImageUpload(file);
                    }
                    // Reset input so same file can be selected again
                    e.target.value = '';
                  }}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => document.getElementById('imageUpload')?.click()}
                  disabled={uploadingImage || !formData.name.trim()}
                  className="gap-2 shrink-0"
                >
                  {uploadingImage ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Upload className="w-4 h-4" />
                  )}
                  {uploadingImage ? 'Uploading...' : 'Upload'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={searchForImages}
                  disabled={searchingImages || !formData.name.trim()}
                  className="gap-2 shrink-0"
                >
                  {searchingImages ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Sparkles className="w-4 h-4" />
                  )}
                  AI
                </Button>
              </div>
              {formData.image.startsWith('data:') && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setFormData({ ...formData, image: '' })}
                  className="text-xs text-muted-foreground h-6 px-2"
                >
                  <X className="w-3 h-3 mr-1" /> Remove uploaded image
                </Button>
              )}
              {formData.image && (
                <div className="mt-2 relative w-20 h-20 rounded-lg overflow-hidden border">
                  <img 
                    src={formData.image} 
                    alt="Preview" 
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = "";
                      (e.target as HTMLImageElement).style.display = "none";
                    }}
                  />
                </div>
              )}
              
              {/* AI Image Picker */}
              {showImagePicker && (
                <div className="mt-3 p-3 border rounded-lg bg-secondary/30">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-sm font-medium flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-primary" />
                      AI Image Suggestions
                    </p>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowImagePicker(false)}
                      className="h-6 w-6 p-0"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                  
                  {searchingImages ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="text-center">
                        <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-primary" />
                        <p className="text-sm text-muted-foreground">Searching for "{formData.name}"...</p>
                      </div>
                    </div>
                  ) : imageResults.length > 0 ? (
                    <div className="grid grid-cols-3 gap-2">
                      {imageResults.map((img) => (
                        <button
                          key={img.id}
                          type="button"
                          onClick={() => selectImage(img.url)}
                          className="relative aspect-square rounded-lg overflow-hidden border-2 border-transparent hover:border-primary transition-all hover:scale-105"
                        >
                          <img
                            src={img.thumb || img.url}
                            alt={img.alt}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-black/0 hover:bg-black/20 transition-all flex items-center justify-center">
                            <Check className="w-6 h-6 text-white opacity-0 hover:opacity-100 drop-shadow-lg" />
                          </div>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No images found. Try a different product name.
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground mt-2 text-center">
                    Click an image to select it
                  </p>
                </div>
              )}
            </div>

            <div className="space-y-4 pt-2 border-t">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Unlimited Stock</Label>
                  <p className="text-xs text-muted-foreground">
                    For items like tea, coffee that don&apos;t have fixed quantity
                  </p>
                </div>
                <Switch
                  checked={formData.unlimitedStock}
                  onCheckedChange={(checked) => setFormData({ ...formData, unlimitedStock: checked })}
                />
              </div>

              {!formData.unlimitedStock && (
                <div className="space-y-2">
                  <Label htmlFor="stock">Stock Quantity</Label>
                  <Input
                    id="stock"
                    type="number"
                    value={formData.stock}
                    onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                    placeholder="0"
                  />
                </div>
              )}

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Available for Sale</Label>
                  <p className="text-xs text-muted-foreground">
                    Toggle to show/hide this item from menu
                  </p>
                </div>
                <Switch
                  checked={formData.isAvailable}
                  onCheckedChange={(checked) => setFormData({ ...formData, isAvailable: checked })}
                />
              </div>
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button type="button" variant="outline" onClick={closeDialog}>
                Cancel
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    Saving...
                  </>
                ) : editingItem ? (
                  "Update Item"
                ) : (
                  "Add Item"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete Item</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &quot;{deletingItem?.name}&quot;? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
