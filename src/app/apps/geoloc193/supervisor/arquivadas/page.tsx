"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Loader2,
  RefreshCw,
  Archive,
  Search,
  ArrowLeft,
} from "lucide-react";
import { formatDate, formatPhone, getStatusLabel } from "@/lib/utils";

type Solicitacao = {
  id: number;
  nomeSolicitante: string;
  telefone: string;
  status: string | null;
  coordenadas: { latitude: number; longitude: number } | null;
  createdAt: string | null;
  archivedAt: string | null;
  atendenteName?: string | null;
  atendenteUsername?: string | null;
};

export default function ArquivadasPage() {
  const { data: session, status: authStatus } = useSession();
  const router = useRouter();
  const [solicitacoes, setSolicitacoes] = useState<Solicitacao[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  // Check permissions
  useEffect(() => {
    if (authStatus === "authenticated" && 
        !["ADMINISTRADOR", "SUPERVISOR"].includes(session?.user?.role || "")) {
      router.push("/apps/geoloc193/atendente");
    }
  }, [authStatus, session, router]);

  const fetchArquivadas = useCallback(async () => {
    try {
      const response = await fetch("/api/solicitacoes?archived=true");
      if (response.ok) {
        const data = await response.json();
        // Filter only archived ones
        const arquivadas = data.filter((s: Solicitacao & { archived?: boolean }) => s.archived === true);
        setSolicitacoes(arquivadas);
      }
    } catch (error) {
      console.error("Error fetching archived requests:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (["ADMINISTRADOR", "SUPERVISOR"].includes(session?.user?.role || "")) {
      fetchArquivadas();
    }
  }, [fetchArquivadas, session]);

  // Filter by search term
  const filteredSolicitacoes = solicitacoes.filter((sol) => {
    return (
      sol.nomeSolicitante.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sol.telefone.includes(searchTerm)
    );
  });

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
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
              <Archive className="h-8 w-8" />
              Solicitações Arquivadas
            </h1>
            <p className="text-muted-foreground">
              Histórico de solicitações finalizadas há mais de 2 horas
            </p>
          </div>
        </div>
        <Button onClick={fetchArquivadas} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Atualizar
        </Button>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome ou telefone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Arquivadas</p>
              <p className="text-3xl font-bold">{solicitacoes.length}</p>
            </div>
            <div className="bg-gray-100 p-3 rounded-full">
              <Archive className="h-6 w-6 text-gray-500" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      {filteredSolicitacoes.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center text-muted-foreground">
              <Archive className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nenhuma solicitação arquivada encontrada</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Histórico</CardTitle>
            <CardDescription>
              {filteredSolicitacoes.length} solicitação(ões) arquivada(s)
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">ID</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Solicitante</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Telefone</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Atendente</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Status</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Localização</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Criado</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Arquivado</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSolicitacoes.map((sol) => (
                    <tr key={sol.id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4 font-mono text-sm">{sol.id}</td>
                      <td className="py-3 px-4 font-medium">{sol.nomeSolicitante}</td>
                      <td className="py-3 px-4">{formatPhone(sol.telefone)}</td>
                      <td className="py-3 px-4 text-sm text-muted-foreground">
                        {sol.atendenteName || sol.atendenteUsername || 'N/A'}
                      </td>
                      <td className="py-3 px-4">
                        <Badge variant="secondary">
                          {getStatusLabel(sol.status || "")}
                        </Badge>
                      </td>
                      <td className="py-3 px-4">
                        {sol.coordenadas ? (
                          <Badge variant="outline" className="text-green-600">
                            Recebida
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-yellow-600">
                            Não recebida
                          </Badge>
                        )}
                      </td>
                      <td className="py-3 px-4 text-sm text-muted-foreground">
                        {sol.createdAt ? formatDate(sol.createdAt) : "-"}
                      </td>
                      <td className="py-3 px-4 text-sm text-muted-foreground">
                        {sol.archivedAt ? formatDate(sol.archivedAt) : "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
