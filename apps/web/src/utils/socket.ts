import { io, Socket } from "socket.io-client";

let socket: Socket | null = null;

export function getSocket(): Socket {
  if (!socket) {
    socket = io("/", {
      transports: ["websocket", "polling"],
      autoConnect: true,
    });

    socket.on("connect", () => {
      console.log("🔌 [Socket.io] Conectado al servidor de Ritmo:", socket?.id);
    });

    socket.on("disconnect", () => {
      console.log("🔌 [Socket.io] Desconectado del servidor");
    });
  }
  return socket;
}
