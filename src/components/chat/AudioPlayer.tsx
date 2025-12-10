"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Play, Pause, Loader2 } from "lucide-react";

type AudioPlayerProps = {
  src: string;
};

export function AudioPlayer({ src }: AudioPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        setIsLoading(true);
        audioRef.current.play().finally(() => setIsLoading(false));
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleEnded = () => {
    setIsPlaying(false);
  };

  return (
    <div className="flex items-center gap-2 bg-gray-100 rounded-lg px-3 py-2">
      <audio
        ref={audioRef}
        src={src}
        onEnded={handleEnded}
        onLoadedData={() => setIsLoading(false)}
      />
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={togglePlay}
        disabled={isLoading}
      >
        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : isPlaying ? (
          <Pause className="h-4 w-4" />
        ) : (
          <Play className="h-4 w-4" />
        )}
      </Button>
      <span className="text-sm text-muted-foreground">Mensagem de áudio</span>
    </div>
  );
}
