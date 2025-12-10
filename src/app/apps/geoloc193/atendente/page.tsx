"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { SolicitacaoRow } from "@/components/dashboard/solicitacao-card";
import { AtendenteChat } from "@/components/chat/AtendenteChat";
import { SmsStatusBadge } from "@/components/solicitacao/SmsStatusBadge";
import {
  Loader2,
  Plus,
  Search,
  RefreshCw,
  ClipboardList,
  Clock,
  CheckCircle,
  MapPin,
  Phone,
  User,
  ExternalLink,
  Navigation,
} from "lucide-react";

type Solicitacao = {
  id: number;
  nomeSolicitante: string;
  telefone: string;
  pa: string | null;
  status: string | null;
  coordenadas: { latitude: number; longitude: number } | null;
  endereco: string | null;
  plusCode: string | null;
  createdAt: string | null;
  updatedAt: string | null;
  linkToken: string | null;
  atendenteId: number | null;
  atendenteName?: string | null;
  atendenteUsername?: string | null;
  smsStatus?: string | null;
  smsErrorCode?: string | null;
};

export default function GeolocAtendentePage() {
  const router = useRouter();
  const [solicitacoes, setSolicitacoes] = useState<Solicitacao[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedSolicitacao, setSelectedSolicitacao] = useState<Solicitacao | null>(null);
  const [chatOpen, setChatOpen] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);

  const fetchSolicitacoes = useCallback(async () => {
    try {
      const response = await fetch("/api/solicitacoes");
      if (response.ok) {
        const data = await response.json();
        setSolicitacoes(data);
      }
    } catch (error) {
      console.error("Error fetching solicitacoes:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSolicitacoes();
    // Poll for updates every 10 seconds
    const interval = setInterval(fetchSolicitacoes, 10000);
    return () => clearInterval(interval);
  }, [fetchSolicitacoes]);

  const handleChat = (id: number) => {
    const sol = solicitacoes.find((s) => s.id === id);
    if (sol) {
      setSelectedSolicitacao(sol);
      setChatOpen(true);
    }
  };

  const handleViewDetails = (id: number) => {
    const sol = solicitacoes.find((s) => s.id === id);
    if (sol) {
      setSelectedSolicitacao(sol);
      setDetailsOpen(true);
    }
  };

  const handleFinish = async (id: number) => {
    try {
      const response = await fetch(`/api/solicitacoes/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "finalizado" }),
      });
      if (response.ok) {
        fetchSolicitacoes();
      }
    } catch (error) {
      console.error("Error finishing solicitacao:", error);
    }
  };

  // Filter solicitacoes
  const filteredSolicitacoes = solicitacoes.filter((sol) => {
    const matchesSearch =
      sol.nomeSolicitante.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sol.telefone.includes(searchTerm);
    const matchesStatus =
      statusFilter === "all" || sol.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Count stats (new status values)
  const stats = {
    pendentes: solicitacoes.filter((s) => s.status === "pendente").length,
    recebidas: solicitacoes.filter((s) => s.status === "recebido").length,
    finalizadas: solicitacoes.filter((s) => s.status === "finalizado").length,
    total: solicitacoes.length,
  };

  const googleMapsUrl = selectedSolicitacao?.coordenadas
    ? `https://www.google.com/maps?q=${selectedSolicitacao.coordenadas.latitude},${selectedSolicitacao.coordenadas.longitude}`
    : null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Solicitações</h1>
          <p className="text-muted-foreground">
            Gerencie as solicitações de geolocalização
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={fetchSolicitacoes} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Atualizar
          </Button>
          <Button onClick={() => router.push("/apps/geoloc193/atendente/nova")} size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Nova Solicitação
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Hoje</p>
                <p className="text-3xl font-bold">{stats.total}</p>
              </div>
              <div className="bg-gray-100 p-3 rounded-full">
                <MapPin className="h-6 w-6 text-gray-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome ou telefone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue placeholder="Filtrar por status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os status</SelectItem>
                <SelectItem value="pendente">Pendente</SelectItem>
                <SelectItem value="recebido">Recebido</SelectItem>
                <SelectItem value="finalizado">Finalizado</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Solicitacoes Table */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : filteredSolicitacoes.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center text-muted-foreground">
              <ClipboardList className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nenhuma solicitação encontrada</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Solicitante</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Telefone</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Atendente</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Status</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Localização</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Data</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSolicitacoes.map((sol) => (
                    <SolicitacaoRow
                      key={sol.id}
                      solicitacao={sol}
                      onChat={handleChat}
                      onViewDetails={handleViewDetails}
                      onFinish={handleFinish}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Details Dialog */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detalhes da Solicitação</DialogTitle>
            <DialogDescription>
              Informações completas da solicitação #{selectedSolicitacao?.id}
            </DialogDescription>
          </DialogHeader>
          {selectedSolicitacao && (
            <div className="space-y-6">
              {/* Requester Info */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <User className="w-4 h-4" />
                    Nome do Solicitante
                  </p>
                  <p className="font-medium text-lg">{selectedSolicitacao.nomeSolicitante}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <Phone className="w-4 h-4" />
                    Telefone
                  </p>
                  <p className="font-medium text-lg">{selectedSolicitacao.telefone}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <User className="w-4 h-4" />
                    Atendente
                  </p>
                  <p className="font-medium">{selectedSolicitacao.atendenteName || selectedSolicitacao.atendenteUsername || 'N/A'}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Status SMS</p>
                  <SmsStatusBadge 
                    status={selectedSolicitacao.smsStatus || null} 
                    errorCode={selectedSolicitacao.smsErrorCode}
                  />
                </div>
              </div>

              {/* Location Info */}
              {selectedSolicitacao.coordenadas && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 space-y-4">
                  <h3 className="font-semibold text-green-800 flex items-center gap-2">
                    <Navigation className="w-5 h-5" />
                    Localização Recebida
                  </h3>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Latitude</p>
                      <p className="font-mono font-medium">
                        {selectedSolicitacao.coordenadas.latitude.toFixed(6)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Longitude</p>
                      <p className="font-mono font-medium">
                        {selectedSolicitacao.coordenadas.longitude.toFixed(6)}
                      </p>
                    </div>
                  </div>

                  {selectedSolicitacao.plusCode && (
                    <div>
                      <p className="text-sm text-muted-foreground">Plus Code</p>
                      <p className="font-mono font-medium">{selectedSolicitacao.plusCode}</p>
                    </div>
                  )}

                  {selectedSolicitacao.endereco && (
                    <div>
                      <p className="text-sm text-muted-foreground">Endereço</p>
                      <p className="font-medium">{selectedSolicitacao.endereco}</p>
                    </div>
                  )}

                  <Button
                    className="w-full"
                    onClick={() => {
                      if (googleMapsUrl) {
                        window.open(googleMapsUrl, "_blank");
                      }
                    }}
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Abrir no Google Maps
                  </Button>
                </div>
              )}

              {!selectedSolicitacao.coordenadas && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
                  <MapPin className="w-8 h-8 text-yellow-500 mx-auto mb-2" />
                  <p className="text-yellow-800">Aguardando localização do solicitante</p>
                </div>
              )}

              <div className="flex gap-2 pt-4 border-t">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    setDetailsOpen(false);
                    setChatOpen(true);
                  }}
                >
                  Abrir Chat
                </Button>
                {selectedSolicitacao.status !== "finalizado" && (
                  <Button
                    className="flex-1"
                    onClick={() => {
                      handleFinish(selectedSolicitacao.id);
                      setDetailsOpen(false);
                    }}
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Finalizar
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Chat Dialog */}
      <Dialog open={chatOpen} onOpenChange={setChatOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Chat com {selectedSolicitacao?.nomeSolicitante}</DialogTitle>
            <DialogDescription>
              Telefone: {selectedSolicitacao?.telefone}
            </DialogDescription>
          </DialogHeader>
          {selectedSolicitacao && (
            <AtendenteChat
              solicitacaoId={selectedSolicitacao.id}
              solicitanteNome={selectedSolicitacao.nomeSolicitante}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
