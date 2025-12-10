"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Send, Loader2, RefreshCw, Paperclip, Image as ImageIcon, Video } from "lucide-react";
import { cn } from "@/lib/utils";
import { AudioRecorder } from "@/components/chat/AudioRecorder";
import { AudioPlayer } from "@/components/chat/AudioPlayer";
import { ImageViewer } from "@/components/chat/ImageViewer";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type Message = {
  id: number;
  solicitacaoId: number;
  remetente: string;
  conteudo: string;
  tipo?: string;
  mediaUrl?: string;
  lida: boolean;
  createdAt: string;
};

type AtendenteChatProps = {
  solicitacaoId: number;
  solicitanteNome?: string;
};

// Maximum video size in bytes (10MB)
const MAX_VIDEO_SIZE = 10 * 1024 * 1024;
// Maximum image size in bytes (5MB)
const MAX_IMAGE_SIZE = 5 * 1024 * 1024;

/**
 * Chat component for Atendente (operator) - desktop focused
 * - Image paste from clipboard (Ctrl+V)
 * - File attachment (image/video with size limits)
 * - Audio recording (optional)
 * - NO camera capture (not relevant for desktop)
 */
export function AtendenteChat({
  solicitacaoId,
  solicitanteNome = "Solicitante",
}: AtendenteChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

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

  const handleImageUpload = useCallback(async (file: File) => {
    if (file.size > MAX_IMAGE_SIZE) {
      alert(`Imagem muito grande. O tamanho máximo é ${MAX_IMAGE_SIZE / 1024 / 1024}MB.`);
      return;
    }

    setSending(true);
    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64data = reader.result as string;
        
        const response = await fetch(`/api/solicitacoes/${solicitacaoId}/mensagens`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            conteudo: "Imagem enviada",
            remetente: "atendente",
            tipo: "image",
            mediaUrl: base64data,
          }),
        });

        if (response.ok) {
          await fetchMessages();
        }
        setSending(false);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error("Error sending image:", error);
      setSending(false);
    }
  }, [solicitacaoId, fetchMessages]);

  // Handle paste event for images (Ctrl+V)
  useEffect(() => {
    const handlePaste = async (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      for (const item of items) {
        if (item.type.startsWith("image/")) {
          e.preventDefault();
          const file = item.getAsFile();
          if (file) {
            await handleImageUpload(file);
          }
          break;
        }
      }
    };

    const container = containerRef.current;
    if (container) {
      container.addEventListener("paste", handlePaste);
      return () => container.removeEventListener("paste", handlePaste);
    }
  }, [handleImageUpload]);

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
          remetente: "atendente",
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
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64data = reader.result as string;
        
        const response = await fetch(`/api/solicitacoes/${solicitacaoId}/mensagens`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            conteudo: "Mensagem de áudio",
            remetente: "atendente",
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

  const handleVideoUpload = async (file: File) => {
    if (file.size > MAX_VIDEO_SIZE) {
      alert(`Vídeo muito grande. O tamanho máximo é ${MAX_VIDEO_SIZE / 1024 / 1024}MB.`);
      return;
    }

    setSending(true);
    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64data = reader.result as string;
        
        const response = await fetch(`/api/solicitacoes/${solicitacaoId}/mensagens`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            conteudo: "Vídeo enviado",
            remetente: "atendente",
            tipo: "video",
            mediaUrl: base64data,
          }),
        });

        if (response.ok) {
          await fetchMessages();
        }
        setSending(false);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error("Error sending video:", error);
      setSending(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>, type: "image" | "video") => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (type === "image") {
      handleImageUpload(file);
    } else {
      handleVideoUpload(file);
    }
    
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  };

  const renderMessageContent = (message: Message) => {
    if (message.tipo === "audio" && message.mediaUrl) {
      return <AudioPlayer src={message.mediaUrl} />;
    }
    if (message.tipo === "image" && message.mediaUrl) {
      return <ImageViewer src={message.mediaUrl} alt="Imagem enviada" />;
    }
    if (message.tipo === "video" && message.mediaUrl) {
      return (
        <video
          src={message.mediaUrl}
          controls
          className="max-w-full rounded-lg"
          style={{ maxHeight: "200px" }}
        />
      );
    }
    return message.conteudo;
  };

  return (
    <Card className="flex flex-col h-[500px]" ref={containerRef} tabIndex={0}>
      <CardHeader className="py-3 px-4 border-b">
        <div className="flex items-center justify-between">
          <div className="flex flex-col">
            <CardTitle className="text-lg">Chat com {solicitanteNome}</CardTitle>
            <span className="text-xs text-muted-foreground">
              Dica: Ctrl+V para colar imagem da área de transferência
            </span>
          </div>
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
            const isFromMe = message.remetente === "atendente";

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
          
          {/* Audio recording */}
          <AudioRecorder onRecordingComplete={handleSendAudio} disabled={sending} />
          
          {/* File attachment dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button type="button" variant="outline" disabled={sending}>
                <Paperclip className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={() => {
                  const input = document.createElement("input");
                  input.type = "file";
                  input.accept = "image/*";
                  input.onchange = (e) => handleFileSelect(e as unknown as React.ChangeEvent<HTMLInputElement>, "image");
                  input.click();
                }}
              >
                <ImageIcon className="h-4 w-4 mr-2" />
                Anexar Imagem (máx. 5MB)
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  const input = document.createElement("input");
                  input.type = "file";
                  input.accept = "video/*";
                  input.onchange = (e) => handleFileSelect(e as unknown as React.ChangeEvent<HTMLInputElement>, "video");
                  input.click();
                }}
              >
                <Video className="h-4 w-4 mr-2" />
                Anexar Vídeo (máx. 10MB)
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          
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
