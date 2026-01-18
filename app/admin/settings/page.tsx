"use client";

import { useEffect, useState } from "react";
import { getSettings, updateSettings } from "@/lib/admin-actions";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import {
  Settings,
  CreditCard,
  Save,
  QrCode,
  Building,
  Phone,
  Mail,
  MapPin,
  Clock,
  CheckCircle,
  AlertCircle,
  Loader2,
  Send,
  FileText
} from "lucide-react";

interface SettingsData {
  upiId: string;
  businessName: string;
  phone: string;
  email: string;
  address: string;
  openingTime: string;
  closingTime: string;
  reportEmail: string;
  smtpHost: string;
  smtpPort: string;
  smtpUser: string;
  smtpPass: string;
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<SettingsData>({
    upiId: "",
    businessName: "",
    phone: "",
    email: "",
    address: "",
    openingTime: "09:00",
    closingTime: "21:00",
    reportEmail: "",
    smtpHost: "",
    smtpPort: "587",
    smtpUser: "",
    smtpPass: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testingEmail, setTestingEmail] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const result = await getSettings();
      if (result.success && result.data) {
        setSettings({
          upiId: result.data.upiId || "",
          businessName: result.data.businessName || "",
          phone: result.data.phone || "",
          email: result.data.email || "",
          address: result.data.address || "",
          openingTime: result.data.openingTime || "09:00",
          closingTime: result.data.closingTime || "21:00",
          reportEmail: result.data.reportEmail || "",
          smtpHost: result.data.smtpHost || "",
          smtpPort: result.data.smtpPort || "587",
          smtpUser: result.data.smtpUser || "",
          smtpPass: result.data.smtpPass || "",
        });
      }
    } catch (error) {
      toast.error("Failed to load settings");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const result = await updateSettings(settings);
      if (result.success) {
        toast.success("Settings saved successfully!");
      } else {
        console.error("Settings save error:", result.error);
        toast.error(result.error || "Failed to save settings");
      }
    } catch (error) {
      console.error("Settings save exception:", error);
      toast.error("Something went wrong");
    } finally {
      setSaving(false);
    }
  };

  const handleTestEmail = async () => {
    if (!settings.reportEmail || !settings.smtpHost || !settings.smtpUser || !settings.smtpPass) {
      toast.error("Please fill in all email settings first");
      return;
    }

    setTestingEmail(true);
    try {
      const response = await fetch('/api/admin/test-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const result = await response.json();
      
      if (result.success) {
        toast.success("Test email sent successfully!");
      } else {
        toast.error(result.error || "Failed to send test email");
      }
    } catch (error) {
      toast.error("Failed to send test email");
    } finally {
      setTestingEmail(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="animate-slide-up">
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground mt-1">
          Configure your canteen settings
        </p>
      </div>

      {/* Payment Settings */}
      <Card className="animate-slide-up" style={{ animationDelay: "100ms" }}>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
              <CreditCard className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <CardTitle>Payment Settings</CardTitle>
              <CardDescription>Configure UPI payment options</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              UPI ID
            </label>
            <div className="relative">
              <QrCode className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                placeholder="example@upi"
                value={settings.upiId}
                onChange={(e) => setSettings({ ...settings, upiId: e.target.value })}
                className="pl-10"
              />
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              This UPI ID will be used to generate QR codes for payments
            </p>
          </div>

          {settings.upiId && (
            <div className="p-4 bg-secondary/50 rounded-xl animate-fade-in">
              <div className="flex items-center gap-2 text-sm text-green-600 mb-2">
                <CheckCircle className="w-4 h-4" />
                <span className="font-medium">QR Code Preview</span>
              </div>
              <div className="flex justify-center">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=upi://pay?pa=${settings.upiId}&pn=Canteen`}
                  alt="UPI QR Code"
                  className="rounded-lg"
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Business Information */}
      <Card className="animate-slide-up" style={{ animationDelay: "200ms" }}>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
              <Building className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <CardTitle>Business Information</CardTitle>
              <CardDescription>Your canteen details</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Business Name</label>
              <div className="relative">
                <Building className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  placeholder="Veer Canteen"
                  value={settings.businessName}
                  onChange={(e) => setSettings({ ...settings, businessName: e.target.value })}
                  className="pl-10"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Phone Number</label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  placeholder="+91 98765 43210"
                  value={settings.phone}
                  onChange={(e) => setSettings({ ...settings, phone: e.target.value })}
                  className="pl-10"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                placeholder="contact@canteen.com"
                value={settings.email}
                onChange={(e) => setSettings({ ...settings, email: e.target.value })}
                className="pl-10"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Address</label>
            <div className="relative">
              <MapPin className="absolute left-3 top-3 w-5 h-5 text-muted-foreground" />
              <textarea
                placeholder="123 College Road, Campus Area"
                value={settings.address}
                onChange={(e) => setSettings({ ...settings, address: e.target.value })}
                className="w-full pl-10 pr-4 py-3 border border-input rounded-xl focus:outline-none focus:ring-2 focus:ring-ring bg-background resize-none"
                rows={3}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Operating Hours */}
      <Card className="animate-slide-up" style={{ animationDelay: "300ms" }}>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
              <Clock className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <CardTitle>Operating Hours</CardTitle>
              <CardDescription>Set your canteen timings</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Opening Time</label>
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  type="time"
                  value={settings.openingTime}
                  onChange={(e) => setSettings({ ...settings, openingTime: e.target.value })}
                  className="pl-10"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Closing Time</label>
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  type="time"
                  value={settings.closingTime}
                  onChange={(e) => setSettings({ ...settings, closingTime: e.target.value })}
                  className="pl-10"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Daily Report Email Settings */}
      <Card className="animate-slide-up" style={{ animationDelay: "400ms" }}>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
              <FileText className="w-6 h-6 text-orange-600" />
            </div>
            <div>
              <CardTitle>Daily Report Settings</CardTitle>
              <CardDescription>
                Receive daily sales report at 12:00 AM IST
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Report Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                placeholder="owner@example.com"
                type="email"
                value={settings.reportEmail}
                onChange={(e) => setSettings({ ...settings, reportEmail: e.target.value })}
                className="pl-10"
              />
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Daily stats report will be sent to this email at midnight IST
            </p>
          </div>

          <div className="border-t pt-4">
            <p className="text-sm font-medium mb-3">SMTP Configuration</p>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">SMTP Host</label>
                <Input
                  placeholder="smtp.gmail.com"
                  value={settings.smtpHost}
                  onChange={(e) => setSettings({ ...settings, smtpHost: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">SMTP Port</label>
                <Input
                  placeholder="587"
                  value={settings.smtpPort}
                  onChange={(e) => setSettings({ ...settings, smtpPort: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">SMTP Username</label>
                <Input
                  placeholder="your-email@gmail.com"
                  value={settings.smtpUser}
                  onChange={(e) => setSettings({ ...settings, smtpUser: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">SMTP Password</label>
                <Input
                  type="password"
                  placeholder="App password"
                  value={settings.smtpPass}
                  onChange={(e) => setSettings({ ...settings, smtpPass: e.target.value })}
                />
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              For Gmail, use an App Password. Go to Google Account → Security → 2-Step Verification → App Passwords
            </p>
          </div>

          <Button
            variant="outline"
            onClick={handleTestEmail}
            disabled={testingEmail || !settings.reportEmail}
            className="gap-2"
          >
            {testingEmail ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                Send Test Email
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end animate-slide-up" style={{ animationDelay: "500ms" }}>
        <Button
          size="lg"
          onClick={handleSave}
          disabled={saving}
          className="gap-2"
        >
          {saving ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="w-5 h-5" />
              Save Settings
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
