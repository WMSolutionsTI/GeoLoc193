import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";

export const dynamic = "force-dynamic";

// Static list of available apps in the system
// In the future, this could be fetched from database
const availableApps = [
  {
    slug: "geoloc193",
    name: "GeoLoc193",
    description: "Sistema de geolocalização para emergências",
    icon: "MapPin",
    route: "/apps/geoloc193",
    active: true,
  },
  {
    slug: "viaturas",
    name: "Controle de Viaturas",
    description: "Gestão e controle de viaturas",
    icon: "Car",
    route: "/apps/viaturas",
    active: true,
  },
  {
    slug: "contingencia",
    name: "Modo de Contingência",
    description: "Sistema de contingência para emergências",
    icon: "AlertTriangle",
    route: "/apps/contingencia",
    active: true,
  },
  {
    slug: "chat",
    name: "Chat Interno",
    description: "Comunicação interna entre equipes",
    icon: "MessageSquare",
    route: "/apps/chat",
    active: true,
  },
  {
    slug: "headsets",
    name: "Controle de Headsets",
    description: "Gestão de equipamentos de áudio",
    icon: "Headphones",
    route: "/apps/headsets",
    active: true,
  },
  {
    slug: "info-cobom",
    name: "App Informações COBOM",
    description: "Informações gerais do COBOM",
    icon: "Info",
    route: "/apps/info-cobom",
    active: true,
  },
  {
    slug: "agenda",
    name: "Agenda COBOM",
    description: "Agenda de eventos e compromissos",
    icon: "Calendar",
    route: "/apps/agenda",
    active: true,
  },
  {
    slug: "gestao-dejem",
    name: "Gestão DEJEM",
    description: "Sistema de gestão DEJEM",
    icon: "Users",
    route: "/apps/gestao-dejem",
    active: true,
  },
  {
    slug: "mapa-offline",
    name: "Mapa OFFLINE",
    description: "Mapas disponíveis offline",
    icon: "Map",
    route: "/apps/mapa-offline",
    active: true,
  },
  {
    slug: "auditoria",
    name: "Auditoria de Ligações",
    description: "Auditoria e controle de ligações",
    icon: "FileSearch",
    route: "/apps/auditoria",
    active: true,
  },
];

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    // Return all available apps (active ones only)
    const activeApps = availableApps.filter((app) => app.active);
    return NextResponse.json(activeApps);
  } catch (error) {
    console.error("Error fetching apps:", error);
    return NextResponse.json(
      { error: "Erro ao buscar aplicativos" },
      { status: 500 }
    );
  }
}
