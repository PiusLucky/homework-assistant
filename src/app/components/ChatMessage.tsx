import React from "react";
import ReactMarkdown from "react-markdown";

interface Message {
  type: "user" | "assistant" | "system";
  content: string;
  timestamp: string;
  metadata?: any;
}

interface ChatMessageProps {
  message: Message;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  return (
    <div
      className={`flex ${
        message.type === "user" ? "justify-end" : "justify-start"
      }`}
    >
      <div
        className={`max-w-[70%] rounded-lg p-3 ${
          message.type === "user"
            ? "bg-gradient-to-r from-blue-500 via-blue-600 to-blue-700 hover:from-blue-600 hover:via-blue-700 hover:to-blue-800 text-white shadow-md hover:shadow-lg transition-all duration-200"
            : "bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 shadow-sm"
        }`}
      >
        <div className="prose dark:prose-invert max-w-none">
          <ReactMarkdown>{message.content}</ReactMarkdown>
        </div>
        <div
          className={`text-xs mt-1 ${
            message.type === "user"
              ? "text-white/90"
              : "text-gray-500 dark:text-gray-400"
          }`}
        >
          {formatTime(message.timestamp)}
        </div>
      </div>
    </div>
  );
};

export default ChatMessage;
