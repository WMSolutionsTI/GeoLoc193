"use client";

import { useSession, signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { LogOut, User, Flame, Home } from "lucide-react";
import Link from "next/link";

export function Header() {
  const { data: session } = useSession();

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const getRoleLabel = (role: string) => {
    const labels: Record<string, string> = {
      ADMINISTRADOR: "Administrador",
      SUPERVISOR: "Supervisor",
      ATENDENTE: "Atendente",
    };
    return labels[role] || role;
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white shadow-sm">
      <div className="container flex h-16 items-center justify-between">
        <Link href="/workspace" className="flex items-center gap-2">
          <div className="bg-primary rounded-lg p-2">
            <Flame className="h-6 w-6 text-white" />
          </div>
          <span className="font-bold text-xl text-primary">
            Painel COBOM
          </span>
        </Link>

        {session?.user && (
          <div className="flex items-center gap-4">
            <Link href="/workspace">
              <Button variant="ghost" size="sm" className="hidden md:flex">
                <Home className="h-4 w-4 mr-2" />
                Painel
              </Button>
            </Link>
            <span className="text-sm text-muted-foreground hidden md:block">
              {getRoleLabel(session.user.role)} | PA: {session.user.pa || "Não definido"}
            </span>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-primary text-white">
                      {session.user.name ?  getInitials(session.user.name) : "U"}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium">{session.user.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {getRoleLabel(session.user.role)}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/workspace">
                    <Home className="mr-2 h-4 w-4" />
                    <span>Painel</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <User className="mr-2 h-4 w-4" />
                  <span>Perfil</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => signOut({ callbackUrl: "/login" })}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Sair</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
      </div>
    </header>
  );
}