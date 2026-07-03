import { AppLayout } from "@/components/layout/AppLayout";
import { getSession } from "@/lib/session";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  
  return <AppLayout user={session}>{children}</AppLayout>;
}
