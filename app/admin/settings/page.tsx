"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Save, Settings as SettingsIcon, Smartphone } from "lucide-react";

export default function SettingsPage() {
  const [upiId, setUpiId] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    setLoading(true);
    try {
      // TODO: Implement settings save
      await new Promise((resolve) => setTimeout(resolve, 500));
      toast.success("Settings saved successfully!");
    } catch (error) {
      toast.error("Failed to save settings");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-3xl">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground mt-1">Manage system configuration</p>
      </div>

      <Card className="animate-slide-up">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Smartphone className="w-5 h-5 text-primary" />
            <CardTitle>Payment Settings</CardTitle>
          </div>
          <CardDescription>
            Configure UPI ID for receiving payments
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">UPI ID</label>
            <Input
              placeholder="yourname@paytm"
              value={upiId}
              onChange={(e) => setUpiId(e.target.value)}
            />
            <p className="text-sm text-muted-foreground">
              This UPI ID will be shown to customers for payment
            </p>
          </div>
          <Button onClick={handleSave} disabled={loading} className="gap-2">
            <Save className="w-4 h-4" />
            {loading ? "Saving..." : "Save Settings"}
          </Button>
        </CardContent>
      </Card>

      <Card className="animate-slide-up" style={{ animationDelay: "50ms" }}>
        <CardHeader>
          <div className="flex items-center gap-2">
            <SettingsIcon className="w-5 h-5 text-primary" />
            <CardTitle>System Information</CardTitle>
          </div>
          <CardDescription>
            Application details and version
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between py-2 border-b">
            <span className="text-sm font-medium">Application</span>
            <span className="text-sm text-muted-foreground">Veer's Canteen</span>
          </div>
          <div className="flex justify-between py-2 border-b">
            <span className="text-sm font-medium">Version</span>
            <span className="text-sm text-muted-foreground">1.0.0</span>
          </div>
          <div className="flex justify-between py-2">
            <span className="text-sm font-medium">Database</span>
            <span className="text-sm text-muted-foreground">MongoDB</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
