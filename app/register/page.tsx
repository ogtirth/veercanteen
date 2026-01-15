"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Header from "@/components/Header";
import { register } from "@/lib/auth-actions";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  User, 
  Mail, 
  Lock, 
  UserPlus, 
  Eye, 
  EyeOff,
  ArrowRight,
  Sparkles,
  UtensilsCrossed,
  Loader2,
  Check
} from "lucide-react";

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    name: "",
  });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const result = await register(formData);

      if (result.success) {
        toast.success("Account created! Please login.");
        router.push("/login");
      } else {
        toast.error(result.error || "Registration failed");
      }
    } catch (error) {
      toast.error("An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const passwordStrength = formData.password.length >= 6;

  return (
    <>
      <Header />
      <main className="min-h-[calc(100vh-80px)] flex items-center justify-center p-4 relative overflow-hidden">
        {/* Background Elements */}
        <div className="absolute inset-0 bg-gradient-to-br from-orange-50 via-white to-amber-50" />
        <div className="absolute top-20 -left-32 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-blob" />
        <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl animate-blob" style={{ animationDelay: "2s" }} />
        
        {/* Floating Icons */}
        <div className="absolute top-1/4 right-1/4 text-primary/20 animate-float" style={{ animationDelay: "0s" }}>
          <UtensilsCrossed className="w-12 h-12" />
        </div>
        <div className="absolute bottom-1/4 left-1/4 text-amber-500/20 animate-float" style={{ animationDelay: "1s" }}>
          <Sparkles className="w-10 h-10" />
        </div>

        <Card className="w-full max-w-md relative z-10 border-0 shadow-card animate-scale-in">
          <CardHeader className="text-center pb-2">
            <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-primary to-amber-500 rounded-2xl flex items-center justify-center shadow-glow">
              <UserPlus className="w-8 h-8 text-white" />
            </div>
            <CardTitle className="text-2xl font-bold">Create Account</CardTitle>
            <CardDescription>
              Join Veer Canteen today
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2 animate-slide-up" style={{ animationDelay: "100ms" }}>
                <label className="text-sm font-medium">Full Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    className="pl-10"
                    placeholder="John Doe"
                  />
                </div>
              </div>

              <div className="space-y-2 animate-slide-up" style={{ animationDelay: "200ms" }}>
                <label className="text-sm font-medium">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className="pl-10"
                    placeholder="you@example.com"
                  />
                </div>
              </div>

              <div className="space-y-2 animate-slide-up" style={{ animationDelay: "300ms" }}>
                <label className="text-sm font-medium">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                    minLength={6}
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
                {formData.password && (
                  <div className={`flex items-center gap-1 text-xs ${passwordStrength ? "text-green-600" : "text-amber-600"}`}>
                    {passwordStrength ? <Check className="w-3 h-3" /> : null}
                    {passwordStrength ? "Strong password" : "Minimum 6 characters required"}
                  </div>
                )}
              </div>

              <Button
                type="submit"
                disabled={loading || !passwordStrength}
                className="w-full h-12 text-base font-semibold gap-2 animate-slide-up"
                style={{ animationDelay: "400ms" }}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Creating account...
                  </>
                ) : (
                  <>
                    Create Account
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </Button>
            </form>

            <div className="mt-6 text-center animate-slide-up" style={{ animationDelay: "500ms" }}>
              <p className="text-sm text-muted-foreground">
                Already have an account?{" "}
                <Link 
                  href="/login" 
                  className="text-primary font-semibold hover:underline inline-flex items-center gap-1"
                >
                  Sign In
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </main>
    </>
  );
}
