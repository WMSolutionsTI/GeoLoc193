"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ExpirationTimer } from "@/components/dashboard/expiration-timer";
import { EmergencyButton } from "@/components/shared/emergency-button";
import { SolicitanteChat } from "@/components/chat/SolicitanteChat";
import { MapPin, CheckCircle, AlertTriangle, Flame, Loader2, RefreshCw } from "lucide-react";

type Solicitacao = {
  id: number;
  nomeSolicitante: string;
  linkExpiracao: string;
  status: string;
  coordenadas: { latitude: number; longitude: number } | null;
};

export default function SolicitacaoPage() {
  const params = useParams();
  const token = params.id as string;

  const [solicitacao, setSolicitacao] = useState<Solicitacao | null>(null);
  const [loading, setLoading] = useState(true);
  const [sendingLocation, setSendingLocation] = useState(false);
  const [locationSent, setLocationSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expired, setExpired] = useState(false);
  // Auto-show chat after location is shared
  const [showChat, setShowChat] = useState(false);

  const fetchSolicitacao = useCallback(async () => {
    try {
      const response = await fetch(`/api/solicitacoes/${token}`);
      if (!response.ok) {
        throw new Error("Solicitação não encontrada");
      }
      const data = await response.json();
      setSolicitacao(data);

      if (data.coordenadas) {
        setLocationSent(true);
        // Auto-show chat when location has been sent
        setShowChat(true);
      }

      if (new Date(data.linkExpiracao) < new Date()) {
        setExpired(true);
      }
    } catch {
      setError("Solicitação não encontrada ou link inválido");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchSolicitacao();
    // Poll for status updates every 10 seconds
    const interval = setInterval(fetchSolicitacao, 10000);
    return () => clearInterval(interval);
  }, [fetchSolicitacao]);

  const handleSendLocation = async () => {
    if (!navigator.geolocation) {
      setError("Geolocalização não é suportada pelo seu navegador");
      return;
    }

    setSendingLocation(true);
    setError(null);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const coordenadas = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
          };

          const response = await fetch(`/api/solicitacoes/${token}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ coordenadas }),
          });

          if (response.ok) {
            setLocationSent(true);
            // Auto-show chat after sending location
            setShowChat(true);
            fetchSolicitacao();
          } else {
            throw new Error("Erro ao enviar localização");
          }
        } catch {
          setError("Erro ao enviar localização. Tente novamente.");
        } finally {
          setSendingLocation(false);
        }
      },
      (err) => {
        setSendingLocation(false);
        switch (err.code) {
          case err.PERMISSION_DENIED:
            setError("Permissão de localização negada. Por favor, permita o acesso à sua localização.");
            break;
          case err.POSITION_UNAVAILABLE:
            setError("Localização indisponível. Verifique se o GPS está ativado.");
            break;
          case err.TIMEOUT:
            setError("Tempo esgotado ao obter localização. Tente novamente.");
            break;
          default:
            setError("Erro ao obter localização.");
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 30000,
        maximumAge: 0,
      }
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-red-600 to-red-800 flex items-center justify-center">
        <Loader2 className="h-12 w-12 text-white animate-spin" />
      </div>
    );
  }

  if (error && !solicitacao) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-red-600 to-red-800 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <AlertTriangle className="h-16 w-16 text-yellow-500 mx-auto mb-4" />
            <CardTitle className="text-xl">Link Inválido</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (expired) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-600 to-gray-800 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <AlertTriangle className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <CardTitle className="text-xl">Link Expirado</CardTitle>
            <CardDescription>
              Este link expirou. Entre em contato com o 193 para uma nova solicitação.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-red-600 to-red-800 flex flex-col">
      {/* Header */}
      <header className="bg-white/10 backdrop-blur-sm p-4">
        <div className="flex items-center justify-center gap-2">
          <Flame className="h-8 w-8 text-white" />
          <h1 className="text-xl font-bold text-white">Corpo de Bombeiros</h1>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 flex items-center justify-center p-4">
        <div className="max-w-md w-full space-y-4">
          <Card>
            <CardHeader className="text-center">
              {locationSent ? (
                <>
                  <CheckCircle className="h-20 w-20 text-green-500 mx-auto mb-4" />
                  <CardTitle className="text-2xl text-green-600">
                    Localização Enviada!
                  </CardTitle>
                  <CardDescription className="text-lg">
                    Obrigado, {solicitacao?.nomeSolicitante}! Sua localização foi recebida.
                  </CardDescription>
                </>
              ) : (
                <>
                  <MapPin className="h-20 w-20 text-primary mx-auto mb-4" />
                  <CardTitle className="text-2xl">
                    Olá, {solicitacao?.nomeSolicitante}!
                  </CardTitle>
                  <CardDescription className="text-lg">
                    Precisamos da sua localização para enviar socorro.
                  </CardDescription>
                </>
              )}
            </CardHeader>

            <CardContent className="space-y-6">
              {!locationSent && (
                <>
                  <div className="flex justify-center">
                    {solicitacao?.linkExpiracao && (
                      <ExpirationTimer
                        expirationDate={solicitacao.linkExpiracao}
                        onExpire={() => setExpired(true)}
                      />
                    )}
                  </div>

                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <p className="text-sm text-yellow-800">
                      <strong>Importante:</strong> Clique no botão abaixo e permita
                      o acesso à sua localização quando solicitado pelo navegador.
                    </p>
                  </div>

                  {error && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                      <p className="text-sm text-red-700">{error}</p>
                    </div>
                  )}

                  <EmergencyButton
                    onClick={handleSendLocation}
                    loading={sendingLocation}
                    className="w-full"
                  />
                </>
              )}

              {locationSent && (
                <>
                  {solicitacao?.coordenadas && (
                    <div className="bg-gray-100 rounded-lg p-4 text-center">
                      <p className="text-sm text-gray-600 mb-2">Coordenadas enviadas:</p>
                      <Badge variant="secondary" className="text-xs">
                        {solicitacao.coordenadas.latitude.toFixed(6)},{" "}
                        {solicitacao.coordenadas.longitude.toFixed(6)}
                      </Badge>
                    </div>
                  )}

                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={handleSendLocation}
                    disabled={sendingLocation}
                  >
                    {sendingLocation ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <RefreshCw className="h-4 w-4 mr-2" />
                    )}
                    Atualizar Localização
                  </Button>
                </>
              )}
            </CardContent>
          </Card>

          {/* Chat Section - Auto-shown after location is sent */}
          {showChat && solicitacao && (
            <SolicitanteChat
              solicitacaoId={solicitacao.id}
              onSendLocation={handleSendLocation}
            />
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white/10 backdrop-blur-sm p-4 text-center">
        <p className="text-white text-sm">
          Em caso de emergência, ligue <strong>193</strong>
        </p>
      </footer>
    </div>
  );
}