import { useState, useRef } from "react";
import { Button } from "../ui/button";
import { BASE_URL, token } from "@/lib/constant";

interface ChatInputProps {
  onSend: (message: string, messageType: string, mediaUrl?: string) => void;
  isTyping: boolean;
}

export function ChatInput({ onSend, isTyping }: ChatInputProps) {
  const [message, setMessage] = useState("");
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadedFile, setUploadedFile] = useState<{
    url: string;
    type: "IMAGE" | "DOCUMENT";
  } | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim()) {
      // If there's an uploaded file, include it in the message
      if (uploadedFile) {
        onSend(message, uploadedFile?.type, uploadedFile?.url);
        setUploadedFile(null); // Clear the uploaded file after sending
      } else {
        onSend(message, "TEXT");
      }
      setMessage("");
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
      formData.append(type === "image" ? "image" : "document", file);

      const endpoint =
        type === "image"
          ? "/homework-ai-assistant/upload-image"
          : "/homework-ai-assistant/upload-document";

      const response = await fetch(`${BASE_URL}${endpoint}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Upload failed");
      }

      const data = await response.json();
      console.log(data?.data?.mediaUrl);
      // Store the uploaded file info instead of sending immediately
      setUploadedFile({
        url: data?.data?.mediaUrl,
        type: type === "image" ? "IMAGE" : "DOCUMENT",
      });
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
    if (fileInputRef.current) {
      fileInputRef.current.accept =
        type === "image" ? "image/jpeg,image/png" : "application/pdf";
      fileInputRef.current.click();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-2 p-4 border-t">
      <div className="flex-1 relative">
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder={
            uploadedFile
              ? "Describe your question about the uploaded file..."
              : "Ask your question..."
          }
          className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800"
        />
        {uploadedFile && (
          <div className="absolute -top-8 left-0 right-0 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 text-xs p-1 rounded flex justify-between items-center">
            <span>File uploaded - add your question and click send</span>
            <button
              type="button"
              onClick={() => setUploadedFile(null)}
              className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-200"
            >
              <svg
                className="w-4 h-4"
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
        )}
      </div>

      {/* Upload button */}
      <Button
        type="button"
        onClick={() => setShowUploadModal(true)}
        disabled={!!uploadedFile}
        className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 hover:from-indigo-500 hover:via-purple-500 hover:to-pink-500 text-white p-2 disabled:opacity-50"
        title="Upload file"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          className="w-5 h-5"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"
          />
        </svg>
      </Button>

      <Button
        type="submit"
        disabled={isTyping || !message.trim()}
        className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 hover:from-indigo-500 hover:via-purple-500 hover:to-pink-500 text-white"
      >
        Send
      </Button>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) {
            const type = file.type.startsWith("image/") ? "image" : "document";
            handleFileSelect(file, type);
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
    </form>
  );
}
