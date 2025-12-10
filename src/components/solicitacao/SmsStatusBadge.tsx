"use client";

import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Loader2, CheckCircle, XCircle, HelpCircle } from "lucide-react";

interface SmsStatusBadgeProps {
  status: string | null;
  errorCode?: string | null;
}

export function SmsStatusBadge({ status, errorCode }: SmsStatusBadgeProps) {
  const getStatusConfig = () => {
    switch (status) {
      case "pending":
        return {
          label: "Enviando...",
          variant: "warning" as const,
          icon: <Loader2 className="w-3 h-3 mr-1 animate-spin" />,
          description: "SMS enviado para a operadora, aguardando confirmação de entrega",
        };
      case "delivered":
        return {
          label: "Entregue",
          variant: "success" as const,
          icon: <CheckCircle className="w-3 h-3 mr-1" />,
          description: "SMS entregue com sucesso ao destinatário",
        };
      case "failed":
        return {
          label: "Falhou",
          variant: "destructive" as const,
          icon: <XCircle className="w-3 h-3 mr-1" />,
          description: errorCode || "Falha ao enviar SMS",
        };
      case "unknown":
        return {
          label: "Desconhecido",
          variant: "secondary" as const,
          icon: <HelpCircle className="w-3 h-3 mr-1" />,
          description: "Status não confirmado após timeout",
        };
      default:
        return {
          label: "Sem SMS",
          variant: "outline" as const,
          icon: null,
          description: "Nenhum SMS foi enviado",
        };
    }
  };

  const config = getStatusConfig();

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge variant={config.variant} className="cursor-help flex items-center">
            {config.icon}
            {config.label}
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <p className="text-xs max-w-[200px]">{config.description}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
