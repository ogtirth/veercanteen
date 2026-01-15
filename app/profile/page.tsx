"use client";

import Header from "@/components/Header";
import { useSession } from "next-auth/react";

export default function ProfilePage() {
  const { data: session } = useSession();

  return (
    <>
      <Header />
      <main className="container max-w-2xl py-16">
        <h1 className="text-3xl font-bold mb-8">My Profile</h1>

        <div className="border rounded-lg p-8 bg-card space-y-6">
          <div>
            <label className="block text-sm text-muted-foreground mb-2">
              Email
            </label>
            <p className="text-lg font-medium">{session?.user?.email}</p>
          </div>

          <div>
            <label className="block text-sm text-muted-foreground mb-2">
              Name
            </label>
            <p className="text-lg font-medium">{session?.user?.name || "-"}</p>
          </div>

          <div>
            <label className="block text-sm text-muted-foreground mb-2">
              Role
            </label>
            <p className="text-lg font-medium">
              {(session?.user as any)?.isAdmin ? "Administrator" : "Customer"}
            </p>
          </div>

          <div className="pt-4 border-t">
            <p className="text-sm text-muted-foreground">
              Account created on{" "}
              {new Date().toLocaleDateString()}
            </p>
          </div>
        </div>
      </main>
    </>
  );
}
