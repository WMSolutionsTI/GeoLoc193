"use client";

import { useState, useCallback, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  MapPin,
  Navigation,
  Map as MapIcon,
  Loader2,
  Search,
  CheckCircle,
} from "lucide-react";

type LocationPickerProps = {
  isOpen: boolean;
  onClose: () => void;
  onLocationSelected: (location: { latitude: number; longitude: number; accuracy?: number }) => void;
};

export function LocationPicker({
  isOpen,
  onClose,
  onLocationSelected,
}: LocationPickerProps) {
  const [step, setStep] = useState<"choice" | "map">("choice");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [manualLocation, setManualLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [searchAddress, setSearchAddress] = useState("");

  // Reset state when dialog opens
  useEffect(() => {
    if (isOpen) {
      setStep("choice");
      setError(null);
      setManualLocation(null);
      setSearchAddress("");
    }
  }, [isOpen]);

  const handleCurrentLocation = useCallback(async () => {
    if (!navigator.geolocation) {
      setError("Geolocalização não é suportada pelo seu navegador");
      return;
    }

    setLoading(true);
    setError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const location = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
        };
        setLoading(false);
        onLocationSelected(location);
        onClose();
      },
      (err) => {
        setLoading(false);
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
  }, [onLocationSelected, onClose]);

  const handleManualSelection = useCallback(() => {
    setStep("map");
  }, []);

  const handleMapClick = useCallback((lat: number, lng: number) => {
    setManualLocation({ latitude: lat, longitude: lng });
  }, []);

  const handleConfirmManualLocation = useCallback(() => {
    if (manualLocation) {
      onLocationSelected({
        latitude: manualLocation.latitude,
        longitude: manualLocation.longitude,
      });
      onClose();
    }
  }, [manualLocation, onLocationSelected, onClose]);

  const handleSearchAddress = useCallback(async () => {
    if (!searchAddress.trim()) return;

    setLoading(true);
    setError(null);

    try {
      // TODO: Implement address geocoding using Google Geocoding API
      // Reference: https://developers.google.com/maps/documentation/geocoding/overview
      // This requires NEXT_PUBLIC_GOOGLE_MAPS_API_KEY in environment
      // For now, we'll just show an error that this needs to be implemented
      setError("Busca por endereço ainda não implementada. Por favor, clique no mapa para selecionar a localização.");
    } catch {
      setError("Erro ao buscar endereço");
    } finally {
      setLoading(false);
    }
  }, [searchAddress]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-primary" />
            Compartilhar Localização
          </DialogTitle>
          <DialogDescription>
            {step === "choice"
              ? "Escolha como deseja compartilhar sua localização"
              : "Clique no mapa para selecionar a localização"}
          </DialogDescription>
        </DialogHeader>

        {step === "choice" ? (
          <div className="space-y-4">
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <div className="grid grid-cols-1 gap-3">
              <Button
                variant="default"
                size="lg"
                className="h-auto py-6 flex flex-col items-center gap-3"
                onClick={handleCurrentLocation}
                disabled={loading}
              >
                {loading ? (
                  <Loader2 className="h-8 w-8 animate-spin" />
                ) : (
                  <Navigation className="h-8 w-8" />
                )}
                <div className="text-center">
                  <div className="font-semibold text-lg">Estou no local da ocorrência</div>
                  <div className="text-sm opacity-90 font-normal">
                    Usar minha localização atual (GPS)
                  </div>
                </div>
              </Button>

              <Button
                variant="outline"
                size="lg"
                className="h-auto py-6 flex flex-col items-center gap-3"
                onClick={handleManualSelection}
                disabled={loading}
              >
                <MapIcon className="h-8 w-8" />
                <div className="text-center">
                  <div className="font-semibold text-lg">Não estou no local</div>
                  <div className="text-sm opacity-90 font-normal">
                    Selecionar localização no mapa
                  </div>
                </div>
              </Button>
            </div>

            <div className="text-center">
              <Button variant="ghost" onClick={onClose}>
                Cancelar
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Search Address (optional) */}
            <div className="space-y-2">
              <Label htmlFor="search-address">Buscar endereço (opcional)</Label>
              <div className="flex gap-2">
                <Input
                  id="search-address"
                  placeholder="Digite um endereço..."
                  value={searchAddress}
                  onChange={(e) => setSearchAddress(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleSearchAddress();
                    }
                  }}
                />
                <Button
                  variant="outline"
                  onClick={handleSearchAddress}
                  disabled={loading || !searchAddress.trim()}
                >
                  <Search className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {error && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm text-yellow-800">
                {error}
              </div>
            )}

            {/* Interactive Map Placeholder */}
            <div className="bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg p-8 text-center space-y-4">
              <MapIcon className="h-16 w-16 text-gray-400 mx-auto" />
              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-600">
                  Mapa Interativo
                </p>
                <p className="text-xs text-gray-500">
                  Para implementar o mapa interativo, você precisará:
                </p>
                <ul className="text-xs text-gray-500 text-left list-disc list-inside space-y-1">
                  <li>Adicionar Google Maps API key no .env</li>
                  <li>Instalar @googlemaps/react-wrapper ou similar</li>
                  <li>Configurar o componente de mapa abaixo</li>
                </ul>
              </div>
              
              {/* Simulated location selection for demo */}
              <div className="pt-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    // Simulate clicking on map - use approximate center of Brazil for demo
                    handleMapClick(-15.7939, -47.8828);
                  }}
                >
                  Simular clique no mapa (demo)
                </Button>
              </div>
            </div>

            {manualLocation && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 space-y-2">
                <div className="flex items-center gap-2 text-green-800 font-medium">
                  <CheckCircle className="h-5 w-5" />
                  Localização selecionada
                </div>
                <div className="text-sm text-green-700 font-mono">
                  Lat: {manualLocation.latitude.toFixed(6)}, Lng: {manualLocation.longitude.toFixed(6)}
                </div>
              </div>
            )}

            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setStep("choice")}
              >
                Voltar
              </Button>
              <Button
                className="flex-1"
                onClick={handleConfirmManualLocation}
                disabled={!manualLocation}
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Confirmar Localização
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
