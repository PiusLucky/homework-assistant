import { useEffect, useRef, useState } from "react";
import { Socket } from "socket.io-client";
import { socketService } from "@/lib/socket";

interface UseSocketProps {
  token: string;
  hwaApplicationId: string;
}

export const useSocket = ({ token, hwaApplicationId }: UseSocketProps) => {
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    socketService.setConfig({
      token,
      hwaApplicationId,
    });

    const socket = socketService.connect();
    socketRef.current = socket;

    const handleConnect = () => {
      setIsConnected(true);
    };

    const handleDisconnect = () => {
      setIsConnected(false);
    };

    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);

    // Set initial connection state
    setIsConnected(socket.connected);

    return () => {
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
    };
  }, [token, hwaApplicationId]);

  // Only return the socket if it's connected
  return isConnected ? socketRef.current : null;
};
