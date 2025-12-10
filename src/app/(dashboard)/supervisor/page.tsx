"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Loader2,
  RefreshCw,
  Users,
  ClipboardList,
  Clock,
  CheckCircle,
  BarChart3,
} from "lucide-react";
import { formatDate, getStatusLabel, getStatusColor } from "@/lib/utils";

type Solicitacao = {
  id: number;
  nomeSolicitante: string;
  telefone: string;
  pa: string | null;
  status: string | null;
  coordenadas: { latitude: number; longitude: number } | null;
  createdAt: string | null;
  updatedAt: string | null;
  atendenteName?: string | null;
  atendenteUsername?: string | null;
};

type User = {
  id: number;
  name: string;
  username: string;
  role: string;
  pa: string | null;
  active: boolean;
};

export default function SupervisorPage() {
  const [solicitacoes, setSolicitacoes] = useState<Solicitacao[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [periodFilter, setPeriodFilter] = useState<string>("today");

  const fetchData = useCallback(async () => {
    try {
      const [solResponse, usersResponse] = await Promise.all([
        fetch("/api/solicitacoes"),
        fetch("/api/users"),
      ]);

      if (solResponse.ok) {
        const data = await solResponse.json();
        setSolicitacoes(data);
      }
      if (usersResponse.ok) {
        const data = await usersResponse.json();
        setUsers(data);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [fetchData]);

  // Filter solicitacoes by period
  const filteredSolicitacoes = solicitacoes.filter((sol) => {
    if (periodFilter === "today") {
      const today = new Date().toDateString();
      const solDate = sol.createdAt ? new Date(sol.createdAt).toDateString() : "";
      return solDate === today;
    }
    return true;
  });

  // Calculate statistics with new status values
  const stats = {
    total: filteredSolicitacoes.length,
    pendentes: filteredSolicitacoes.filter((s) => s.status === "pendente").length,
    recebidas: filteredSolicitacoes.filter((s) => s.status === "recebido").length,
    finalizadas: filteredSolicitacoes.filter((s) => s.status === "finalizado").length,
  };

  // Group by status
  const byStatus = filteredSolicitacoes.reduce((acc, sol) => {
    const status = sol.status || "sem status";
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Group by atendente
  const byAtendente = filteredSolicitacoes.reduce((acc, sol) => {
    const atendente = sol.atendenteName || sol.atendenteUsername || "Não atribuído";
    acc[atendente] = (acc[atendente] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Painel do Supervisor</h1>
          <p className="text-muted-foreground">
            Visão geral de todas as solicitações e atendentes
          </p>
        </div>
        <Button onClick={fetchData} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Atualizar
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <Select value={periodFilter} onValueChange={setPeriodFilter}>
              <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue placeholder="Período" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="today">Hoje</SelectItem>
                <SelectItem value="all">Todo o período</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total</p>
                <p className="text-3xl font-bold">{stats.total}</p>
              </div>
              <div className="bg-gray-100 p-3 rounded-full">
                <BarChart3 className="h-6 w-6 text-gray-500" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pendentes</p>
                <p className="text-3xl font-bold text-blue-500">{stats.pendentes}</p>
              </div>
              <div className="bg-blue-100 p-3 rounded-full">
                <ClipboardList className="h-6 w-6 text-blue-500" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Recebidas</p>
                <p className="text-3xl font-bold text-green-500">{stats.recebidas}</p>
              </div>
              <div className="bg-green-100 p-3 rounded-full">
                <Clock className="h-6 w-6 text-green-500" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Finalizadas</p>
                <p className="text-3xl font-bold text-gray-500">{stats.finalizadas}</p>
              </div>
              <div className="bg-gray-100 p-3 rounded-full">
                <CheckCircle className="h-6 w-6 text-gray-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* By Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Por Status
            </CardTitle>
            <CardDescription>Distribuição por status atual</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(byStatus).map(([status, count]) => (
                <div key={status} className="flex items-center justify-between">
                  <Badge className={getStatusColor(status)}>
                    {getStatusLabel(status)}
                  </Badge>
                  <Badge variant="outline">{count}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* By Atendente */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Por Atendente
            </CardTitle>
            <CardDescription>Distribuição por atendente</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(byAtendente).map(([atendente, count]) => (
                <div key={atendente} className="flex items-center justify-between">
                  <span className="font-medium">{atendente}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-32 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-primary h-2 rounded-full"
                        style={{
                          width: `${(count / filteredSolicitacoes.length) * 100}%`,
                        }}
                      />
                    </div>
                    <Badge variant="secondary">{count}</Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Solicitações */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ClipboardList className="h-5 w-5" />
              Solicitações Recentes
            </CardTitle>
            <CardDescription>Últimas 10 solicitações</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 px-2 text-sm font-medium">Nome</th>
                    <th className="text-left py-2 px-2 text-sm font-medium">Telefone</th>
                    <th className="text-left py-2 px-2 text-sm font-medium">Atendente</th>
                    <th className="text-left py-2 px-2 text-sm font-medium">Status</th>
                    <th className="text-left py-2 px-2 text-sm font-medium">Data</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSolicitacoes.slice(0, 10).map((sol) => (
                    <tr key={sol.id} className="border-b hover:bg-gray-50">
                      <td className="py-2 px-2">{sol.nomeSolicitante}</td>
                      <td className="py-2 px-2">{sol.telefone}</td>
                      <td className="py-2 px-2 text-sm text-muted-foreground">
                        {sol.atendenteName || sol.atendenteUsername || 'N/A'}
                      </td>
                      <td className="py-2 px-2">
                        <Badge className={getStatusColor(sol.status || "")}>
                          {getStatusLabel(sol.status || "")}
                        </Badge>
                      </td>
                      <td className="py-2 px-2 text-sm text-muted-foreground">
                        {sol.createdAt ? formatDate(sol.createdAt) : "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Users/Atendentes */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Usuários do Sistema
            </CardTitle>
            <CardDescription>Lista de atendentes</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 px-2 text-sm font-medium">Nome</th>
                    <th className="text-left py-2 px-2 text-sm font-medium">Usuário</th>
                    <th className="text-left py-2 px-2 text-sm font-medium">Função</th>
                    <th className="text-left py-2 px-2 text-sm font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id} className="border-b hover:bg-gray-50">
                      <td className="py-2 px-2">{user.name}</td>
                      <td className="py-2 px-2">{user.username}</td>
                      <td className="py-2 px-2">
                        <Badge variant="outline">{user.role}</Badge>
                      </td>
                      <td className="py-2 px-2">
                        <Badge variant={user.active ? "success" : "secondary"}>
                          {user.active ? "Ativo" : "Inativo"}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
