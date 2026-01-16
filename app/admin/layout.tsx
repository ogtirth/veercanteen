import { auth } from "@/auth";
import { redirect } from "next/navigation";
import AdminLayoutClient from "./layout-client";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login?callbackUrl=/admin");
  }

  if (!(session.user as any).isAdmin) {
    redirect("/");
  }

  return <AdminLayoutClient>{children}</AdminLayoutClient>;
}
