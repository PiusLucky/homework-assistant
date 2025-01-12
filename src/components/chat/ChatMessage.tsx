import ReactMarkdown from "react-markdown";
import { Message } from "@/types/chat";
import { InfoIcon } from "lucide-react";

interface ChatMessageProps {
  message: Message;
}

export const ChatMessage = ({ message }: ChatMessageProps) => {
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
    <div className={`mb-4 ${message.type === "user" ? "ml-auto" : "mr-auto"}`}>
      <div
        className={`p-4 rounded-lg w-full max-w-[80%] ${
          message.type === "user"
            ? "bg-gradient-to-r from-teal-500 to-cyan-600 text-white ml-auto"
            : "bg-gray-100 text-gray-800"
        }`}
      >
        {message.type === "assistant" ? (
          <div className="prose prose-sm dark:prose-invert max-w-none overflow-hidden break-words">
            <ReactMarkdown
              className="w-full"
              components={{
                h1: ({ node, ...props }) => (
                  <h1
                    className="text-2xl font-bold my-4 break-words"
                    {...props}
                  />
                ),
                h2: ({ node, ...props }) => (
                  <h2
                    className="text-xl font-bold my-3 break-words"
                    {...props}
                  />
                ),
                h3: ({ node, ...props }) => (
                  <h3
                    className="text-lg font-bold my-2 break-words"
                    {...props}
                  />
                ),
                ul: ({ node, ...props }) => (
                  <ul className="list-disc ml-4 my-2" {...props} />
                ),
                ol: ({ node, ...props }) => (
                  <ol className="list-decimal ml-4 my-2" {...props} />
                ),
                code: ({ node, ...props }) => (
                  <code
                    className="bg-gray-200 dark:bg-gray-700 rounded px-1 break-words whitespace-pre-wrap"
                    {...props}
                  />
                ),
                p: ({ node, ...props }) => (
                  <p className="break-words whitespace-pre-wrap" {...props} />
                ),
                pre: ({ node, ...props }) => (
                  <pre className="overflow-x-auto max-w-full" {...props} />
                ),
              }}
            >
              {message.content}
            </ReactMarkdown>
          </div>
        ) : (
          <p className="break-words">{message.content}</p>
        )}
        <div className="text-xs mt-2 opacity-70">
          {new Date(message.timestamp).toLocaleTimeString()}
        </div>
      </div>
    </div>
  );
};
