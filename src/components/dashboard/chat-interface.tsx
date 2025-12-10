"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Send, Loader2, RefreshCw, MapPin, Download, FileText } from "lucide-react";
import { cn } from "@/lib/utils";
import { AudioRecorder } from "@/components/chat/AudioRecorder";
import { PhotoCapture } from "@/components/chat/PhotoCapture";
import { AudioPlayer } from "@/components/chat/AudioPlayer";
import { ImageViewer } from "@/components/chat/ImageViewer";
import { FileUpload } from "@/components/chat/FileUpload";

type Message = {
  id: number;
  solicitacaoId: number;
  remetente: string;
  conteudo: string;
  tipo?: string;
  mediaUrl?: string;
  fileName?: string;
  lida: boolean;
  createdAt: string;
};

type ChatInterfaceProps = {
  solicitacaoId: number;
  isAtendente?: boolean;
  solicitanteNome?: string;
  onSendLocation?: () => void;
};

export function ChatInterface({
  solicitacaoId,
  isAtendente = true,
  solicitanteNome = "Solicitante",
  onSendLocation,
}: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const fetchMessages = useCallback(async () => {
    try {
      const response = await fetch(`/api/solicitacoes/${solicitacaoId}/mensagens`);
      if (response.ok) {
        const data = await response.json();
        setMessages(data);
      }
    } catch (error) {
      console.error("Error fetching messages:", error);
    } finally {
      setLoading(false);
    }
  }, [solicitacaoId]);

  useEffect(() => {
    fetchMessages();
    
    // Poll for new messages every 3 seconds
    pollIntervalRef.current = setInterval(fetchMessages, 3000);
    
    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, [fetchMessages]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || sending) return;

    setSending(true);
    try {
      const response = await fetch(`/api/solicitacoes/${solicitacaoId}/mensagens`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conteudo: newMessage.trim(),
          remetente: isAtendente ? "atendente" : "solicitante",
          tipo: "text",
        }),
      });

      if (response.ok) {
        setNewMessage("");
        await fetchMessages();
      }
    } catch (error) {
      console.error("Error sending message:", error);
    } finally {
      setSending(false);
    }
  };

  const handleSendAudio = async (audioBlob: Blob) => {
    setSending(true);
    try {
      // For now, we'll send the audio as a base64 data URL
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64data = reader.result as string;
        
        const response = await fetch(`/api/solicitacoes/${solicitacaoId}/mensagens`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            conteudo: "Mensagem de áudio",
            remetente: isAtendente ? "atendente" : "solicitante",
            tipo: "audio",
            mediaUrl: base64data,
          }),
        });

        if (response.ok) {
          await fetchMessages();
        }
        setSending(false);
      };
      reader.readAsDataURL(audioBlob);
    } catch (error) {
      console.error("Error sending audio:", error);
      setSending(false);
    }
  };

  const handleSendPhoto = async (imageBlob: Blob) => {
    setSending(true);
    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64data = reader.result as string;
        
        const response = await fetch(`/api/solicitacoes/${solicitacaoId}/mensagens`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            conteudo: "Foto enviada",
            remetente: isAtendente ? "atendente" : "solicitante",
            tipo: "image",
            mediaUrl: base64data,
          }),
        });

        if (response.ok) {
          await fetchMessages();
        }
        setSending(false);
      };
      reader.readAsDataURL(imageBlob);
    } catch (error) {
      console.error("Error sending photo:", error);
      setSending(false);
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  };

  const handleSendFile = async (url: string, fileName: string) => {
    setSending(true);
    try {
      const response = await fetch(`/api/solicitacoes/${solicitacaoId}/mensagens`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conteudo: `Arquivo: ${fileName}`,
          remetente: isAtendente ? "atendente" : "solicitante",
          tipo: "file",
          mediaUrl: url,
          fileName: fileName,
        }),
      });

      if (response.ok) {
        await fetchMessages();
      }
    } catch (error) {
      console.error("Error sending file:", error);
    } finally {
      setSending(false);
    }
  };

  const renderMessageContent = (message: Message) => {
    if (message.tipo === "audio" && message.mediaUrl) {
      return <AudioPlayer src={message.mediaUrl} />;
    }
    if (message.tipo === "image" && message.mediaUrl) {
      return <ImageViewer src={message.mediaUrl} alt="Foto enviada" />;
    }
    if (message.tipo === "file" && message.mediaUrl) {
      return (
        <a 
          href={message.mediaUrl} 
          download={message.fileName}
          className="flex items-center gap-2 hover:underline"
          target="_blank"
          rel="noopener noreferrer"
        >
          <FileText className="h-4 w-4" />
          <span>{message.fileName || "Arquivo"}</span>
          <Download className="h-4 w-4 ml-auto" />
        </a>
      );
    }
    return message.conteudo;
  };

  return (
    <Card className="flex flex-col h-[500px]">
      <CardHeader className="py-3 px-4 border-b">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">
            {isAtendente ? `Chat com ${solicitanteNome}` : "Chat com Atendente"}
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={fetchMessages}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            <p>Nenhuma mensagem ainda. Inicie a conversa!</p>
          </div>
        ) : (
          messages.map((message) => {
            const isFromMe = isAtendente
              ? message.remetente === "atendente"
              : message.remetente === "solicitante";

            return (
              <div
                key={message.id}
                className={cn(
                  "flex flex-col max-w-[80%] space-y-1",
                  isFromMe ? "ml-auto items-end" : "mr-auto items-start"
                )}
              >
                <div
                  className={cn(
                    "rounded-lg px-4 py-2 text-sm",
                    isFromMe
                      ? "bg-primary text-white"
                      : "bg-gray-100 text-gray-900"
                  )}
                >
                  {renderMessageContent(message)}
                </div>
                <span className="text-xs text-muted-foreground">
                  {formatTime(message.createdAt)}
                </span>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </CardContent>
      <div className="p-4 border-t">
        <form onSubmit={handleSendMessage} className="flex gap-2">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Digite sua mensagem..."
            disabled={sending}
            className="flex-1"
          />
          <AudioRecorder onRecordingComplete={handleSendAudio} disabled={sending} />
          <PhotoCapture onPhotoCapture={handleSendPhoto} disabled={sending} />
          {isAtendente && (
            <FileUpload onFileUpload={handleSendFile} disabled={sending} />
          )}
          {!isAtendente && onSendLocation && (
            <Button type="button" variant="outline" onClick={onSendLocation}>
              <MapPin className="h-4 w-4" />
            </Button>
          )}
          <Button type="submit" disabled={sending || !newMessage.trim()}>
            {sending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </form>
      </div>
    </Card>
  );
}
