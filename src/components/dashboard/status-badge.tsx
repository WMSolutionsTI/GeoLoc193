import { Badge } from "@/components/ui/badge";
import { getStatusLabel } from "@/lib/utils";

interface StatusBadgeProps {
  status: string;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const getVariant = (status: string) => {
    switch (status) {
      case "solicitação enviada":
        return "info";
      case "aguardando localização":
        return "warning";
      case "localização recebida":
        return "success";
      case "em atendimento":
        return "default";
      case "finalizado":
        return "secondary";
      case "cancelado":
        return "destructive";
      default:
        return "outline";
    }
  };

  return (
    <Badge variant={getVariant(status)}>
      {getStatusLabel(status)}
    </Badge>
  );
}