import { useState, useCallback, useRef, useEffect } from 'react';
import { Message, ChatState } from '../types/chat';

// Backend endpoint (Open-Meteo via our Node server)
const WEATHER_API_ENDPOINT = 'http://localhost:3001/api/weather-full';

// Roll number as thread ID
const THREAD_ID = '70';

export const useChat = () => {
  const [state, setState] = useState<ChatState>({
    messages: [],
    isLoading: false,
    error: null,
    threadId: THREAD_ID,
  });
  const [threadList, setThreadList] = useState<string[]>([]);

  const abortControllerRef = useRef<AbortController | null>(null);

  // Load threads and current thread messages from localStorage on mount
  useEffect(() => {
    const storedThreads = JSON.parse(localStorage.getItem('threads') || '[]') as string[];
    const threads = storedThreads.length ? storedThreads : [THREAD_ID];
    setThreadList(threads);
    const current = localStorage.getItem(`thread:${state.threadId}`);
    if (current) {
      try {
        const parsed = JSON.parse(current) as { messages: Message[] };
        setState(prev => ({ ...prev, messages: parsed.messages || [] }));
      } catch {}
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Persist messages per thread
  useEffect(() => {
    localStorage.setItem('threads', JSON.stringify(threadList));
    localStorage.setItem(`thread:${state.threadId}`, JSON.stringify({ messages: state.messages }));
  }, [state.threadId, state.messages, threadList]);

  const sendMessageToWeatherAgent = async (messages: Array<{role: 'user' | 'assistant', content: string}>) => {
    const lastUser = [...messages].reverse().find(m => m.role === 'user');
    const requestBody = {
      message: lastUser?.content ?? '',
    };

    const response = await fetch(WEATHER_API_ENDPOINT, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
      signal: abortControllerRef.current?.signal,
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error');
      throw new Error(`Weather Agent API request failed: ${response.status} ${response.statusText} - ${errorText}`);
    }

    return response;
  };

  const processWeatherAgentResponse = async (response: Response, assistantMessage: Message) => {
    const data = await response.json();
    const text = data?.content || '';
    setState(prev => ({
      ...prev,
      messages: prev.messages.map(msg =>
        msg.id === assistantMessage.id ? { ...msg, content: text, isStreaming: false } : msg
      ),
      isLoading: false,
    }));
  };

  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim() || state.isLoading) return;

    // Cancel any ongoing request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: content.trim(),
      timestamp: new Date(),
      status: 'sending',
    };

    setState(prev => ({
      ...prev,
      messages: [...prev.messages, userMessage],
      isLoading: true,
      error: null,
    }));

    let assistantId: string | null = null;
    try {
      abortControllerRef.current = new AbortController();
      
      const messageHistory = [
        ...state.messages.map(msg => ({
          role: msg.role as 'user' | 'assistant',
          content: msg.content,
        })),
        {
          role: 'user' as const,
          content: content.trim(),
        }
      ];

      const assistantMessage: Message = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: '',
        timestamp: new Date(),
        isStreaming: true,
      };
      assistantId = assistantMessage.id;

      setState(prev => ({
        ...prev,
        messages: [...prev.messages, assistantMessage],
      }));

      try {
        const response = await sendMessageToWeatherAgent(messageHistory);
        // Mark user as sent upon successful request dispatch
        setState(prev => ({
          ...prev,
          messages: prev.messages.map(m => m.id === userMessage.id ? { ...m, status: 'sent' } : m),
        }));
        await processWeatherAgentResponse(response, assistantMessage);
      } catch (error: any) {
        throw error;
      }

    } catch (error: any) {
      if (error.name === 'AbortError') {
        return; // Request was cancelled, don't show error
      }

      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error.message || 'Failed to get weather information. Please try again.',
        messages: prev.messages.map(m =>
          m.id === userMessage.id ? { ...m, status: 'failed' } : m
        ).filter(msg => (assistantId ? msg.id !== assistantId : true)),
      }));
    }
  }, [state.messages, state.isLoading]);

  const clearChat = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    setState({
      messages: [],
      isLoading: false,
      error: null,
      threadId: THREAD_ID,
    });
  }, []);

  const startNewThread = useCallback(() => {
    const newId = String(Date.now());
    setThreadList(prev => [newId, ...prev]);
    setState(prev => ({ ...prev, threadId: newId, messages: [] }));
  }, []);

  const switchThread = useCallback((id: string) => {
    if (id === state.threadId) return;
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const stored = localStorage.getItem(`thread:${id}`);
    let msgs: Message[] = [];
    if (stored) {
      try {
        msgs = (JSON.parse(stored) as { messages: Message[] }).messages || [];
      } catch {}
    }
    setState(prev => ({ ...prev, threadId: id, messages: msgs, isLoading: false, error: null }));
    if (!threadList.includes(id)) setThreadList(prev => [id, ...prev]);
  }, [state.threadId, threadList]);

  const toggleReaction = useCallback((messageId: string, reaction: 'like' | 'dislike') => {
    setState(prev => ({
      ...prev,
      messages: prev.messages.map(m => {
        if (m.id !== messageId) return m;
        const like = reaction === 'like' ? !m.reactions?.like : !!m.reactions?.like;
        const dislike = reaction === 'dislike' ? !m.reactions?.dislike : !!m.reactions?.dislike;
        return { ...m, reactions: { like, dislike } };
      })
    }));
  }, []);

  const retryLastMessage = useCallback(() => {
    if (state.messages.length === 0) return;
    
    const lastUserMessage = [...state.messages]
      .reverse()
      .find(msg => msg.role === 'user');
    
    if (lastUserMessage) {
      // Remove any failed assistant messages
      setState(prev => ({
        ...prev,
        messages: prev.messages.filter(msg => 
          !(msg.role === 'assistant' && msg.content === '')
        ),
        error: null,
      }));
      
      sendMessage(lastUserMessage.content);
    }
  }, [state.messages, sendMessage]);

  return {
    ...state,
    threadList,
    sendMessage,
    clearChat,
    startNewThread,
    switchThread,
    toggleReaction,
    retryLastMessage,
  };
};