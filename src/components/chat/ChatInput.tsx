import { useState } from "react";
import { Button } from "../ui/button";

interface ChatInputProps {
  onSend: (message: string) => void;
  isTyping: boolean;
}

export function ChatInput({ onSend, isTyping }: ChatInputProps) {
  const [message, setMessage] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim()) {
      onSend(message);
      setMessage("");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-2 p-4 border-t">
      <input
        type="text"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Ask your question..."
        className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800"
      />
      <Button
        type="submit"
        disabled={isTyping || !message.trim()}
        className="bg-blue-500 hover:bg-blue-600"
      >
        Send
      </Button>
    </form>
  );
}
