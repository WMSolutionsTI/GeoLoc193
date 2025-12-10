"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Loader2, Send, Phone, User, ArrowLeft, CheckCircle } from "lucide-react";

const solicitacaoSchema = z.object({
  nomeSolicitante: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  telefone: z.string().min(10, "Telefone inválido").max(15),
});

type SolicitacaoForm = z.infer<typeof solicitacaoSchema>;

export default function NovaSolicitacaoPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lastCreated, setLastCreated] = useState<{
    id: number;
    linkToken: string;
    linkExpiracao: string;
    atendenteName?: string;
    atendenteUsername?: string;
  } | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<SolicitacaoForm>({
    resolver: zodResolver(solicitacaoSchema),
  });

  const onSubmit = async (data: SolicitacaoForm) => {
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/solicitacoes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (result.success) {
        setLastCreated(result.solicitacao);
        reset();
      } else {
        alert("Erro ao criar solicitação: " + result.error);
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Erro ao criar solicitação");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-gray-900">Nova Solicitação</h1>
          <p className="text-muted-foreground">
            Registre uma nova solicitação de geolocalização
          </p>
        </div>
        <Badge variant="outline" className="text-lg py-2 px-4">
          <User className="w-4 h-4 mr-2" />
          {session?.user?.name || "Atendente"}
        </Badge>
      </div>

      {lastCreated ? (
        <Card className="border-2 border-green-500 bg-green-50">
          <CardHeader>
            <CardTitle className="text-green-700">
              <CheckCircle className="inline w-5 h-5 mr-2" />
              Solicitação Criada com Sucesso!
            </CardTitle>
            <CardDescription className="text-green-600">
              A solicitação foi criada. O solicitante deve acessar através da página de acesso digitando seu telefone.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">ID</p>
                <p className="font-bold">{lastCreated.id}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Token</p>
                <p className="font-mono text-sm">{lastCreated.linkToken}</p>
              </div>
              <div className="col-span-2">
                <p className="text-sm text-muted-foreground">Atendente</p>
                <p className="font-medium">{lastCreated.atendenteName || session?.user?.name || 'N/A'}</p>
              </div>
              <div className="col-span-2">
                <p className="text-sm text-muted-foreground">Link expira em</p>
                <p>{new Date(lastCreated.linkExpiracao).toLocaleString("pt-BR")}</p>
              </div>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800">
                <strong>Próximo passo:</strong> O solicitante deve acessar a página de acesso do sistema e digitar os últimos 8 dígitos do telefone cadastrado.
              </p>
            </div>
            <div className="flex gap-2">
              <Button onClick={() => setLastCreated(null)}>
                Criar Nova Solicitação
              </Button>
              <Button variant="outline" onClick={() => router.push("/atendente")}>
                Ver Todas Solicitações
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Phone className="w-5 h-5 text-primary" />
              Dados do Solicitante
            </CardTitle>
            <CardDescription>
              Preencha os dados para enviar o link de geolocalização via SMS
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="nomeSolicitante">
                    <User className="w-4 h-4 inline mr-1" />
                    Nome do Solicitante
                  </Label>
                  <Input
                    id="nomeSolicitante"
                    placeholder="Nome completo"
                    {...register("nomeSolicitante")}
                    className={errors.nomeSolicitante ? "border-red-500" : ""}
                  />
                  {errors.nomeSolicitante && (
                    <p className="text-sm text-red-500">
                      {errors.nomeSolicitante.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="telefone">
                    <Phone className="w-4 h-4 inline mr-1" />
                    Telefone (com DDD)
                  </Label>
                  <Input
                    id="telefone"
                    placeholder="(00) 00000-0000"
                    {...register("telefone")}
                    className={errors.telefone ? "border-red-500" : ""}
                  />
                  {errors.telefone && (
                    <p className="text-sm text-red-500">
                      {errors.telefone.message}
                    </p>
                  )}
                </div>
              </div>

              <Button
                type="submit"
                size="lg"
                className="w-full"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Enviando SMS...
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-5 w-5" />
                    Criar Solicitação e Enviar SMS
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
