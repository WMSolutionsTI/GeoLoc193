"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  ClipboardList,
  Users,
  BarChart3,
  PlusCircle,
  Flame,
} from "lucide-react";

type NavItem = {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  roles?: string[];
};

const navItems: NavItem[] = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Nova Solicitação",
    href: "/atendente/nova",
    icon: PlusCircle,
    roles: ["atendente", "supervisor"],
  },
  {
    title: "Solicitações",
    href: "/atendente",
    icon: ClipboardList,
    roles: ["atendente", "supervisor"],
  },
  {
    title: "Estatísticas",
    href: "/supervisor",
    icon: BarChart3,
    roles: ["supervisor"],
  },
  {
    title: "Usuários",
    href: "/supervisor/usuarios",
    icon: Users,
    roles: ["supervisor"],
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const userRole = session?.user?.role || "";

  const filteredItems = navItems.filter(
    (item) => !item.roles || item.roles.includes(userRole)
  );

  return (
    <aside className="w-64 min-h-screen bg-white border-r border-gray-200 flex flex-col">
      <div className="p-6 border-b border-gray-200">
        <Link href="/dashboard" className="flex items-center gap-3">
          <div className="bg-primary rounded-lg p-2">
            <Flame className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-lg text-primary">GeoLoc193</h1>
            <p className="text-xs text-muted-foreground">Corpo de Bombeiros</p>
          </div>
        </Link>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {filteredItems.map((item) => {
          const isActive = pathname === item.href || 
            (item.href !== "/dashboard" && pathname.startsWith(item.href));
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary text-white"
                  : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.title}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-gray-200">
        <div className="bg-orange-50 rounded-lg p-4">
          <p className="text-xs text-orange-800 font-medium">
            Emergência: Ligue 193
          </p>
        </div>
      </div>
    </aside>
  );
}
