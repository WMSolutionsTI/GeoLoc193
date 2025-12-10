"use client";

import { useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { LogOut, User, Flame, Home, Edit2, Check, X } from "lucide-react";
import Link from "next/link";

export function Header() {
  const { data: session, update } = useSession();
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState("");
  const [isSaving, setIsSaving] = useState(false);

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

  const handleStartEdit = () => {
    setEditedName(session?.user?.name || "");
    setIsEditingName(true);
  };

  const handleSaveName = async () => {
    if (!session?.user?.id || !editedName.trim()) return;
    
    setIsSaving(true);
    try {
      const response = await fetch(`/api/users/${session.user.id}/name`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: editedName.trim() }),
      });

      if (response.ok) {
        // Update session with new name
        await update({ name: editedName.trim() });
        setIsEditingName(false);
      }
    } catch (error) {
      console.error("Error updating name:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setIsEditingName(false);
    setEditedName("");
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
              <DropdownMenuContent className="w-64" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-2">
                    {isEditingName ? (
                      <div className="flex items-center gap-1">
                        <Input
                          value={editedName}
                          onChange={(e) => setEditedName(e.target.value)}
                          className="h-8 text-sm"
                          placeholder="Seu nome"
                          autoFocus
                          disabled={isSaving}
                        />
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8"
                          onClick={handleSaveName}
                          disabled={isSaving || !editedName.trim()}
                        >
                          <Check className="h-4 w-4 text-green-600" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8"
                          onClick={handleCancelEdit}
                          disabled={isSaving}
                        >
                          <X className="h-4 w-4 text-red-600" />
                        </Button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium flex-1">{session.user.name}</p>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-6 w-6"
                          onClick={handleStartEdit}
                        >
                          <Edit2 className="h-3 w-3" />
                        </Button>
                      </div>
                    )}
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