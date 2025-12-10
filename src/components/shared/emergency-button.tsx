import { Button, type ButtonProps } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { MapPin } from "lucide-react";

interface EmergencyButtonProps extends ButtonProps {
  loading?: boolean;
  pulseAnimation?: boolean;
}

export function EmergencyButton({
  className,
  loading,
  pulseAnimation = true,
  children,
  ...props
}: EmergencyButtonProps) {
  return (
    <Button
      variant="emergency"
      size="xl"
      className={cn(
        pulseAnimation && "animate-emergency-pulse",
        "min-w-[200px]",
        className
      )}
      disabled={loading}
      {...props}
    >
      {loading ? (
        <span className="flex items-center gap-2">
          <span className="animate-spin">⏳</span>
          Obtendo localização...
        </span>
      ) : (
        <span className="flex items-center gap-2">
          <MapPin className="w-6 h-6" />
          {children || "Enviar Localização"}
        </span>
      )}
    </Button>
  );
}