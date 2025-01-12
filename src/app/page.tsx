"use client";

import { useSocket } from "@/hooks/useSocket";
import { useEffect, useRef, useState } from "react";
import { Message } from "@/types/chat";
import { ChatMessage } from "@/components/chat/ChatMessage";
import { ChatInput } from "@/components/chat/ChatInput";
import axios from "axios";
import { BASE_URL, token, hwaApplicationId } from "@/lib/constant";

const CURRICULUMS = [
  "Biology",
  "Physics",
  "Chemistry",
  "Mathematics",
  "English",
  "Geography",
  "History",
  "Civic Education",
  "Economics",
  "Literature",
  "Government",
  "Business Studies",
  "Computer Science",
  "Agricultural Science",
  "Technical Drawing",
  "Christian Religious Studies",
  "Islamic Religious Studies",
  "Physical and Health Education",
  "Music",
  "Art",
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
  const [hasMore, setHasMore] = useState(true);
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [selectedCurriculum, setSelectedCurriculum] = useState("Biology");
  const [selectedClass, setSelectedClass] = useState("JSS 1");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [activeConversation, setActiveConversation] = useState<string | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  const [isCreatingChat, setIsCreatingChat] = useState(false);
  const [isFetchingConversations, setIsFetchingConversations] = useState(true);
  const [limit, setLimit] = useState(10);

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
        if (data.data.metadata?.groupId && activeConversation === "new") {
          setActiveConversation(data.data.metadata.groupId);
          fetchConversationGroups();
        }

        setMessages((prev) => [
          ...prev,
          {
            type: "assistant",
            content: data.data.message,
            timestamp: data.data.timestamp,
            metadata: data.data.metadata,
          },
        ]);
      }
    });

    socket.on("homework_assistant:typing", () => {
      setIsTyping(true);
    });

    socket.on("homework_assistant:history:response", (data) => {
      if (data.success && data.data?.conversations) {
        const historyMessages: Message[] = data.data.conversations.flatMap(
          (item: any) => [
            {
              type: "user",
              content: item.question,
              timestamp: item.createdAt,
              metadata: {
                curriculum: item.curriculum,
                questionType: item.questionType,
              },
            },
            {
              type: "assistant",
              content: item.answer,
              timestamp: item.createdAt,
              metadata: item.metadata,
            },
          ]
        );
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

  const fetchConversationGroups = async () => {
    setIsFetchingConversations(true);
    try {
      const response = await axiosInstance.get(
        `/homework-ai-assistant/conversation-groups?page=1&limit=${limit}`
      );
      const { groups, pagination } = response.data.data;

      // Simulate loading delay
      await new Promise((resolve) => setTimeout(resolve, 1000));

      setConversationGroups(groups);
      setHasMore(groups.length < pagination.total);
    } catch (error) {
      console.error("Failed to fetch conversation groups:", error);
    } finally {
      setIsFetchingConversations(false);
    }
  };

  useEffect(() => {
    if (isConnected) {
      fetchConversationGroups();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [limit, isConnected]);

  const handleLoadMore = () => {
    setLimit((prevLimit) => prevLimit + 10);
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

  const startNewChat = async () => {
    setIsLoading(true);
    try {
      setShowNewChatModal(false);
      setIsInitializing(true);

      // Simulate a loading sequence
      await new Promise((resolve) => setTimeout(resolve, 800)); // First phase
      setMessages([]);

      await new Promise((resolve) => setTimeout(resolve, 1200)); // Second phase

      await new Promise((resolve) => setTimeout(resolve, 1000)); // Final phase
      setActiveConversation("new"); // Set to "new" to indicate a fresh chat
      setIsInitializing(false);
    } catch (error) {
      console.error("Error setting up new chat:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = (
    message: string,
    messageType: string,
    mediaUrl?: string
  ) => {
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

    const isFirstMessage = activeConversation === "new";

    if (isFirstMessage) {
      setIsCreatingChat(true);
      setActiveConversation("loading");
    }

    // Set typing indicator
    setIsTyping(true);

    // Prepare payload with conditional isNewChat
    const payload = {
      message,
      curriculum: selectedCurriculum,
      studentClass: selectedClass,
      messageType: messageType,
      ...(isFirstMessage ? { isNewChat: true } : {}),
      groupId: isFirstMessage ? undefined : activeConversation,
      mediaUrl: mediaUrl ? mediaUrl : undefined,
    };

    // Emit the socket event with the correct structure
    socket.emit("homework_assistant:request", {
      eventName: "homework_assistant:request",
      data: payload,
    });
  };

  useEffect(() => {
    if (!socket) return;

    socket.on("homework_assistant:response", (data) => {
      setIsTyping(false);
      setIsCreatingChat(false);
      if (data.success) {
        // If this was a new chat, update the active conversation with the new group ID
        if (data.data.metadata?.groupId && activeConversation === "loading") {
          setActiveConversation(data.data.metadata.groupId);
          // Only refresh the conversation list for new chats
          fetchConversationGroups();
        }

        setMessages((prev) => [
          ...prev,
          {
            type: "assistant",
            content: data.data.message,
            timestamp: data.data.timestamp,
            metadata: data.data.metadata,
          },
        ]);
      }
    });

    return () => {
      socket.off("homework_assistant:response");
    };
  }, [socket, activeConversation]);

  const formatMessageDate = (date: string) => {
    const messageDate = new Date(date);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (messageDate.toDateString() === today.toDateString()) {
      return "Today";
    } else if (messageDate.toDateString() === yesterday.toDateString()) {
      return "Yesterday";
    } else {
      return messageDate.toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    }
  };

  const groupMessagesByDate = (messages: Message[]) => {
    const groups: { [key: string]: Message[] } = {};

    messages.forEach((message) => {
      const date = new Date(message.timestamp).toDateString();
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(message);
    });

    return Object.entries(groups).map(([date, messages]) => ({
      date,
      messages,
    }));
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
                className="px-4 py-2 bg-gradient-to-r from-gray-400 via-gray-500 to-gray-400 hover:from-gray-500 hover:via-gray-600 hover:to-gray-500 text-white rounded-md transition-all duration-200 shadow-md hover:shadow-lg"
                disabled={isLoading}
              >
                Cancel
              </button>
              <button
                onClick={startNewChat}
                disabled={isLoading}
                className="px-4 py-2 bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 hover:from-indigo-500 hover:via-purple-500 hover:to-pink-500 text-white rounded-md transition-all duration-200 shadow-md hover:shadow-lg flex items-center gap-2"
              >
                {isLoading ? (
                  <>
                    <div className="w-5 h-5 rounded-full border-2 border-white border-t-transparent animate-spin"></div>
                    Creating...
                  </>
                ) : (
                  "Start Chat"
                )}
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
            className="w-full bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 hover:from-indigo-500 hover:via-purple-500 hover:to-pink-500 text-white font-semibold py-2 px-4 rounded-lg flex items-center justify-center gap-2 transition-all duration-200 shadow-md hover:shadow-lg"
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
              Recent Conversations{" "}
              <small className="text-xs text-gray-500">
                {isFetchingConversations ? "Updating..." : ""}
              </small>
            </h2>
            {conversationGroups.length === 0 ? (
              <div className="text-center py-8">
                <span className="text-sm text-gray-500">
                  No conversations yet
                </span>
              </div>
            ) : (
              <ul className="space-y-2">
                {conversationGroups.map((group) => (
                  <li
                    key={group.id}
                    onClick={() => handleConversationClick(group.id)}
                    className={`p-3 rounded-lg cursor-pointer transition-all duration-200 flex items-center gap-3 ${
                      activeConversation === group.id
                        ? "bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 shadow-sm"
                        : "hover:bg-gray-100 dark:hover:bg-gray-700"
                    }`}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className={`h-5 w-5 ${
                        activeConversation === group.id
                          ? "text-indigo-500"
                          : "text-gray-500"
                      }`}
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span
                      className={`text-sm ${
                        activeConversation === group.id
                          ? "text-indigo-700 font-medium"
                          : "text-gray-800 dark:text-gray-200"
                      }`}
                    >
                      {group.title}
                    </span>
                  </li>
                ))}
              </ul>
            )}
            {hasMore && (
              <button
                onClick={handleLoadMore}
                disabled={isFetchingConversations}
                className="mt-4 w-full py-2 px-4 bg-gradient-to-r from-gray-100 via-indigo-100 to-purple-100 hover:from-gray-200 hover:via-indigo-200 hover:to-purple-200 text-indigo-600 rounded-lg transition-all duration-200 shadow-sm hover:shadow flex items-center justify-center gap-2 border border-gray-200"
              >
                {isFetchingConversations ? (
                  <>
                    <div className="w-4 h-4 rounded-full border-2 border-indigo-600 border-t-transparent animate-spin"></div>
                    <span className="text-sm">Loading...</span>
                  </>
                ) : (
                  <span className="text-sm">Load More</span>
                )}
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
          </div>
        </div>

        {/* Messages or Empty State */}
        {activeConversation === null ? (
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
        ) : activeConversation === "loading" ||
          isInitializing ||
          isCreatingChat ? (
          <div className="flex-1 flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-900">
            <div className="w-16 h-16 mb-4">
              <div className="w-full h-full rounded-full border-4 border-indigo-400 border-t-transparent animate-spin"></div>
            </div>
            <div className="text-center">
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                {isInitializing || activeConversation === "loading" ? (
                  <div className="flex flex-col items-center space-y-1">
                    <span>Preparing your conversation</span>
                    <span className="text-sm text-gray-500">
                      Setting up {selectedCurriculum} assistant for{" "}
                      {selectedClass}
                    </span>
                  </div>
                ) : (
                  "Creating new chat..."
                )}
              </h3>
              <div className="flex items-center justify-center gap-1">
                <div className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce"></div>
                <div className="w-2 h-2 rounded-full bg-purple-400 animate-bounce [animation-delay:0.2s]"></div>
                <div className="w-2 h-2 rounded-full bg-pink-400 animate-bounce [animation-delay:0.4s]"></div>
              </div>
            </div>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto p-4 bg-gray-50 dark:bg-gray-900">
              {activeConversation === "new" ? (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <div className="max-w-md">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                      Start Your Conversation
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                      Ask any question about {selectedCurriculum} for{" "}
                      {selectedClass}
                    </p>
                  </div>
                </div>
              ) : (
                <>
                  {groupMessagesByDate(messages).map(
                    ({ date, messages: groupedMessages }, groupIndex) => (
                      <div key={date} className="space-y-4">
                        <div className="flex justify-center">
                          <div className="bg-gray-200 dark:bg-gray-700 px-3 py-1 rounded-full">
                            <span className="text-xs text-gray-600 dark:text-gray-300">
                              {formatMessageDate(date)}
                            </span>
                          </div>
                        </div>
                        {groupedMessages.map((message, messageIndex) => (
                          <ChatMessage
                            key={`${groupIndex}-${messageIndex}`}
                            message={message}
                          />
                        ))}
                      </div>
                    )
                  )}
                  {isTyping && (
                    <div className="flex items-center gap-3 p-4 max-w-[70%] bg-white dark:bg-gray-800 rounded-lg shadow-sm">
                      <div className="relative w-8 h-8">
                        <div className="absolute inset-0 rounded-full bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 animate-pulse"></div>
                        <div className="absolute inset-1 rounded-full bg-white dark:bg-gray-800 flex items-center justify-center">
                          <svg
                            className="w-4 h-4 text-indigo-500 animate-bounce"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                            />
                          </svg>
                        </div>
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-300 font-medium">
                        Brilliance AI is thinking...
                      </div>
                    </div>
                  )}
                </>
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
