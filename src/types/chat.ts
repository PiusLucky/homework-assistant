export interface Message {
  curriculum?: string;
  type: "user" | "assistant" | "system";
  content: string;
  timestamp: string;
  metadata?: {
    mediaUrl?: string;
    questionType?: string;
  };
}

export interface ChatRequest {
  eventName: "homework_assistant:request";
  data: {
    message: string;
    curriculum: string;
    messageType: "TEXT";
  };
}

export interface ChatResponse {
  success: boolean;
  data: {
    message: string;
    type: string;
    timestamp: string;
  };
}
