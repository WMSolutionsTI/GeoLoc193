"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Flame, Phone, Loader2, AlertTriangle, ArrowRight } from "lucide-react";

export default function AcessarPage() {
  const router = useRouter();
  const [telefone, setTelefone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const buscarSolicitacao = async () => {
    if (telefone.length < 8) {
      setError("Digite pelo menos os últimos 8 dígitos do seu telefone.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/solicitacoes/buscar-por-telefone?telefone=${telefone}`);
      const data = await response.json();

      if (response.ok && data.linkToken) {
        // Redirecionar para a página da solicitação
        router.push(`/solicitacao/${data.linkToken}`);
      } else {
        setError(data.error || "Nenhuma solicitação encontrada para este telefone.");
        setLoading(false);
      }
    } catch {
      setError("Erro ao buscar solicitação. Tente novamente.");
      setLoading(false);
    }
  };

  // Aceitar apenas números
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, ""); // Remove não-números
    if (value.length <= 9) {
      setTelefone(value);
      setError(null); // Clear error when user types
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    buscarSolicitacao();
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-red-600 to-red-800 flex flex-col">
      {/* Header */}
      <header className="bg-white/10 backdrop-blur-sm p-4">
        <div className="flex items-center justify-center gap-2">
          <Flame className="h-8 w-8 text-white" />
          <h1 className="text-xl font-bold text-white">Corpo de Bombeiros - 193</h1>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <Phone className="h-16 w-16 text-primary mx-auto mb-4" />
            <CardTitle className="text-2xl">Compartilhar Localização</CardTitle>
            <CardDescription className="text-lg">
              Digite o número do seu telefone (sem DDD) para continuar
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="flex gap-2">
                <Input
                  type="tel"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  placeholder="Ex: 912345678"
                  value={telefone}
                  onChange={handleChange}
                  className="text-center text-3xl h-16 font-mono tracking-widest flex-1"
                  autoFocus
                  disabled={loading}
                />
                <Button
                  type="submit"
                  size="lg"
                  className="h-16 px-8"
                  disabled={loading || telefone.length < 8}
                >
                  {loading ? (
                    <Loader2 className="h-6 w-6 animate-spin" />
                  ) : (
                    <>
                      IR
                      <ArrowRight className="h-5 w-5 ml-2" />
                    </>
                  )}
                </Button>
              </div>

              <p className="text-center text-sm text-muted-foreground">
                Digite os últimos 8 ou 9 dígitos do seu celular e clique em IR
              </p>

              {error && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm text-yellow-800">{error}</p>
                    <p className="text-xs text-yellow-600 mt-1">
                      Verifique se digitou corretamente ou ligue para o 193.
                    </p>
                  </div>
                </div>
              )}
            </form>
          </CardContent>
        </Card>
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
