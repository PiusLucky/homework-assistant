import ReactMarkdown from "react-markdown";
import { Message } from "@/types/chat";
import {
  InfoIcon,
  FileIcon,
  ExternalLinkIcon,
  XIcon,
  Loader,
} from "lucide-react";
import "katex/dist/katex.min.css"; // Import the CSS for KaTeX
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface ChatMessageProps {
  message: Message;
}

export const ChatMessage = ({ message }: ChatMessageProps) => {
  const [showPreview, setShowPreview] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Determine the media type based on URL extension or metadata
  const getMediaType = (url: string) => {
    if (!url) return "unknown";
    const extension = url.split(".").pop()?.toLowerCase();
    if (["pdf"].includes(extension || "")) return "pdf";
    if (["jpg", "jpeg", "png", "gif", "webp", "svg"].includes(extension || ""))
      return "image";
    return "unknown";
  };

  // Reset loading state when modal is opened
  const handleOpenPreview = () => {
    setIsLoading(true);
    setShowPreview(true);
  };

  // Function to render modal content based on media type
  const renderMediaPreview = () => {
    if (!message.metadata?.mediaUrl) return null;

    const mediaType = getMediaType(message.metadata.mediaUrl);

    return (
      <div
        className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-2 sm:p-4"
        onClick={() => setShowPreview(false)}
      >
        <div
          className={cn(
            "relative bg-white dark:bg-gray-800 rounded-lg p-2 overflow-hidden",
            mediaType === "pdf"
              ? "max-w-[95%] sm:max-w-[90%] w-[95%] sm:w-[90%] max-h-[90vh] sm:max-h-[95vh]"
              : "max-w-full sm:max-w-3xl max-h-[90vh]"
          )}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            className="absolute top-2 right-2 sm:top-3 sm:right-3 p-1 bg-gray-200 dark:bg-gray-700 rounded-full hover:bg-gray-300 z-10"
            onClick={() => setShowPreview(false)}
          >
            <XIcon size={18} className="text-gray-600 dark:text-gray-300" />
          </button>

          <div
            className={cn(
              "p-2 overflow-auto",
              mediaType === "pdf"
                ? "max-h-[calc(90vh-3rem)] sm:max-h-[calc(95vh-4rem)]"
                : "max-h-[calc(85vh-3rem)] sm:max-h-[calc(90vh-4rem)]"
            )}
          >
            {/* Loading indicator */}
            {isLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-white/75 dark:bg-gray-800/75 z-10">
                <div className="flex flex-col items-center">
                  <Loader
                    size={40}
                    className="animate-spin text-indigo-500 mb-2"
                  />
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    Loading content...
                  </p>
                </div>
              </div>
            )}

            {mediaType === "image" ? (
              <img
                src={message.metadata.mediaUrl}
                alt="Full size preview"
                className="max-w-full h-auto object-contain rounded-md"
                onLoad={() => setIsLoading(false)}
                onError={() => setIsLoading(false)}
              />
            ) : mediaType === "pdf" ? (
              <iframe
                src={`${message.metadata.mediaUrl}#view=FitH`}
                className="w-full h-[70vh] sm:h-[85vh]"
                title="PDF Document"
                onLoad={() => setIsLoading(false)}
                onError={() => setIsLoading(false)}
              />
            ) : (
              <div className="flex flex-col items-center justify-center p-8">
                <FileIcon size={64} className="text-gray-400 mb-4" />
                <p className="text-center text-gray-600 dark:text-gray-300">
                  This file type cannot be previewed.
                  <br />
                  <a
                    href={message.metadata.mediaUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-500 hover:text-blue-600 flex items-center justify-center gap-1 mt-2"
                  >
                    Open in new tab <ExternalLinkIcon size={14} />
                  </a>
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

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
        className={`p-3 sm:p-4 rounded-lg w-full ${
          message.type === "user"
            ? "bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 text-white ml-auto max-w-[90%] sm:max-w-[80%]"
            : "bg-gray-100 text-gray-800 max-w-[90%] sm:max-w-[80%]"
        }`}
      >
        {message.type === "assistant" ? (
          <div className="prose prose-sm dark:prose-invert max-w-none overflow-hidden break-words">
            <ReactMarkdown
              className="w-full"
              remarkPlugins={[remarkMath]}
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
          <div>
            {message.metadata?.mediaUrl && (
              <div className="mb-3 flex items-center gap-2">
                {message.metadata?.questionType === "IMAGE" && (
                  <div className="relative group w-full sm:w-auto">
                    <img
                      src={message.metadata.mediaUrl}
                      alt="Uploaded content"
                      className={cn(
                        "rounded-lg max-w-full h-auto shadow-lg hover:shadow-xl transition-shadow duration-200",
                        "cursor-pointer mx-auto"
                      )}
                      style={{
                        maxHeight: "160px",
                        maxWidth: "100%",
                      }}
                      onClick={handleOpenPreview}
                    />
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 flex items-center justify-center transition-all duration-200 rounded-lg">
                      <button
                        className="p-2 bg-black bg-opacity-70 rounded-full transform scale-0 group-hover:scale-100 transition-transform duration-200"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenPreview();
                        }}
                      >
                        <ExternalLinkIcon size={16} className="text-white" />
                      </button>
                    </div>
                  </div>
                )}
                {message.metadata?.questionType !== "IMAGE" &&
                  message.metadata?.mediaUrl && (
                    <button
                      onClick={handleOpenPreview}
                      className="flex items-center gap-2 py-1.5 px-3 bg-white/20 rounded-full hover:bg-white/30 transition-colors text-xs sm:text-sm"
                    >
                      <FileIcon size={14} />
                      <span>View attachment</span>
                    </button>
                  )}
              </div>
            )}
            <p className="break-words text-sm sm:text-base">
              {message.content}
            </p>
          </div>
        )}
        <div className="text-[10px] sm:text-xs mt-2 opacity-70">
          {new Date(message.timestamp).toLocaleTimeString()}
        </div>
      </div>

      {/* Media Preview Modal */}
      {showPreview && renderMediaPreview()}
    </div>
  );
};
