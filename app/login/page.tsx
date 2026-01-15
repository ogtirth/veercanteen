"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Header from "@/components/Header";
import { login } from "@/lib/auth-actions";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Mail, 
  Lock, 
  LogIn, 
  Eye, 
  EyeOff,
  ArrowRight,
  Sparkles,
  UtensilsCrossed,
  Loader2
} from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const result = await login({ email, password });

      if (result.success) {
        toast.success("Welcome back!");
        window.location.href = "/menu";
      } else {
        toast.error(result.error || "Login failed");
      }
    } catch (error) {
      toast.error("An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Header />
      <main className="min-h-[calc(100vh-80px)] flex items-center justify-center p-4 relative overflow-hidden">
        {/* Background Elements */}
        <div className="absolute inset-0 bg-gradient-to-br from-orange-50 via-white to-amber-50" />
        <div className="absolute top-20 -right-32 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-blob" />
        <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl animate-blob" style={{ animationDelay: "2s" }} />
        
        {/* Floating Icons */}
        <div className="absolute top-1/4 left-1/4 text-primary/20 animate-float" style={{ animationDelay: "0s" }}>
          <UtensilsCrossed className="w-12 h-12" />
        </div>
        <div className="absolute bottom-1/4 right-1/4 text-amber-500/20 animate-float" style={{ animationDelay: "1s" }}>
          <Sparkles className="w-10 h-10" />
        </div>

        <Card className="w-full max-w-md relative z-10 border-0 shadow-card animate-scale-in">
          <CardHeader className="text-center pb-2">
            <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-primary to-amber-500 rounded-2xl flex items-center justify-center shadow-glow">
              <LogIn className="w-8 h-8 text-white" />
            </div>
            <CardTitle className="text-2xl font-bold">Welcome Back</CardTitle>
            <CardDescription>
              Sign in to your Veer Canteen account
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2 animate-slide-up" style={{ animationDelay: "100ms" }}>
                <label className="text-sm font-medium">Email or Username</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    type="text"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="pl-10"
                    placeholder="you@example.com"
                  />
                </div>
              </div>

              <div className="space-y-2 animate-slide-up" style={{ animationDelay: "200ms" }}>
                <label className="text-sm font-medium">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="pl-10 pr-10"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full h-12 text-base font-semibold gap-2 animate-slide-up"
                style={{ animationDelay: "300ms" }}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  <>
                    Sign In
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </Button>
            </form>

            <div className="mt-6 text-center animate-slide-up" style={{ animationDelay: "400ms" }}>
              <p className="text-sm text-muted-foreground">
                Don't have an account?{" "}
                <Link 
                  href="/register" 
                  className="text-primary font-semibold hover:underline inline-flex items-center gap-1"
                >
                  Create Account
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </p>
            </div>

            {/* Demo Credentials */}
            <div className="mt-6 pt-6 border-t animate-slide-up" style={{ animationDelay: "500ms" }}>
              <p className="text-xs text-center text-muted-foreground mb-2">Demo Admin Credentials</p>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="flex-1 text-xs"
                  onClick={() => {
                    setEmail("admin@veer");
                    setPassword("admin@veer");
                  }}
                >
                  Use Admin Login
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </>
  );
}
