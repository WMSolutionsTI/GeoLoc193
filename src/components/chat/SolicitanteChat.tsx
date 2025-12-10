"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Send, Loader2, RefreshCw, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";
import { AudioRecorder } from "@/components/chat/AudioRecorder";
import { PhotoCapture } from "@/components/chat/PhotoCapture";
import { AudioPlayer } from "@/components/chat/AudioPlayer";
import { ImageViewer } from "@/components/chat/ImageViewer";

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

type SolicitanteChatProps = {
  solicitacaoId: number;
  onSendLocation?: () => void;
};

/**
 * Chat component for Solicitante (requester) - mobile focused
 * - Camera capture for photos
 * - Microphone for audio recording
 * - NO file attachment (mobile focused)
 */
export function SolicitanteChat({
  solicitacaoId,
  onSendLocation,
}: SolicitanteChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [chatExpired, setChatExpired] = useState(false);
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
      } else if (response.status === 403) {
        // Chat expired
        setChatExpired(true);
        if (pollIntervalRef.current) {
          clearInterval(pollIntervalRef.current);
        }
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
    
    // Request notification permission and register service worker
    void initializePushNotifications();
    
    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchMessages]);

  const initializePushNotifications = async () => {
    // Check if browser supports notifications
    if (!("Notification" in window)) {
      console.log("This browser does not support notifications");
      return;
    }

    // Check if service workers are supported
    if (!("serviceWorker" in navigator)) {
      console.log("This browser does not support service workers");
      return;
    }

    // If permission is default, request it
    if (Notification.permission === "default") {
      const permission = await Notification.requestPermission();
      
      if (permission === "granted") {
        await registerPushSubscription();
      }
    } else if (Notification.permission === "granted") {
      await registerPushSubscription();
    }
  };

  const registerPushSubscription = async () => {
    try {
      // Register service worker
      const registration = await navigator.serviceWorker.register("/sw.js");
      console.log("Service Worker registered:", registration);

      // Wait for service worker to be ready
      await navigator.serviceWorker.ready;

      // Get VAPID public key - shared constant for consistency
      const vapidPublicKey = 
        process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ||
        "BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkrxZJjSgSnfckjBJuBkr3qBUYIHBQFLXYp5Nksh8U";

      // Convert base64 string to Uint8Array
      const convertedVapidKey = urlBase64ToUint8Array(vapidPublicKey);

      // Subscribe to push notifications
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: convertedVapidKey,
      });

      console.log("Push subscription:", subscription);

      // Send subscription to server
      await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subscription,
          solicitacaoId,
        }),
      });

      console.log("Push subscription saved to server");
    } catch (error) {
      console.error("Error registering push subscription:", error);
    }
  };

  // Helper function to convert VAPID key
  const urlBase64ToUint8Array = (base64String: string) => {
    const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/\-/g, "+").replace(/_/g, "/");
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  };

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
          remetente: "solicitante",
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
            remetente: "solicitante",
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
            remetente: "solicitante",
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

  const renderMessageContent = (message: Message) => {
    if (message.tipo === "audio" && message.mediaUrl) {
      return <AudioPlayer src={message.mediaUrl} />;
    }
    if (message.tipo === "image" && message.mediaUrl) {
      return <ImageViewer src={message.mediaUrl} alt="Foto enviada" />;
    }
    return message.conteudo;
  };

  if (chatExpired) {
    return (
      <Card className="border-red-500 bg-red-50">
        <CardHeader className="text-center">
          <CardTitle className="text-red-700">Chat Expirado</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-red-600 text-center">
            Este chat expirou. Por favor, entre em contato com o 193 para uma nova solicitação.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="flex flex-col h-[400px]">
      <CardHeader className="py-3 px-4 border-b">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Chat com Atendente</CardTitle>
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
            const isFromMe = message.remetente === "solicitante";

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
        <form onSubmit={handleSendMessage} className="space-y-2">
          {/* Row 1: Text input and send button */}
          <div className="flex gap-2">
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Digite sua mensagem..."
              disabled={sending}
              className="flex-1"
            />
            <Button type="submit" disabled={sending || !newMessage.trim()} size="lg">
              {sending ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Send className="h-5 w-5" />
              )}
            </Button>
          </div>
          
          {/* Row 2: Media action buttons - centered and larger for mobile */}
          <div className="flex items-center justify-center gap-3">
            {/* Audio recording - mobile friendly */}
            <AudioRecorder onRecordingComplete={handleSendAudio} disabled={sending} />
            {/* Camera capture - mobile friendly */}
            <PhotoCapture onPhotoCapture={handleSendPhoto} disabled={sending} />
            {/* Location button */}
            {onSendLocation && (
              <Button 
                type="button" 
                variant="outline" 
                onClick={onSendLocation}
                size="lg"
                className="min-w-[48px] min-h-[48px]"
              >
                <MapPin className="h-5 w-5" />
              </Button>
            )}
          </div>
        </form>
      </div>
    </Card>
  );
}
