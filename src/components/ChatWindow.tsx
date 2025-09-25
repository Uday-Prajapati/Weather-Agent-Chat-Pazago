import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ChatMessage } from './ChatMessage';
import { ChatInput } from './ChatInput';
import { ChatHeader } from './ChatHeader';
import { ErrorMessage } from './ErrorMessage';
import { WelcomeMessage } from './WelcomeMessage';
import { useChat } from '../hooks/useChat';

export const ChatWindow: React.FC = () => {
  const {
    messages,
    isLoading,
    error,
    threadId,
    threadList,
    sendMessage,
    clearChat,
    retryLastMessage,
    startNewThread,
    switchThread,
  } = useChat();

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const dismissError = () => {
    // Error will be cleared automatically on next message send
  };

  const [isDark, setIsDark] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const root = document.documentElement;
    if (isDark) root.classList.add('dark');
    else root.classList.remove('dark');
  }, [isDark]);

  const filteredMessages = useMemo(() => {
    if (!search.trim()) return messages;
    const q = search.toLowerCase();
    return messages.filter(m => m.content.toLowerCase().includes(q));
  }, [messages, search]);

  const exportChat = () => {
    const blob = new Blob([JSON.stringify(messages, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `chat-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50 dark:bg-gray-900">
      <ChatHeader
        onClearChat={clearChat}
        onRetry={retryLastMessage}
        messageCount={messages.length}
        isLoading={isLoading}
        onToggleTheme={() => setIsDark(v => !v)}
        isDark={isDark}
        onNewThread={startNewThread}
        onExport={exportChat}
        onToggleSearch={() => setShowSearch(s => !s)}
      />

      <div className="flex-1 overflow-hidden flex flex-col">
        {messages.length === 0 ? (
          <WelcomeMessage
            onSampleQuery={sendMessage}
            isLoading={isLoading}
          />
        ) : (
          <div className="flex-1 overflow-y-auto">
            <div className="p-2 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 flex items-center gap-2 overflow-x-auto">
              {threadList.map((id) => (
                <button
                  key={id}
                  onClick={() => switchThread(id)}
                  className={`px-3 py-1 text-xs rounded-full border transition-colors ${id === threadId ? 'bg-blue-600 text-white border-blue-600' : 'bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-100 border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800'}`}
                  title={`Thread ${id}`}
                >
                  {id === threadId ? 'Current' : id}
                </button>
              ))}
            </div>
            {showSearch && (
              <div className="p-3 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search messages..."
                  className="w-full px-3 py-2 rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm text-gray-800 dark:text-gray-100 outline-none"
                />
              </div>
            )}
            <div className="p-4 space-y-1">
              {filteredMessages.map((message) => (
                <ChatMessage key={message.id} message={message} />
              ))}
              <div ref={messagesEndRef} />
            </div>
          </div>
        )}

        {error && (
          <ErrorMessage
            error={error}
            onRetry={retryLastMessage}
            onDismiss={dismissError}
          />
        )}
      </div>

      <ChatInput
        onSendMessage={sendMessage}
        isLoading={isLoading}
        disabled={!!error}
      />
    </div>
  );
};