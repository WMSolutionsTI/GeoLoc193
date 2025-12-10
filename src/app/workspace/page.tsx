"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Header } from "@/components/shared/header";
import {
  MapPin,
  Car,
  AlertTriangle,
  MessageSquare,
  Headphones,
  Info,
  Calendar,
  Users,
  Map,
  FileSearch,
  Loader2,
} from "lucide-react";

// Available apps in the system
const allApps = [
  {
    slug: "geoloc193",
    name: "GeoLoc193",
    description: "Sistema de geolocalização para emergências",
    icon: MapPin,
    route: "/apps/geoloc193",
    color: "bg-red-500",
  },
  {
    slug: "viaturas",
    name: "Controle de Viaturas",
    description: "Gestão e controle de viaturas",
    icon: Car,
    route: "/apps/viaturas",
    color: "bg-blue-500",
  },
  {
    slug: "contingencia",
    name: "Modo de Contingência",
    description: "Sistema de contingência para emergências",
    icon: AlertTriangle,
    route: "/apps/contingencia",
    color: "bg-yellow-500",
  },
  {
    slug: "chat",
    name: "Chat Interno",
    description: "Comunicação interna entre equipes",
    icon: MessageSquare,
    route: "/apps/chat",
    color: "bg-green-500",
  },
  {
    slug: "headsets",
    name: "Controle de Headsets",
    description: "Gestão de equipamentos de áudio",
    icon: Headphones,
    route: "/apps/headsets",
    color: "bg-purple-500",
  },
  {
    slug: "info-cobom",
    name: "App Informações COBOM",
    description: "Informações gerais do COBOM",
    icon: Info,
    route: "/apps/info-cobom",
    color: "bg-cyan-500",
  },
  {
    slug: "agenda",
    name: "Agenda COBOM",
    description: "Agenda de eventos e compromissos",
    icon: Calendar,
    route: "/apps/agenda",
    color: "bg-orange-500",
  },
  {
    slug: "gestao-dejem",
    name: "Gestão DEJEM",
    description: "Sistema de gestão DEJEM",
    icon: Users,
    route: "/apps/gestao-dejem",
    color: "bg-pink-500",
  },
  {
    slug: "mapa-offline",
    name: "Mapa OFFLINE",
    description: "Mapas disponíveis offline",
    icon: Map,
    route: "/apps/mapa-offline",
    color: "bg-teal-500",
  },
  {
    slug: "auditoria",
    name: "Auditoria de Ligações",
    description: "Auditoria e controle de ligações",
    icon: FileSearch,
    route: "/apps/auditoria",
    color: "bg-gray-500",
  },
];

export default function WorkspacePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [userApps, setUserApps] = useState<typeof allApps>([]);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  useEffect(() => {
    if (session?.user?.allowedApps) {
      const allowedSlugs = session.user.allowedApps;
      const filtered = allApps.filter((app) => allowedSlugs.includes(app.slug));
      setUserApps(filtered);
    }
  }, [session]);

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Bem-vindo, {session.user.name}!
          </h1>
          <p className="text-muted-foreground mt-2">
            Painel COBOM - Selecione um aplicativo para começar
          </p>
        </div>

        {userApps.length === 0 ? (
          <Card>
            <CardContent className="py-12">
              <div className="text-center text-muted-foreground">
                <AlertTriangle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Você não possui acesso a nenhum aplicativo.</p>
                <p className="text-sm mt-2">
                  Entre em contato com o administrador para solicitar acesso.
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {userApps.map((app) => {
              const IconComponent = app.icon;
              return (
                <Link
                  key={app.slug}
                  href={app.route}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded-lg"
                >
                  <Card className="h-full cursor-pointer transition-all hover:shadow-lg hover:scale-105">
                    <CardHeader className="pb-3">
                      <div className="flex items-center gap-4">
                        <div className={`p-3 rounded-lg ${app.color} text-white`}>
                          <IconComponent className="h-6 w-6" />
                        </div>
                        <CardTitle className="text-lg">{app.name}</CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <CardDescription>{app.description}</CardDescription>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        )}

        {/* Admin Access */}
        {session.user.role === "ADMINISTRADOR" && (
          <div className="mt-12">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Área Administrativa
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              <Link
                href="/admin/usuarios"
                className="block focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded-lg"
              >
                <Card className="h-full cursor-pointer transition-all hover:shadow-lg hover:scale-105 border-2 border-dashed border-gray-300">
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-4">
                      <div className="p-3 rounded-lg bg-gray-800 text-white">
                        <Users className="h-6 w-6" />
                      </div>
                      <CardTitle className="text-lg">Gerenciar Usuários</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <CardDescription>
                      Criar, editar e excluir usuários do sistema
                    </CardDescription>
                  </CardContent>
                </Card>
              </Link>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
