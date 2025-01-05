import { io, Socket } from "socket.io-client";

interface SocketConfig {
  token: string;
  hwaApplicationId: string;
}

class SocketService {
  private static instance: SocketService;
  private socket: Socket | null = null;
  private config: SocketConfig | null = null;
  private connectionAttempts = 0;
  private maxAttempts = 5;
  private readonly reconnectionDelay = 1000;

  private constructor() {}

  public static getInstance(): SocketService {
    if (!SocketService.instance) {
      SocketService.instance = new SocketService();
    }
    return SocketService.instance;
  }

  public setConfig(config: SocketConfig) {
    this.config = config;
    if (!this.socket) {
      this.connect();
    }
  }

  public connect(namespace: string = "/homework-assistant") {
    if (!this.config) {
      throw new Error("Socket configuration not set. Call setConfig first.");
    }

    if (this.socket?.connected) {
      return this.socket;
    }

    const url =
      process.env.NEXT_PUBLIC_WEBSOCKET_URL ||
      "https://api.brilliancelearn.com";

    this.socket = io(`${url}${namespace}`, {
      transports: ["websocket"],
      reconnection: true,
      reconnectionAttempts: this.maxAttempts,
      reconnectionDelay: this.reconnectionDelay,
      timeout: 10000,
      query: {
        token: this.config.token,
        hwaApplicationId: this.config.hwaApplicationId,
      },
    });

    this.setupSocketListeners();
    return this.socket;
  }

  private setupSocketListeners() {
    if (!this.socket) return;

    this.socket.on("connect", () => {
      console.log("Socket connected successfully");
      this.connectionAttempts = 0;
    });

    this.socket.on("disconnect", (reason) => {
      console.log("Socket disconnected:", reason);
      if (reason === "io server disconnect") {
        setTimeout(() => this.connect(), this.reconnectionDelay);
      }
    });

    this.socket.on("connect_error", (error) => {
      console.error("Connection error:", error);
      this.connectionAttempts++;

      if (this.connectionAttempts < this.maxAttempts) {
        setTimeout(() => this.connect(), this.reconnectionDelay);
      }
    });
  }

  public getSocket(): Socket | null {
    if (!this.socket?.connected && this.config) {
      return this.connect();
    }
    return this.socket;
  }

  public disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }
}

export const socketService = SocketService.getInstance();
