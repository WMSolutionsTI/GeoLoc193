"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Header } from "@/components/shared/header";
import {
  Loader2,
  Plus,
  Pencil,
  Trash2,
  Users,
  ArrowLeft,
  Check,
} from "lucide-react";
import Link from "next/link";

// Available apps
const availableApps = [
  { slug: "geoloc193", name: "GeoLoc193" },
  { slug: "viaturas", name: "Controle de Viaturas" },
  { slug: "contingencia", name: "Modo de Contingência" },
  { slug: "chat", name: "Chat Interno" },
  { slug: "headsets", name: "Controle de Headsets" },
  { slug: "info-cobom", name: "App Informações COBOM" },
  { slug: "agenda", name: "Agenda COBOM" },
  { slug: "gestao-dejem", name: "Gestão DEJEM" },
  { slug: "mapa-offline", name: "Mapa OFFLINE" },
  { slug: "auditoria", name: "Auditoria de Ligações" },
];

type User = {
  id: number;
  name: string;
  username: string;
  role: string;
  pa: string | null;
  active: boolean;
  allowedApps: string[];
};

type UserFormData = {
  name: string;
  username: string;
  password: string;
  role: string;
  pa: string;
  allowedApps: string[];
};

const initialFormData: UserFormData = {
  name: "",
  username: "",
  password: "",
  role: "ATENDENTE",
  pa: "",
  allowedApps: [],
};

