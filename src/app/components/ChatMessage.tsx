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
            ? "bg-indigo-500 text-white"
            : "bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200"
        }`}
      >
        <div className="prose dark:prose-invert max-w-none">
          <ReactMarkdown>{message.content}</ReactMarkdown>
        </div>
        <div
          className={`text-xs mt-1 ${
            message.type === "user"
              ? "text-indigo-100"
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
