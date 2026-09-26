"use client";

import { useEffect, useRef } from "react";
import type { WsMessage } from "@/lib/types";

const WS_URL = process.env.NEXT_PUBLIC_WS_URL ?? "ws://localhost:3001";

export function useBackendSocket(onMessage: (msg: WsMessage) => void) {
  const handlerRef = useRef(onMessage);
  handlerRef.current = onMessage;

  useEffect(() => {
    let ws: WebSocket;
    let retryTimer: ReturnType<typeof setTimeout>;

    function connect() {
      ws = new WebSocket(WS_URL);
      ws.onmessage = (e) => {
        try {
          handlerRef.current(JSON.parse(e.data) as WsMessage);
        } catch {
          /* ignore malformed */
        }
      };
      ws.onclose = () => {
        retryTimer = setTimeout(connect, 1500);
      };
    }

    connect();
    return () => {
      clearTimeout(retryTimer);
      ws?.close();
    };
  }, []);
}