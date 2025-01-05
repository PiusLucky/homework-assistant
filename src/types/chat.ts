export interface Message {
  type: "user" | "assistant" | "system";
  content: string;
  timestamp: string;
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
