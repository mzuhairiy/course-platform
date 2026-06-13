import { Navbar } from "@/components/shared/navbar";
import { Toaster } from "@/components/ui/sonner";
import { getCurrentUser } from "@/lib/auth";
import { getNavCategories } from "@/server/services/category";
import { getNavUser } from "@/server/services/user";

export default async function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const sessionUser = await getCurrentUser();
  const [user, categories] = await Promise.all([
    sessionUser ? getNavUser(sessionUser.id) : null,
    getNavCategories(),
  ]);

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar user={user} categories={categories} />
      <main className="flex-1 bg-surface">{children}</main>
      <Toaster />
    </div>
  );
}
