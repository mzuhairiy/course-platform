import { Footer } from "@/components/shared/footer";
import { Navbar } from "@/components/shared/navbar";
import { getCurrentUser } from "@/lib/auth";
import { getNavCategories } from "@/server/services/category";
import { getNavUser } from "@/server/services/user";

export default async function MarketingLayout({
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
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
