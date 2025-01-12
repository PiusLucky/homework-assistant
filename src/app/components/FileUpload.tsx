import React, { useState } from "react";

interface FileUploadProps {
  onUploadComplete: (
    url: string,
    type: "image" | "document",
    description: string
  ) => void;
  curriculum: string;
  studentClass: string;
}

const FileUpload: React.FC<FileUploadProps> = ({
  onUploadComplete,
  curriculum,
  studentClass,
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedType, setSelectedType] = useState<"image" | "document" | null>(
    null
  );
  const [description, setDescription] = useState("");

  const handleFileSelect = async (
    e: React.ChangeEvent<HTMLInputElement>,
    type: "image" | "document"
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset error state
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

    setSelectedFile(file);
    setSelectedType(type);
    setShowModal(true);
  };

  const handleUpload = async () => {
    if (!selectedFile || !selectedType || !description.trim()) return;

    try {
      setIsUploading(true);
      const formData = new FormData();
      formData.append("file", selectedFile);

      const endpoint =
        selectedType === "image"
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
      onUploadComplete(data.url, selectedType, description);
      setShowModal(false);
      setDescription("");
      setSelectedFile(null);
      setSelectedType(null);
    } catch (err) {
      setError("Failed to upload file. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <>
      <div className="flex items-center gap-2">
        <div className="relative">
          <input
            type="file"
            accept="image/jpeg,image/png"
            onChange={(e) => handleFileSelect(e, "image")}
            className="hidden"
            id="image-upload"
            disabled={isUploading}
          />
          <label
            htmlFor="image-upload"
            className={`inline-flex items-center px-3 py-1.5 rounded-md text-sm cursor-pointer
              ${
                isUploading
                  ? "bg-gray-300 cursor-not-allowed"
                  : "bg-gradient-to-r from-blue-500 via-blue-600 to-blue-700 text-white hover:from-blue-600 hover:via-blue-700 hover:to-blue-800"
              }`}
          >
            {isUploading ? "Uploading..." : "Upload Image"}
          </label>
        </div>

        <div className="relative">
          <input
            type="file"
            accept="application/pdf"
            onChange={(e) => handleFileSelect(e, "document")}
            className="hidden"
            id="document-upload"
            disabled={isUploading}
          />
          <label
            htmlFor="document-upload"
            className={`inline-flex items-center px-3 py-1.5 rounded-md text-sm cursor-pointer
              ${
                isUploading
                  ? "bg-gray-300 cursor-not-allowed"
                  : "bg-gradient-to-r from-blue-500 via-blue-600 to-blue-700 text-white hover:from-blue-600 hover:via-blue-700 hover:to-blue-800"
              }`}
          >
            {isUploading ? "Uploading..." : "Upload PDF"}
          </label>
        </div>

        {error && <div className="text-red-500 text-sm">{error}</div>}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold mb-4">
              {selectedType === "image" ? "Image Upload" : "Document Upload"}
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Description or Question
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full rounded-md border p-2 dark:bg-gray-700 dark:border-gray-600"
                  rows={3}
                  placeholder={
                    selectedType === "image"
                      ? "What would you like to know about this image?"
                      : "What would you like to know about this document?"
                  }
                />
              </div>
              <div className="flex justify-end space-x-2">
                <button
                  onClick={() => {
                    setShowModal(false);
                    setDescription("");
                    setSelectedFile(null);
                    setSelectedType(null);
                  }}
                  className="px-4 py-2 rounded-md bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpload}
                  disabled={!description.trim() || isUploading}
                  className={`px-4 py-2 rounded-md ${
                    !description.trim() || isUploading
                      ? "bg-gray-300 cursor-not-allowed"
                      : "bg-gradient-to-r from-blue-500 via-blue-600 to-blue-700 text-white hover:from-blue-600 hover:via-blue-700 hover:to-blue-800"
                  }`}
                >
                  {isUploading ? "Uploading..." : "Upload"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default FileUpload;
