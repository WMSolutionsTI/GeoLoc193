import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { Header } from "@/components/shared/header";
import { GeolocSidebar } from "@/components/dashboard/geoloc-sidebar";

export default async function GeolocLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  // Check if user has access to GeoLoc193
  const allowedApps = session.user.allowedApps || [];
  if (!allowedApps.includes("geoloc193")) {
    redirect("/workspace");
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <GeolocSidebar />
      <div className="flex-1 flex flex-col">
        <Header />
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