export default function AdminUsuariosPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [formData, setFormData] = useState<UserFormData>(initialFormData);
  const [saving, setSaving] = useState(false);

  const fetchUsers = useCallback(async () => {
    try {
      const response = await fetch("/api/users");
      if (response.ok) {
        const data = await response.json();
        setUsers(data);
      }
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    } else if (status === "authenticated" && session?.user?.role !== "ADMINISTRADOR") {
      router.push("/workspace");
    }
  }, [status, session, router]);

  useEffect(() => {
    if (session?.user?.role === "ADMINISTRADOR") {
      fetchUsers();
    }
  }, [session, fetchUsers]);

  const handleOpenDialog = (user?: User) => {
    if (user) {
      setEditingUser(user);
      setFormData({
        name: user.name,
        username: user.username,
        password: "",
        role: user.role,
        pa: user.pa || "",
        allowedApps: user.allowedApps || [],
      });
    } else {
      setEditingUser(null);
      setFormData(initialFormData);
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingUser(null);
    setFormData(initialFormData);
  };

  const handleAppToggle = (appSlug: string) => {
    setFormData((prev) => ({
      ...prev,
      allowedApps: prev.allowedApps.includes(appSlug)
        ? prev.allowedApps.filter((a) => a !== appSlug)
        : [...prev.allowedApps, appSlug],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const url = editingUser
        ? `/api/users/${editingUser.id}`
        : "/api/users";
      const method = editingUser ? "PUT" : "POST";

      const body = {
        ...formData,
        // Only include password if it's provided (for editing)
        ...(editingUser && !formData.password
          ? {}
          : { password: formData.password }),
      };

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (response.ok) {
        await fetchUsers();
        handleCloseDialog();
      } else {
        const error = await response.json();
        alert(error.error || "Erro ao salvar usuário");
      }
    } catch (error) {
      console.error("Error saving user:", error);
      alert("Erro ao salvar usuário");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteClick = (user: User) => {
    setUserToDelete(user);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!userToDelete) return;

    try {
      const response = await fetch(`/api/users/${userToDelete.id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        await fetchUsers();
      } else {
        const error = await response.json();
        alert(error.error || "Erro ao excluir usuário");
      }
    } catch (error) {
      console.error("Error deleting user:", error);
      alert("Erro ao excluir usuário");
    } finally {
      setDeleteDialogOpen(false);
      setUserToDelete(null);
    }
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case "ADMINISTRADOR":
        return "destructive";
      case "SUPERVISOR":
        return "secondary";
      default:
        return "outline";
    }
  };

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!session || session.user.role !== "ADMINISTRADOR") {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link href="/workspace">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Gerenciar Usuários
              </h1>
              <p className="text-muted-foreground">
                Criar, editar e gerenciar usuários do sistema
              </p>
            </div>
          </div>
          <Button onClick={() => handleOpenDialog()}>
            <Plus className="h-4 w-4 mr-2" />
            Novo Usuário
          </Button>
        </div>

        {/* Users Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Usuários ({users.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">
                      Nome
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">
                      Usuário
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">
                      Papel
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">
                      PA
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">
                      Apps
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">
                      Status
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4 font-medium">{user.name}</td>
                      <td className="py-3 px-4">{user.username}</td>
                      <td className="py-3 px-4">
                        <Badge variant={getRoleBadgeVariant(user.role)}>
                          {user.role}
                        </Badge>
                      </td>
                      <td className="py-3 px-4">{user.pa || "-"}</td>
                      <td className="py-3 px-4">
                        <span className="text-sm text-muted-foreground">
                          {user.allowedApps?.length || 0} app(s)
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <Badge variant={user.active ? "success" : "secondary"}>
                          {user.active ? "Ativo" : "Inativo"}
                        </Badge>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleOpenDialog(user)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteClick(user)}
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* User Form Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingUser ? "Editar Usuário" : "Novo Usuário"}
              </DialogTitle>
              <DialogDescription>
                {editingUser
                  ? "Edite as informações do usuário"
                  : "Preencha as informações para criar um novo usuário"}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
              <div className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nome Completo</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="username">Nome de Usuário</Label>
                    <Input
                      id="username"
                      value={formData.username}
                      onChange={(e) =>
                        setFormData({ ...formData, username: e.target.value })
                      }
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="password">
                      Senha {editingUser && "(deixe em branco para manter)"}
                    </Label>
                    <Input
                      id="password"
                      type="password"
                      value={formData.password}
                      onChange={(e) =>
                        setFormData({ ...formData, password: e.target.value })
                      }
                      required={!editingUser}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="pa">Posto de Atendimento</Label>
                    <Input
                      id="pa"
                      value={formData.pa}
                      onChange={(e) =>
                        setFormData({ ...formData, pa: e.target.value })
                      }
                      placeholder="Ex: PA-01"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="role">Papel</Label>
                  <Select
                    value={formData.role}
                    onValueChange={(value) =>
                      setFormData({ ...formData, role: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o papel" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ATENDENTE">Atendente</SelectItem>
                      <SelectItem value="SUPERVISOR">Supervisor</SelectItem>
                      <SelectItem value="ADMINISTRADOR">Administrador</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Aplicativos Permitidos</Label>
                  <div className="grid grid-cols-2 gap-2 border rounded-lg p-4">
                    {availableApps.map((app) => (
                      <div
                        key={app.slug}
                        className={`flex items-center gap-2 p-2 rounded cursor-pointer transition-colors ${
                          formData.allowedApps.includes(app.slug)
                            ? "bg-primary/10 border border-primary"
                            : "border border-gray-200 hover:bg-gray-50"
                        }`}
                        onClick={() => handleAppToggle(app.slug)}
                      >
                        <div
                          className={`w-5 h-5 rounded border flex items-center justify-center ${
                            formData.allowedApps.includes(app.slug)
                              ? "bg-primary border-primary"
                              : "border-gray-300"
                          }`}
                        >
                          {formData.allowedApps.includes(app.slug) && (
                            <Check className="h-3 w-3 text-white" />
                          )}
                        </div>
                        <span className="text-sm">{app.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCloseDialog}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={saving}>
                  {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  {editingUser ? "Salvar Alterações" : "Criar Usuário"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
              <AlertDialogDescription>
                Tem certeza que deseja excluir o usuário{" "}
                <strong>{userToDelete?.name}</strong>? Esta ação não pode ser
                desfeita.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteConfirm}
                className="bg-red-500 hover:bg-red-600"
              >
                Excluir
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </main>
    </div>
  );
}
