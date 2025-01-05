"use client";

import { useSocket } from "@/hooks/useSocket";
import { useEffect, useRef, useState } from "react";
import { Message } from "@/types/chat";
import { ChatMessage } from "@/components/chat/ChatMessage";
import { ChatInput } from "@/components/chat/ChatInput";

const hwaApplicationId = "0c4730ca-d225-4337-a423-2aaee14a6bdb";
const token =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJkYXRhIjoiYTE5MjZkNTUtMjcyOS00OGE3LTk5ODEtZjJiMGMyNWYyYWY5IiwiaWF0IjoxNzM2MTAzODUyfQ.trsfzS029Xg3MLHZG9FzV0PuAyNRfExanXrKtmr3CfU";

export default function Home() {
  const socket = useSocket({
    token,
    hwaApplicationId,
  });

  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (socket) {
      setIsConnected(true);
    } else {
      setIsConnected(false);
    }
  }, [socket]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (!socket) return;

    socket.on("message", (data) => {
      console.log("Regular message:", data);
    });

    socket.on("system:message", (data) => {
      console.log("System message received:", {
        message: data.message,
        timestamp: new Date().toISOString(),
        rawData: data,
      });

      // Check if data.message exists and is a string
      if (typeof data === "string") {
        setMessages((prev) => [
          ...prev,
          {
            type: "system",
            content: data,
            timestamp: new Date().toISOString(),
          },
        ]);
      } else if (data && typeof data.message === "string") {
        setMessages((prev) => [
          ...prev,
          {
            type: "system",
            content: data.message,
            timestamp: new Date().toISOString(),
          },
        ]);
      }
    });

    socket.on("homework_assistant:response", (data) => {
      setIsTyping(false);
      if (data.success) {
        setMessages((prev) => [
          ...prev,
          {
            type: "assistant",
            content: data.data.message,
            timestamp: data.data.timestamp,
          },
        ]);
      }
    });

    socket.on("homework_assistant:typing", () => {
      setIsTyping(true);
    });

    socket.on("homework_assistant:history:response", (data) => {
      if (data.success && Array.isArray(data.data) && data.data.length > 0) {
        const historyMessages: Message[] = data.data.flatMap((item: any) => {
          return [
            {
              type: "user",
              content: item.question || "Question not available",
              timestamp: item.createdAt,
            },
            {
              type: "assistant",
              content: item.answer,
              timestamp: item.createdAt,
            },
          ];
        });
        setMessages(historyMessages);
      }
    });

    socket.emit("homework_assistant:history:request", {
      curriculum: "Biology",
    });

    return () => {
      if (socket) {
        socket.off("message");
        socket.off("system:message");
        socket.off("homework_assistant:response");
        socket.off("homework_assistant:typing");
        socket.off("homework_assistant:history:response");
      }
    };
  }, [socket]);

  const handleSendMessage = (message: string) => {
    if (!socket) {
      console.error("Socket not connected");
      setMessages((prev) => [
        ...prev,
        {
          type: "system",
          content: "Unable to send message - not connected to server",
          timestamp: new Date().toISOString(),
        },
      ]);
      return;
    }

    const newMessage: Message = {
      type: "user",
      content: message,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, newMessage]);

    socket.emit("homework_assistant:request", {
      eventName: "homework_assistant:request",
      data: {
        message,
        curriculum: "Biology",
        messageType: "TEXT",
      },
    });
  };

  return (
    <main className="flex min-h-screen flex-col">
      <div className="flex-1 container max-w-4xl mx-auto p-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg h-[80vh] flex flex-col">
          <div className="p-4 border-b flex justify-between items-center">
            <h1 className="text-xl font-bold">Homework Assistant Chat</h1>
            <div
              className={`h-3 w-3 rounded-full ${
                isConnected ? "bg-green-500" : "bg-red-500"
              }`}
            />
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            {messages.map((message, index) => (
              <ChatMessage key={index} message={message} />
            ))}
            {isTyping && (
              <div className="flex items-center gap-2 text-gray-500">
                <div className="animate-bounce">●</div>
                <div className="animate-bounce [animation-delay:0.2s]">●</div>
                <div className="animate-bounce [animation-delay:0.4s]">●</div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <ChatInput onSend={handleSendMessage} isTyping={isTyping} />
        </div>
      </div>
    </main>
  );
}
