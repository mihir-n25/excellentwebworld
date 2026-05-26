import { io, Socket } from "socket.io-client";

let socket: Socket | null = null;

export const connectSocket = (userId: string): Socket => {
  if (socket) {
    socket.disconnect();
  }
  socket = io("http://localhost:5000", {
    query: { userId },
    reconnection: true,
    reconnectionAttempts: 2,
    reconnectionDelay: 1000,
  });
  return socket;
};

export const getSocket = (): Socket | null => socket;

export const disconnectSocket = (): void => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};
