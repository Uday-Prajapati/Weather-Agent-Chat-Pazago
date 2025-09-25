import React from 'react';
import { AlertCircle, RotateCcw, X } from 'lucide-react';

interface ErrorMessageProps {
  error: string;
  onRetry?: () => void;
  onDismiss: () => void;
}

export const ErrorMessage: React.FC<ErrorMessageProps> = ({
  error,
  onRetry,
  onDismiss,
}) => {
  return (
    <div className="mx-4 my-2">
      <div className="bg-red-50 border border-red-200 rounded-lg p-3">
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-2">
            <AlertCircle size={16} className="text-red-500 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm text-red-800 font-medium">Error</p>
              <p className="text-xs text-red-700 mt-1">{error}</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-1">
            {onRetry && (
              <button
                onClick={onRetry}
                className="p-1 hover:bg-red-100 rounded transition-colors duration-200"
                title="Retry"
              >
                <RotateCcw size={14} className="text-red-500" />
              </button>
            )}
            <button
              onClick={onDismiss}
              className="p-1 hover:bg-red-100 rounded transition-colors duration-200"
              title="Dismiss"
            >
              <X size={14} className="text-red-500" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};