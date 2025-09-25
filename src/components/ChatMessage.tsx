import React from 'react';
import { Message } from '../types/chat';
import { Cloud, User } from 'lucide-react';

interface ChatMessageProps {
  message: Message;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
  const isUser = message.role === 'user';
  const formatTime = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4 group`}>
      <div
        className={`flex max-w-xs lg:max-w-md xl:max-w-lg ${
          isUser ? 'flex-row-reverse' : 'flex-row'
        } items-end space-x-2`}
      >
        {/* Avatar */}
        <div
          className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
            isUser
              ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white'
              : 'bg-gradient-to-br from-orange-400 to-orange-500 text-white'
          } shadow-md`}
        >
          {isUser ? (
            <User size={16} />
          ) : (
            <Cloud size={16} />
          )}
        </div>

        {/* Message bubble */}
        <div className="flex flex-col">
          <div
            className={`px-4 py-2 rounded-2xl shadow-sm transition-all duration-200 ${
              isUser
                ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white ml-2'
                : 'bg-white border border-gray-200 text-gray-800 mr-2'
            } ${
              isUser
                ? 'rounded-br-md'
                : 'rounded-bl-md'
            } relative`}
          >
            {/* Streaming indicator */}
            {message.isStreaming && (
              <div className="flex items-center space-x-1 mb-1">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-orange-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-orange-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-orange-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
                <span className="text-xs text-gray-500">Weather agent is typing...</span>
              </div>
            )}
            
            <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
              {message.content}
            </p>
            
            {/* Tail for speech bubble */}
            <div
              className={`absolute top-4 w-0 h-0 ${
                isUser
                  ? 'right-0 transform translate-x-full border-l-8 border-l-blue-500 border-t-4 border-t-transparent border-b-4 border-b-transparent'
                  : 'left-0 transform -translate-x-full border-r-8 border-r-white border-t-4 border-t-transparent border-b-4 border-b-transparent'
              }`}
            />
          </div>

          {/* Timestamp */}
          <div
            className={`text-xs text-gray-400 mt-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 ${
              isUser ? 'text-right mr-2' : 'text-left ml-2'
            }`}
          >
            {formatTime(message.timestamp)}
          </div>
        </div>
      </div>
    </div>
  );
};