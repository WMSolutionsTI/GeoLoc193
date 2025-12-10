"use client";

import { useState, useEffect } from "react";
import { getRemainingTime } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Clock } from "lucide-react";

interface ExpirationTimerProps {
  expirationDate: Date | string;
  onExpire?: () => void;
}

export function ExpirationTimer({ expirationDate, onExpire }: ExpirationTimerProps) {
  const [timeLeft, setTimeLeft] = useState(getRemainingTime(expirationDate));

  useEffect(() => {
    const timer = setInterval(() => {
      const remaining = getRemainingTime(expirationDate);
      setTimeLeft(remaining);

      if (remaining.expired && onExpire) {
        onExpire();
        clearInterval(timer);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [expirationDate, onExpire]);

  if (timeLeft.expired) {
    return (
      <Badge variant="destructive" className="text-sm">
        <Clock className="w-4 h-4 mr-1" />
        Link Expirado
      </Badge>
    );
  }

  const isUrgent = timeLeft.hours === 0 && timeLeft.minutes < 30;

  return (
    <Badge
      variant={isUrgent ? "warning" : "info"}
      className={`text-sm ${isUrgent ? "animate-pulse" : ""}`}
    >
      <Clock className="w-4 h-4 mr-1" />
      {String(timeLeft.hours).padStart(2, "0")}:
      {String(timeLeft.minutes).padStart(2, "0")}:
      {String(timeLeft.seconds).padStart(2, "0")}
    </Badge>
  );
}