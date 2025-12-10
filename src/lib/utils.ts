import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function generateToken(length: number = 32): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export function formatPhone(phone: string): string {
  const cleaned = phone.replace(/\D/g, "");
  if (cleaned.length === 11) {
    return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 7)}-${cleaned.slice(7)}`;
  }
  if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 6)}-${cleaned.slice(6)}`;
  }
  return phone;
}

export function formatDate(date: Date | string): string {
  const d = new Date(date);
  return d.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function getStatusColor(status: string): string {
  const statusColors: Record<string, string> = {
    pendente: "bg-blue-500",
    recebido: "bg-green-500",
    finalizado: "bg-gray-500",
    // Keep old values for backwards compatibility during migration
    "solicitação enviada": "bg-blue-500",
    "aguardando localização": "bg-yellow-500",
    "localização recebida": "bg-green-500",
    "em atendimento": "bg-orange-500",
    "encaminhado para CAD": "bg-purple-500",
    "incluído no CAD": "bg-teal-500",
    cancelado: "bg-red-500",
  };
  return statusColors[status] || "bg-gray-400";
}

export function getStatusLabel(status: string): string {
  const statusLabels: Record<string, string> = {
    pendente: "Pendente",
    recebido: "Recebido",
    finalizado: "Finalizado",
    // Keep old values for backwards compatibility during migration
    "solicitação enviada": "Pendente",
    "aguardando localização": "Aguardando Localização",
    "localização recebida": "Recebido",
    "em atendimento": "Em Atendimento",
    "encaminhado para CAD": "Encaminhado",
    "incluído no CAD": "Incluído no CAD",
    cancelado: "Cancelado",
  };
  return statusLabels[status] || status;
}

export function calculateExpirationTime(hours: number = 2): Date {
  const now = new Date();
  return new Date(now.getTime() + hours * 60 * 60 * 1000);
}

export function isLinkExpired(expirationDate: Date | string): boolean {
  const expDate = new Date(expirationDate);
  return new Date() > expDate;
}

export function getRemainingTime(expirationDate: Date | string): {
  hours: number;
  minutes: number;
  seconds: number;
  expired: boolean;
} {
  const expDate = new Date(expirationDate);
  const now = new Date();
  const diff = expDate.getTime() - now.getTime();

  if (diff <= 0) {
    return { hours: 0, minutes: 0, seconds: 0, expired: true };
  }

  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);

  return { hours, minutes, seconds, expired: false };
}