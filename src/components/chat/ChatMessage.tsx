import { Message } from "@/types/chat";
import { cn } from "@/lib/utils";
import { InfoIcon } from "lucide-react";

interface ChatMessageProps {
  message: Message;
}

export function ChatMessage({ message }: ChatMessageProps) {
  if (message.type === "system") {
    return (
      <div className="flex items-center justify-center my-4">
        <div className="flex items-center gap-2 bg-yellow-100 dark:bg-yellow-900/50 text-yellow-800 dark:text-yellow-200 px-4 py-2 rounded-full text-sm">
          <InfoIcon size={16} />
          <p>{message.content}</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex w-full mb-4",
        message.type === "user" ? "justify-end" : "justify-start"
      )}
    >
      <div
        className={cn(
          "max-w-[80%] rounded-lg px-4 py-2",
          message.type === "user"
            ? "bg-blue-500 text-white"
            : "bg-gray-200 dark:bg-gray-700",
          "shadow-sm"
        )}
      >
        <p className="text-sm">{message.content}</p>
        <span className="text-xs opacity-50 mt-1 block">
          {new Date(message.timestamp).toLocaleTimeString()}
        </span>
      </div>
    </div>
  );
}
