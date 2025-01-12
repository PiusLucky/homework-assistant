import React, { useState, useRef } from "react";

interface ChatInputProps {
  onSendMessage: (
    message: string,
    messageType?: string,
    mediaUrl?: string
  ) => void;
  isLoading?: boolean;
  curriculum: string;
  studentClass: string;
}

const ChatInput: React.FC<ChatInputProps> = ({
  onSendMessage,
  isLoading,
  curriculum,
  studentClass,
}) => {
  const [message, setMessage] = useState("");
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [uploadType, setUploadType] = useState<"image" | "document" | null>(
    null
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() && !isLoading) {
      onSendMessage(message);
      setMessage("");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleFileSelect = async (file: File, type: "image" | "document") => {
    setError(null);

    // Validate file type
    if (type === "image") {
      if (!["image/jpeg", "image/png"].includes(file.type)) {
        setError("Please upload only JPEG or PNG images.");
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        setError("Image size should be less than 5MB.");
        return;
      }
    } else {
      if (file.type !== "application/pdf") {
        setError("Please upload only PDF documents.");
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        setError("Document size should be less than 10MB.");
        return;
      }
    }

    try {
      setIsUploading(true);
      const formData = new FormData();
      formData.append("file", file);

      const endpoint =
        type === "image"
          ? "/homework-ai-assistant/upload-image"
          : "/homework-ai-assistant/upload-document";

      const response = await fetch(endpoint, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Upload failed");
      }

      const data = await response.json();
      const message = `I need help understanding this ${type}`;
      onSendMessage(message, type.toUpperCase(), data.url);
      setShowUploadModal(false);
    } catch (err) {
      setError("Failed to upload file. Please try again.");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleUploadClick = (type: "image" | "document") => {
    setUploadType(type);
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  return (
    <div className="border-t dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
      <form onSubmit={handleSubmit} className="flex items-end space-x-2">
        <textarea
          ref={textareaRef}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type your message..."
          className="flex-1 resize-none rounded-lg border dark:border-gray-600 p-2 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
          rows={1}
          disabled={isLoading}
        />
        <button
          type="button"
          onClick={() => setShowUploadModal(true)}
          className="p-2 rounded-lg text-gray-500 hover:text-blue-500 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          disabled={isLoading}
          title="Upload file"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-6 w-6"
          >
            <path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48" />
          </svg>
        </button>
        <button
          type="submit"
          disabled={!message.trim() || isLoading}
          className={`px-4 py-2 rounded-lg ${
            !message.trim() || isLoading
              ? "bg-gray-300 cursor-not-allowed"
              : "bg-gradient-to-r from-blue-500 via-blue-600 to-blue-700 text-white hover:from-blue-600 hover:via-blue-700 hover:to-blue-800"
          }`}
        >
          Send
        </button>
      </form>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        accept={
          uploadType === "image" ? "image/jpeg,image/png" : "application/pdf"
        }
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file && uploadType) {
            handleFileSelect(file, uploadType);
          }
        }}
      />

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-sm w-full">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Upload File
              </h3>
              <button
                onClick={() => setShowUploadModal(false)}
                className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            {error && (
              <div className="mb-4 text-sm text-red-500 bg-red-50 dark:bg-red-900/20 p-2 rounded">
                {error}
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => handleUploadClick("image")}
                disabled={isUploading}
                className={`p-4 border-2 border-dashed rounded-lg flex flex-col items-center justify-center gap-2 transition-colors
                  ${
                    isUploading
                      ? "bg-gray-100 cursor-not-allowed"
                      : "hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                  }`}
              >
                <svg
                  className="w-8 h-8 text-gray-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
                <span className="text-sm font-medium">Upload Image</span>
                <span className="text-xs text-gray-500">
                  JPEG, PNG (max 5MB)
                </span>
              </button>

              <button
                onClick={() => handleUploadClick("document")}
                disabled={isUploading}
                className={`p-4 border-2 border-dashed rounded-lg flex flex-col items-center justify-center gap-2 transition-colors
                  ${
                    isUploading
                      ? "bg-gray-100 cursor-not-allowed"
                      : "hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                  }`}
              >
                <svg
                  className="w-8 h-8 text-gray-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                <span className="text-sm font-medium">Upload PDF</span>
                <span className="text-xs text-gray-500">
                  PDF only (max 10MB)
                </span>
              </button>
            </div>

            {isUploading && (
              <div className="mt-4 flex items-center justify-center gap-2">
                <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                <span className="text-sm text-gray-600 dark:text-gray-300">
                  Uploading...
                </span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatInput;
