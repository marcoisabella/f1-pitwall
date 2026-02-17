import { useCallback, useEffect, useRef, useState } from 'react';
import type { ConnectionStatus } from '../types/f1';

interface UseWebSocketOptions {
  url: string;
  onMessage: (data: unknown) => void;
  reconnectDelay?: number;
  maxReconnectDelay?: number;
}

export function useWebSocket({
  url,
  onMessage,
  reconnectDelay = 1000,
  maxReconnectDelay = 30000,
}: UseWebSocketOptions) {
  const [status, setStatus] = useState<ConnectionStatus>('disconnected');
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectAttemptRef = useRef(0);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    setStatus('connecting');
    const ws = new WebSocket(url);
    wsRef.current = ws;

    ws.onopen = () => {
      setStatus('connected');
      reconnectAttemptRef.current = 0;
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        onMessage(data);
      } catch {
        // ignore parse errors
      }
    };

    ws.onclose = () => {
      setStatus('disconnected');
      wsRef.current = null;

      // Reconnect with exponential backoff
      const delay = Math.min(
        reconnectDelay * 2 ** reconnectAttemptRef.current,
        maxReconnectDelay
      );
      reconnectAttemptRef.current++;
      reconnectTimeoutRef.current = setTimeout(connect, delay);
    };

    ws.onerror = () => {
      ws.close();
    };
  }, [url, onMessage, reconnectDelay, maxReconnectDelay]);

  useEffect(() => {
    connect();

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [connect]);

  return { status };
}
