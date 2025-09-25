import React from 'react';
import { Cloud, RotateCcw, Trash2 } from 'lucide-react';

interface ChatHeaderProps {
  onClearChat: () => void;
  onRetry?: () => void;
  messageCount: number;
  isLoading: boolean;
}

export const ChatHeader: React.FC<ChatHeaderProps> = ({
  onClearChat,
  onRetry,
  messageCount,
  isLoading,
}) => {
  return (
    <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-4 shadow-lg">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
            <Cloud size={20} />
          </div>
          <div>
            <h1 className="text-lg font-semibold">Weather Agent</h1>
            <p className="text-sm text-blue-100">
              {isLoading ? 'Getting weather data...' : 'Ask me about weather anywhere!'}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {onRetry && messageCount > 0 && (
            <button
              onClick={onRetry}
              disabled={isLoading}
              className="p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              title="Retry last message"
            >
              <RotateCcw size={18} />
            </button>
          )}
          
          {messageCount > 0 && (
            <button
              onClick={onClearChat}
              disabled={isLoading}
              className="p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              title="Clear chat"
            >
              <Trash2 size={18} />
            </button>
          )}
        </div>
      </div>

      {messageCount > 0 && (
        <div className="mt-2 text-xs text-blue-100">
          {messageCount} message{messageCount !== 1 ? 's' : ''}
        </div>
      )}
    </div>
  );
};