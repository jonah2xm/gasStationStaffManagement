// utils/socket.js
import { io } from "socket.io-client";

let socket = null;

export function getSocket() {
  if (socket) return socket;

  // prefer explicit env var; otherwise connect to the page's own origin,
  // which next.config.ts proxies to the backend
  const backend = process.env.NEXT_PUBLIC_BACKEND_URL || undefined;

  console.log("[socket] connecting to backend:", backend || window.location.origin);

  // Reconnexion sans limite : le serveur peut être indisponible quelques
  // instants (redémarrage, veille du poste) sans couper le temps réel.
  socket = io(backend, {
    withCredentials: true,
    autoConnect: true,
    reconnectionDelayMax: 10000,
  });

  socket.on("connect", () => {
    console.log("[socket] connected", socket.id);
  });

  socket.on("connect_error", (err) => {
    console.error("[socket] connect_error", err && err.message ? err.message : err);
  });

  socket.on("disconnect", (reason) => {
    console.log("[socket] disconnected", reason);
  });

  return socket;
}
