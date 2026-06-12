import { Navbar } from "@/components/shared/navbar";
import { getCurrentUser } from "@/lib/auth";

export default async function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar user={user} />
      <main className="flex-1 bg-surface">{children}</main>
    </div>
  );
}
