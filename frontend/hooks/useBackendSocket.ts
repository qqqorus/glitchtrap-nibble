"use client";

import { useEffect, useRef } from "react";
import type { WsMessage } from "@/lib/types";

const WS_URL = process.env.NEXT_PUBLIC_WS_URL ?? "ws://localhost:3001";

type Listener = (msg: WsMessage) => void;

let socket: WebSocket | null = null;
let retryTimer: ReturnType<typeof setTimeout> | null = null;
const listeners = new Set<Listener>();

function ensureSocket() {
  if (
    socket &&
    (socket.readyState === WebSocket.OPEN ||
      socket.readyState === WebSocket.CONNECTING)
  ) {
    return;
  }

  socket = new WebSocket(WS_URL);

  socket.onmessage = (e) => {
    try {
      const msg = JSON.parse(e.data) as WsMessage;
      for (const fn of listeners) fn(msg);
    } catch {
      /* ignore malformed */
    }
  };

  socket.onclose = () => {
    socket = null;
    if (retryTimer) clearTimeout(retryTimer);
    retryTimer = setTimeout(ensureSocket, 1500);
  };

  socket.onerror = () => {
    /* onclose handles retry */
  };
}

export function useBackendSocket(onMessage: (msg: WsMessage) => void) {
  const handlerRef = useRef(onMessage);
  handlerRef.current = onMessage;

  useEffect(() => {
    const listener: Listener = (msg) => handlerRef.current(msg);
    listeners.add(listener);
    ensureSocket();

    return () => {
      listeners.delete(listener);
      // Note: we don't close the socket here. The singleton persists for the
      // app's lifetime so React strict mode's double-mount doesn't tear down
      // the connection. The browser closes it automatically on page unload.
    };
  }, []);
}