"use client";

import { useSocket } from "@/hooks/useSocket";
import { useEffect, useRef, useState } from "react";
import { Message } from "@/types/chat";
import { ChatMessage } from "@/components/chat/ChatMessage";
import { ChatInput } from "@/components/chat/ChatInput";
import axios from "axios";

// Define the base URL
const BASE_URL = "https://api.brilliancelearn.com/api/v1";

const hwaApplicationId = "0c4730ca-d225-4337-a423-2aaee14a6bdb";
const token =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJkYXRhIjoiYTE5MjZkNTUtMjcyOS00OGE3LTk5ODEtZjJiMGMyNWYyYWY5IiwiaWF0IjoxNzM2MTAzODUyfQ.trsfzS029Xg3MLHZG9FzV0PuAyNRfExanXrKtmr3CfU";

const CURRICULUMS = [
  "Biology",
  "Physics",
  "Chemistry",
  "Mathematics",
  "English",
  "Geography",
  "History",
];

const CLASS_LEVELS = [
  "Primary 1",
  "Primary 2",
  "Primary 3",
  "Primary 4",
  "Primary 5",
  "Primary 6",
  "JSS 1",
  "JSS 2",
  "JSS 3",
  "SSS 1",
  "SSS 2",
  "SSS 3",
];

// Create an Axios instance with the token
const axiosInstance = axios.create({
  baseURL: BASE_URL,
  headers: {
    Authorization: `Bearer ${token}`,
  },
});

