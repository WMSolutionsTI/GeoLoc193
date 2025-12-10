"use client";

import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Phone,
  MapPin,
  Clock,
  MessageCircle,
  Map,
  CheckCircle,
  ExternalLink,
  User,
} from "lucide-react";
import { formatPhone, formatDate, getStatusColor, getStatusLabel } from "@/lib/utils";
import { UnreadBadge } from "@/components/shared/UnreadBadge";

type Solicitacao = {
  id: number;
  nomeSolicitante: string;
  telefone: string;
  pa: string | null;
  status: string | null;
  coordenadas: { latitude: number; longitude: number } | null;
  endereco: string | null;
  plusCode: string | null;
  createdAt: Date | string | null;
  updatedAt: Date | string | null;
  atendenteName?: string | null;
  atendenteUsername?: string | null;
  smsStatus?: string | null;
  smsErrorCode?: string | null;
};

type SolicitacaoRowProps = {
  solicitacao: Solicitacao;
  onChat?: (id: number) => void;
  onViewDetails?: (id: number) => void;
  onFinish?: (id: number) => void;
};

export function SolicitacaoRow({
  solicitacao,
  onChat,
  onViewDetails,
  onFinish,
}: SolicitacaoRowProps) {
  const isPending = solicitacao.status === "pendente";
  const hasLocation = !!solicitacao.coordenadas;
  const [unreadCount, setUnreadCount] = useState(0);
  
  const googleMapsUrl = hasLocation
    ? `https://www.google.com/maps?q=${solicitacao.coordenadas?.latitude},${solicitacao.coordenadas?.longitude}`
    : null;

  // Fetch unread message count
  useEffect(() => {
    const fetchUnreadCount = async () => {
      try {
        const response = await fetch(`/api/solicitacoes/${solicitacao.id}/mensagens/unread?remetente=atendente`);
        if (response.ok) {
          const data = await response.json();
          setUnreadCount(data.unreadCount || 0);
        }
      } catch (error) {
        console.error("Error fetching unread count:", error);
      }
    };

    fetchUnreadCount();
    // Poll every 10 seconds for unread messages
    const interval = setInterval(fetchUnreadCount, 10000);
    return () => clearInterval(interval);
  }, [solicitacao.id]);

  const hasUnreadMessages = unreadCount > 0;

  return (
    <tr className={`border-b hover:bg-gray-50 ${isPending ? "bg-blue-50" : ""} ${hasUnreadMessages ? "bg-yellow-50 font-semibold" : ""}`}>
      <td className="py-3 px-4">
        <div className="flex items-center gap-2">
          <span className="font-medium">{solicitacao.nomeSolicitante}</span>
          {isPending && (
            <span className="text-xs bg-blue-500 text-white px-2 py-0.5 rounded-full animate-pulse">
              Nova
            </span>
          )}
        </div>
      </td>
      <td className="py-3 px-4">
        <div className="flex items-center gap-1 text-sm">
          <Phone className="w-3 h-3" />
          {formatPhone(solicitacao.telefone)}
        </div>
      </td>
      <td className="py-3 px-4">
        <div className="flex items-center gap-1 text-sm text-muted-foreground">
          <User className="w-3 h-3" />
          {solicitacao.atendenteName || solicitacao.atendenteUsername || 'N/A'}
        </div>
      </td>
      <td className="py-3 px-4">
        <Badge className={getStatusColor(solicitacao.status || "")}>
          {getStatusLabel(solicitacao.status || "")}
        </Badge>
      </td>
      <td className="py-3 px-4">
        {hasLocation ? (
          <a
            href={googleMapsUrl || "#"}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-sm text-green-600 hover:underline"
          >
            <MapPin className="w-3 h-3 fill-current" />
            Ver Mapa
            <ExternalLink className="w-3 h-3" />
          </a>
        ) : (
          <span className="text-sm text-muted-foreground">Aguardando</span>
        )}
      </td>
      <td className="py-3 px-4">
        <div className="flex items-center gap-1 text-sm text-muted-foreground">
          <Clock className="w-3 h-3" />
          {solicitacao.createdAt ? formatDate(solicitacao.createdAt) : "-"}
        </div>
      </td>
      <td className="py-3 px-4">
        <div className="flex gap-1">
          {onViewDetails && (
            <Button size="sm" variant="outline" onClick={() => onViewDetails(solicitacao.id)}>
              <Map className="w-3 h-3 mr-1" />
              Detalhes
            </Button>
          )}
          {onChat && (
            <Button size="sm" variant="outline" onClick={() => onChat(solicitacao.id)} className="relative">
              <MessageCircle className="w-3 h-3" />
              {hasUnreadMessages && <UnreadBadge count={unreadCount} />}
            </Button>
          )}
          {onFinish && solicitacao.status !== "finalizado" && (
            <Button size="sm" variant="secondary" onClick={() => onFinish(solicitacao.id)}>
              <CheckCircle className="w-3 h-3" />
            </Button>
          )}
        </div>
      </td>
    </tr>
  );
}
