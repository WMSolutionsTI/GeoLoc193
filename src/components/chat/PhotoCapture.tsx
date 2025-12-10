"use client";

import { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Camera, X, Send, Loader2 } from "lucide-react";

type PhotoCaptureProps = {
  onPhotoCapture: (imageBlob: Blob) => void;
  disabled?: boolean;
};

export function PhotoCapture({ onPhotoCapture, disabled }: PhotoCaptureProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const startCamera = useCallback(async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (error) {
      console.error("Error accessing camera:", error);
      alert("Não foi possível acessar a câmera. Verifique as permissões.");
      setIsOpen(false);
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
    setCapturedImage(null);
  }, [stream]);

  const handleOpen = () => {
    setIsOpen(true);
    setCapturedImage(null);
    startCamera();
  };

  const handleClose = () => {
    stopCamera();
    setIsOpen(false);
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const canvas = canvasRef.current;
      const video = videoRef.current;
      
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(video, 0, 0);
        const imageDataUrl = canvas.toDataURL("image/jpeg", 0.8);
        setCapturedImage(imageDataUrl);
        stopCamera();
      }
    }
  };

  const retakePhoto = () => {
    setCapturedImage(null);
    startCamera();
  };

  const sendPhoto = async () => {
    if (!capturedImage) return;
    
    setIsSending(true);
    try {
      // Convert data URL to Blob
      const response = await fetch(capturedImage);
      const blob = await response.blob();
      onPhotoCapture(blob);
      handleClose();
    } catch (error) {
      console.error("Error sending photo:", error);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <>
      <Button 
        type="button" 
        variant="outline" 
        onClick={handleOpen} 
        disabled={disabled}
        size="lg"
        className="min-w-[48px] min-h-[48px]"
      >
        <Camera className="h-5 w-5" />
      </Button>

      <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Capturar Foto</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {!capturedImage ? (
              <div className="relative bg-black rounded-lg overflow-hidden aspect-video">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />
              </div>
            ) : (
              <div className="relative bg-black rounded-lg overflow-hidden aspect-video">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={capturedImage}
                  alt="Preview"
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            <canvas ref={canvasRef} className="hidden" />

            <div className="flex gap-2 justify-center">
              {!capturedImage ? (
                <>
                  <Button variant="outline" onClick={handleClose}>
                    <X className="h-4 w-4 mr-2" />
                    Cancelar
                  </Button>
                  <Button onClick={capturePhoto}>
                    <Camera className="h-4 w-4 mr-2" />
                    Capturar
                  </Button>
                </>
              ) : (
                <>
                  <Button variant="outline" onClick={retakePhoto}>
                    <Camera className="h-4 w-4 mr-2" />
                    Tirar Outra
                  </Button>
                  <Button onClick={sendPhoto} disabled={isSending}>
                    {isSending ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4 mr-2" />
                    )}
                    Enviar
                  </Button>
                </>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