export default function Home() {
  const socket = useSocket({
    token,
    hwaApplicationId,
  });

  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [conversationGroups, setConversationGroups] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [selectedCurriculum, setSelectedCurriculum] = useState("Biology");
  const [selectedClass, setSelectedClass] = useState("JSS 1");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [activeConversation, setActiveConversation] = useState<string | null>(
    null
  );

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

  useEffect(() => {
    const fetchConversationGroups = async () => {
      try {
        const response = await axiosInstance.get(
          `/homework-ai-assistant/conversation-groups?page=${page}&limit=10`
        );
        const { groups, pagination } = response.data.data;

        // Use a Map to ensure unique entries by ID
        setConversationGroups((prev) => {
          const uniqueGroups = new Map();
          [...prev, ...groups].forEach((group) =>
            uniqueGroups.set(group.id, group)
          );
          return Array.from(uniqueGroups.values());
        });

        setHasMore(page < pagination.totalPages);
      } catch (error) {
        console.error("Failed to fetch conversation groups:", error);
      }
    };

    fetchConversationGroups();
  }, [page]);

  const handleLoadMore = () => {
    setPage((prev) => prev + 1);
  };

  const handleConversationClick = (groupId: string) => {
    setActiveConversation(groupId);
    socket?.emit("homework_assistant:history:request", {
      eventName: "homework_assistant:history:request",
      data: {
        groupId,
      },
    });
  };

  const handleNewChat = () => {
    setShowNewChatModal(true);
  };

  const startNewChat = () => {
    setActiveConversation(null);
    setMessages([]);
    socket?.emit("homework_assistant:request", {
      eventName: "homework_assistant:request",
      data: {
        message: "Hello",
        curriculum: selectedCurriculum,
        studentClass: selectedClass,
        messageType: "TEXT",
        isNewChat: true,
      },
    });
    setShowNewChatModal(false);
  };

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
        curriculum: selectedCurriculum,
        studentClass: selectedClass,
        messageType: "TEXT",
      },
    });
  };

  return (
    <main className="flex h-screen bg-gray-100 dark:bg-gray-900">
      {/* New Chat Modal */}
      {showNewChatModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-96">
            <h2 className="text-xl font-bold mb-4 text-gray-800 dark:text-white">
              Start New Chat
            </h2>

            {/* Curriculum Selection */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Select Curriculum
              </label>
              <select
                value={selectedCurriculum}
                onChange={(e) => setSelectedCurriculum(e.target.value)}
                className="w-full p-2 border rounded-md bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
              >
                {CURRICULUMS.map((curriculum) => (
                  <option key={curriculum} value={curriculum}>
                    {curriculum}
                  </option>
                ))}
              </select>
            </div>

            {/* Class Selection */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Select Class
              </label>
              <select
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                className="w-full p-2 border rounded-md bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
              >
                {CLASS_LEVELS.map((level) => (
                  <option key={level} value={level}>
                    {level}
                  </option>
                ))}
              </select>
            </div>

            {/* Modal Actions */}
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowNewChatModal(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 dark:text-gray-300 dark:hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={startNewChat}
                className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
              >
                Start Chat
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sidebar */}
      <div className="w-80 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col">
        {/* New Chat Button */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <button
            onClick={handleNewChat}
            className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg flex items-center justify-center gap-2"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
                clipRule="evenodd"
              />
            </svg>
            New Chat
          </button>
        </div>

        {/* Conversations List */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-4">
            <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-2">
              Recent Conversations
            </h2>
            <ul className="space-y-2">
              {conversationGroups.map((group) => (
                <li
                  key={group.id}
                  onClick={() => handleConversationClick(group.id)}
                  className="p-3 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg cursor-pointer transition-colors flex items-center gap-3"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 text-gray-500"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span className="text-sm text-gray-800 dark:text-gray-200">
                    {group.title}
                  </span>
                </li>
              ))}
            </ul>
            {hasMore && (
              <button
                onClick={handleLoadMore}
                className="mt-4 w-full py-2 px-4 text-sm text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300"
              >
                Load More
              </button>
            )}
          </div>
        </div>

        {/* Connection Status */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex items-center gap-2">
          <div
            className={`h-2 w-2 rounded-full ${
              isConnected ? "bg-green-500" : "bg-red-500"
            }`}
          />
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {isConnected ? "Connected" : "Disconnected"}
          </span>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Chat Header with Dropdowns */}
        <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-xl font-bold text-gray-800 dark:text-white">
              Homework Assistant Chat
            </h1>
            <div className="flex gap-4">
              <select
                value={selectedCurriculum}
                onChange={(e) => setSelectedCurriculum(e.target.value)}
                className="px-3 py-2 border rounded-md bg-white dark:bg-gray-700 text-gray-800 dark:text-white text-sm"
              >
                {CURRICULUMS.map((curriculum) => (
                  <option key={curriculum} value={curriculum}>
                    {curriculum}
                  </option>
                ))}
              </select>
              <select
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                className="px-3 py-2 border rounded-md bg-white dark:bg-gray-700 text-gray-800 dark:text-white text-sm"
              >
                {CLASS_LEVELS.map((level) => (
                  <option key={level} value={level}>
                    {level}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Messages or Empty State */}
        {!activeConversation ? (
          <div className="flex-1 flex items-center justify-center bg-gray-50 dark:bg-gray-900">
            <div className="text-center">
              <svg
                className="mx-auto h-24 w-24 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 48 48"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4.354a4 4 0 110 5.292M15 21H3v-6a6 6 0 0112 0v6zm0 0h6v-6a6 6 0 00-12 0v6zm0 0h6m6 0h6m-6 0a6 6 0 00-6-6m6 6a6 6 0 016-6m0 0v6m0-6a6 6 0 00-6 6m6 0v6m0-6a6 6 0 016 6v6m-18 0h18M12 4.354a4 4 0 110 5.292M15 21H3v-6a6 6 0 0112 0v6zm0 0h6v-6a6 6 0 00-12 0v6zm0 0h6m6 0h6m-6 0a6 6 0 00-6-6m6 6a6 6 0 016-6m0 0v6m0-6a6 6 0 00-6 6m6 0v6m0-6a6 6 0 016 6v6m-18 0h18"
                />
              </svg>
              <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-gray-100">
                Select a conversation to begin
              </h3>
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                Choose an existing conversation from the sidebar or start a new
                one using the &ldquo;New Chat&rdquo; button
              </p>
            </div>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto p-4 bg-gray-50 dark:bg-gray-900">
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

            {/* Chat Input */}
            <div className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-4">
              <ChatInput onSend={handleSendMessage} isTyping={isTyping} />
            </div>
          </>
        )}
      </div>
    </main>
  );
}
