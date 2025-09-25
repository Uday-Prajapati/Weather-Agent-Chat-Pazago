import React from 'react';
import { Cloud, MapPin, Sun, CloudRain } from 'lucide-react';

interface WelcomeMessageProps {
  onSampleQuery: (query: string) => void;
  isLoading: boolean;
}

export const WelcomeMessage: React.FC<WelcomeMessageProps> = ({
  onSampleQuery,
  isLoading,
}) => {
  const sampleQueries = [
    {
      icon: <MapPin size={16} />,
      text: "What's the weather in Tokyo?",
      description: "Current conditions"
    },
    {
      icon: <CloudRain size={16} />,
      text: "Will it rain tomorrow in Paris?",
      description: "Tomorrow's forecast"
    },
    {
      icon: <Sun size={16} />,
      text: "Weather forecast for next week in Sydney",
      description: "Weekly outlook"
    }
  ];

  return (
    <div className="flex-1 flex items-center justify-center p-8">
      <div className="max-w-lg text-center">
        <div className="mb-6">
          <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
            <Cloud size={32} className="text-white" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            Weather Agent Chat
          </h2>
          <p className="text-gray-600">
            Ask me about weather conditions anywhere in the world! I can provide current weather, forecasts, and more.
          </p>
        </div>

        <div className="space-y-3">
          <p className="text-sm font-medium text-gray-700 mb-3">Try asking:</p>
          {sampleQueries.map((query, index) => (
            <button
              key={index}
              onClick={() => onSampleQuery(query.text)}
              disabled={isLoading}
              className="w-full p-4 text-left bg-white border border-gray-200 rounded-lg hover:border-blue-300 hover:shadow-md transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed group"
            >
              <div className="flex items-start space-x-3">
                <div className="text-blue-500 mt-0.5">
                  {query.icon}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-800 group-hover:text-blue-600 transition-colors">
                    "{query.text}"
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {query.description}
                  </p>
                </div>
              </div>
            </button>
          ))}
        </div>

        <div className="mt-6 text-xs text-gray-500">
          Powered by advanced weather data • Real-time updates
        </div>
      </div>
    </div>
  );
};