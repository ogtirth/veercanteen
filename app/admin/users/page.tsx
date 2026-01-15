"use client";

import { useEffect, useState } from "react";
import { getAllUsers, toggleUserActive, updateUserRole } from "@/lib/admin-actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Search,
  Users,
  Shield,
  ShieldCheck,
  User,
  Mail,
  Calendar,
  ToggleLeft,
  ToggleRight,
  UserCheck,
  UserX,
  Crown,
  AlertTriangle
} from "lucide-react";

interface UserData {
  id: string;
  name: string;
  email: string;
  isAdmin: boolean;
  isActive: boolean;
  createdAt: string;
  _count?: { orders: number };
}

export default function UsersPage() {
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const result = await getAllUsers();
      if (result.success) {
        setUsers(result.data as any);
      }
    } catch (error) {
      toast.error("Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async (userId: string, currentStatus: boolean) => {
    try {
      const result = await toggleUserActive(userId);
      if (result.success) {
        toast.success(`User ${currentStatus ? "deactivated" : "activated"}`);
        loadUsers();
      } else {
        toast.error(result.error || "Failed to update user");
      }
    } catch (error) {
      toast.error("Something went wrong");
    }
  };

  const handleRoleChange = async (userId: string, isCurrentlyAdmin: boolean) => {
    try {
      const newRole = isCurrentlyAdmin ? "user" : "admin";
      const result = await updateUserRole(userId, newRole);
      if (result.success) {
        toast.success(`Role updated to ${newRole}`);
        loadUsers();
      } else {
        toast.error(result.error || "Failed to update role");
      }
    } catch (error) {
      toast.error("Something went wrong");
    }
  };

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === "all" || 
      (roleFilter === "admin" && user.isAdmin) || 
      (roleFilter === "user" && !user.isAdmin);
    return matchesSearch && matchesRole;
  });

  const stats = {
    total: users.length,
    admin: users.filter((u) => u.isAdmin).length,
    active: users.filter((u) => u.isActive).length,
    inactive: users.filter((u) => !u.isActive).length,
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading users...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="animate-slide-up">
        <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
        <p className="text-muted-foreground mt-1">
          Manage user accounts and permissions
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="animate-slide-up" style={{ animationDelay: "100ms" }}>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.total}</p>
              <p className="text-sm text-muted-foreground">Total Users</p>
            </div>
          </CardContent>
        </Card>
        <Card className="animate-slide-up" style={{ animationDelay: "150ms" }}>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center">
              <Crown className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.admin}</p>
              <p className="text-sm text-muted-foreground">Admins</p>
            </div>
          </CardContent>
        </Card>
        <Card className="animate-slide-up" style={{ animationDelay: "200ms" }}>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
              <UserCheck className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.active}</p>
              <p className="text-sm text-muted-foreground">Active</p>
            </div>
          </CardContent>
        </Card>
        <Card className="animate-slide-up" style={{ animationDelay: "250ms" }}>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-red-100 flex items-center justify-center">
              <UserX className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.inactive}</p>
              <p className="text-sm text-muted-foreground">Inactive</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search & Filter */}
      <Card className="animate-slide-up" style={{ animationDelay: "300ms" }}>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                placeholder="Search users..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="px-4 py-2 h-11 border border-input rounded-xl focus:outline-none focus:ring-2 focus:ring-ring bg-background"
            >
              <option value="all">All Roles</option>
              <option value="admin">Admin</option>
              <option value="user">User</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Users Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredUsers.map((user, index) => (
          <Card
            key={user.id}
            className={`overflow-hidden hover:shadow-card transition-all duration-200 animate-slide-up ${
              !user.isActive ? "opacity-60" : ""
            }`}
            style={{ animationDelay: `${(index + 6) * 50}ms` }}
          >
            <CardContent className="p-4">
              {/* User Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                    user.isAdmin 
                      ? "bg-gradient-to-br from-purple-500 to-pink-500" 
                      : "bg-gradient-to-br from-primary to-primary/70"
                  }`}>
                    {user.isAdmin ? (
                      <ShieldCheck className="w-6 h-6 text-white" />
                    ) : (
                      <User className="w-6 h-6 text-white" />
                    )}
                  </div>
                  <div>
                    <h3 className="font-semibold truncate max-w-[150px]">{user.name || "Unnamed"}</h3>
                    <Badge variant={user.isAdmin ? "default" : "secondary"} className="text-xs">
                      {user.isAdmin ? (
                        <Crown className="w-3 h-3 mr-1" />
                      ) : (
                        <User className="w-3 h-3 mr-1" />
                      )}
                      {user.isAdmin ? "Admin" : "User"}
                    </Badge>
                  </div>
                </div>
                <Badge variant={user.isActive ? "success" : "destructive"}>
                  {user.isActive ? "Active" : "Inactive"}
                </Badge>
              </div>

              {/* User Info */}
              <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Mail className="w-4 h-4" />
                  <span className="truncate">{user.email}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="w-4 h-4" />
                  <span>Joined {new Date(user.createdAt).toLocaleDateString()}</span>
                </div>
                {user._count && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Shield className="w-4 h-4" />
                    <span>{user._count.orders} orders</span>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-4 border-t">
                <Button
                  variant={user.isActive ? "outline" : "default"}
                  size="sm"
                  className="flex-1 gap-2"
                  onClick={() => handleToggleActive(user.id, user.isActive)}
                >
                  {user.isActive ? (
                    <>
                      <ToggleRight className="w-4 h-4" />
                      Deactivate
                    </>
                  ) : (
                    <>
                      <ToggleLeft className="w-4 h-4" />
                      Activate
                    </>
                  )}
                </Button>
                <Button
                  variant={user.isAdmin ? "secondary" : "outline"}
                  size="sm"
                  className="flex-1 gap-2"
                  onClick={() => handleRoleChange(user.id, user.isAdmin)}
                >
                  <Shield className="w-4 h-4" />
                  {user.isAdmin ? "Remove Admin" : "Make Admin"}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredUsers.length === 0 && (
        <div className="text-center py-16">
          <Users className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
          <p className="text-muted-foreground">No users found</p>
        </div>
      )}
    </div>
  );
}
