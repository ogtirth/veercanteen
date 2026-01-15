"use client";

import Header from "@/components/Header";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  User,
  Mail,
  Shield,
  ShieldCheck,
  Calendar,
  LogOut,
  ShoppingBag,
  Settings,
  ArrowRight,
  Crown
} from "lucide-react";

export default function ProfilePage() {
  const { data: session } = useSession();
  const isAdmin = (session?.user as any)?.isAdmin;

  return (
    <>
      <Header />
      <main className="container max-w-2xl py-8 pb-16">
        {/* Header */}
        <div className="text-center mb-8 animate-slide-up">
          <div className="w-24 h-24 mx-auto mb-4 bg-gradient-to-br from-primary to-amber-500 rounded-full flex items-center justify-center shadow-glow">
            {isAdmin ? (
              <ShieldCheck className="w-12 h-12 text-white" />
            ) : (
              <User className="w-12 h-12 text-white" />
            )}
          </div>
          <h1 className="text-3xl font-bold">{session?.user?.name || "User"}</h1>
          <Badge variant={isAdmin ? "default" : "secondary"} className="mt-2 gap-1">
            {isAdmin ? <Crown className="w-3 h-3" /> : <User className="w-3 h-3" />}
            {isAdmin ? "Administrator" : "Customer"}
          </Badge>
        </div>

        {/* Profile Info Card */}
        <Card className="mb-6 animate-slide-up" style={{ animationDelay: "100ms" }}>
          <CardHeader>
            <CardTitle className="text-lg">Profile Information</CardTitle>
            <CardDescription>Your account details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4 p-3 bg-secondary/50 rounded-xl">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Mail className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Email</p>
                <p className="font-medium">{session?.user?.email}</p>
              </div>
            </div>

            <div className="flex items-center gap-4 p-3 bg-secondary/50 rounded-xl">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <User className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Name</p>
                <p className="font-medium">{session?.user?.name || "Not set"}</p>
              </div>
            </div>

            <div className="flex items-center gap-4 p-3 bg-secondary/50 rounded-xl">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Shield className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Role</p>
                <p className="font-medium">{isAdmin ? "Administrator" : "Customer"}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Links */}
        <Card className="mb-6 animate-slide-up" style={{ animationDelay: "200ms" }}>
          <CardHeader>
            <CardTitle className="text-lg">Quick Links</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Link href="/my-orders">
              <div className="flex items-center justify-between p-3 bg-secondary/50 rounded-xl hover:bg-secondary transition cursor-pointer">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                    <ShoppingBag className="w-5 h-5 text-blue-600" />
                  </div>
                  <span className="font-medium">My Orders</span>
                </div>
                <ArrowRight className="w-5 h-5 text-muted-foreground" />
              </div>
            </Link>

            {isAdmin && (
              <Link href="/admin">
                <div className="flex items-center justify-between p-3 bg-secondary/50 rounded-xl hover:bg-secondary transition cursor-pointer">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                      <Settings className="w-5 h-5 text-purple-600" />
                    </div>
                    <span className="font-medium">Admin Dashboard</span>
                  </div>
                  <ArrowRight className="w-5 h-5 text-muted-foreground" />
                </div>
              </Link>
            )}
          </CardContent>
        </Card>

        {/* Logout */}
        <div className="animate-slide-up" style={{ animationDelay: "300ms" }}>
          <Button
            variant="outline"
            className="w-full h-12 gap-2 text-destructive hover:text-destructive hover:bg-destructive/10"
            onClick={() => signOut({ callbackUrl: "/login" })}
          >
            <LogOut className="w-5 h-5" />
            Sign Out
          </Button>
        </div>
      </main>
    </>
  );
}
