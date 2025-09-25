export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  isStreaming?: boolean;
  status?: 'sending' | 'sent' | 'failed';
  reactions?: {
    like?: boolean;
    dislike?: boolean;
  };
}

export interface ChatState {
  messages: Message[];
  isLoading: boolean;
  error: string | null;
  threadId: string;
  isOffline?: boolean;
}

export interface WeatherApiRequest {
  messages: Array<{
    role: 'user' | 'assistant';
    content: string;
  }>;
  runId: string;
  maxRetries: number;
  maxSteps: number;
  temperature: number;
  topP: number;
  runtimeContext: Record<string, unknown>;
  threadId: string;
  resourceId: string;
}