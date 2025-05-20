import { io, Socket } from "socket.io-client";
import { useState, useCallback } from "react"; // Removed useEffect

// Definir a URL do backend. Isso pode vir de uma variável de ambiente.
const SOCKET_SERVER_URL = process.env.NEXT_PUBLIC_SOCKET_SERVER_URL || "http://localhost:3001"; // Assumindo que o backend roda na porta 3001

interface SocketHook {
  socket: Socket | null;
  isConnected: boolean;
  connectSocket: (token: string) => void;
  disconnectSocket: () => void;
  emitEvent: (eventName: string, data?: any) => void;
  onEvent: (eventName: string, handler: (data: any) => void) => void;
  offEvent: (eventName: string, handler?: (data: any) => void) => void;
}

export const useSocket = (): SocketHook => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  const connectSocket = useCallback((token: string) => {
    if (socket?.connected) return;

    console.log("Attempting to connect to socket server...");
    const newSocket = io(SOCKET_SERVER_URL, {
      reconnectionAttempts: 5,
      reconnectionDelay: 5000,
      auth: {
        token: token,
      },
      transports: ["websocket"], 
    });

    newSocket.on("connect", () => {
      console.log("Socket connected:", newSocket.id);
      setIsConnected(true);
      setSocket(newSocket);
    });

    newSocket.on("disconnect", (reason) => {
      console.log("Socket disconnected:", reason);
      setIsConnected(false);
    });

    newSocket.on("connect_error", (error) => {
      console.error("Socket connection error:", error);
      setIsConnected(false);
      newSocket.disconnect(); 
      setSocket(null);
    });

    newSocket.on("authenticated", () => {
        console.log("Socket authentication successful.");
    });

    newSocket.on("unauthorized", (error: { message: string }) => {
        console.error("Socket authentication failed:", error.message);
        disconnectSocket();
    });

    return () => {
        if (newSocket.connected) {
            console.log("Disconnecting socket on cleanup...");
            newSocket.disconnect();
        }
        setIsConnected(false);
        setSocket(null);
    };
  }, [socket]);

  const disconnectSocket = useCallback(() => {
    if (socket) {
      console.log("Disconnecting socket manually...");
      socket.disconnect();
    }
    setIsConnected(false);
    setSocket(null);
  }, [socket]);

  const emitEvent = useCallback(
    (eventName: string, data?: any) => {
      if (socket?.connected) {
        socket.emit(eventName, data);
      } else {
        console.warn(`Socket not connected. Cannot emit event: ${eventName}`);
      }
    },
    [socket]
  );

  const onEvent = useCallback(
    (eventName: string, handler: (data: any) => void) => {
      if (socket) {
        socket.on(eventName, handler);
      }
    },
    [socket]
  );

  const offEvent = useCallback(
    (eventName: string, handler?: (data: any) => void) => {
      if (socket) {
        socket.off(eventName, handler);
      }
    },
    [socket]
  );
  
  return { socket, isConnected, connectSocket, disconnectSocket, emitEvent, onEvent, offEvent };
};

