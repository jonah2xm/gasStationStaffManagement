// utils/socket.js
import { io } from "socket.io-client";

let socket = null;

export function getSocket() {
  if (socket) return socket;

  // prefer explicit env var; fallback to localhost:5000 (not window.location)
  const backend =
    process.env.NEXT_PUBLIC_BACKEND_URL && process.env.NEXT_PUBLIC_BACKEND_URL !== ""
      ? process.env.NEXT_PUBLIC_BACKEND_URL
      : "http://localhost:5000";

  console.log("[socket] connecting to backend:", backend);

  socket = io(backend, {
    withCredentials: true,
    autoConnect: true,
    reconnectionAttempts: 5,
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
