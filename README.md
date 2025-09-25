# Deployed Link
https://weather-agent-chat-pazago.vercel.app/

# Weather Agent Chat Interface

A beautiful, responsive chat interface for interacting with a weather AI agent. Built with React, TypeScript, and Tailwind CSS.

## 🌟 Features

- **Real-time Streaming Chat**: Seamless conversation with weather AI agent
- **Responsive Design**: Optimized for mobile, tablet, and desktop (320px+)
- **Beautiful UI**: Weather-themed design with smooth animations
- **Error Handling**: Robust error handling with retry functionality
- **TypeScript**: Full type safety throughout the application
- **Accessibility**: ARIA labels and keyboard navigation support

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm

## Weather Agent Chat – React + Node

A responsive chat interface that fetches weather information with a Node backend.

## Tech Stack
- React 18 + TypeScript (Vite)
- Tailwind CSS
- Node.js (Express) backend
- Icons: lucide-react

## Features
- Chat UI: input + send, history, user right/agent left, auto‑scroll
- Loading/typing indicators, error banner, retry, clear chat
- Message timestamps, Enter to send, disabled states during request
- Dark/light theme toggle
- Message search in the current thread
- Export chat history (JSON)
- Multiple threads with localStorage persistence and thread switcher

Not included (can be added on request): streaming UI from Mastra, unit tests, PWA/SSR, sound notifications, delivery status badges for assistant (user has sending/sent/failed), comprehensive a11y review.

## APIs Used
Backend route your app calls now:
- POST http://localhost:3001/api/weather-full
  - Body: { "message": "What's the weather in Mumbai?" }
  - Returns: { content, current, next24h, weekly, location, raw }

External APIs used by backend (no key required):
- Geocoding: https://geocoding-api.open-meteo.com/v1/search
- Forecast: https://api.open-meteo.com/v1/forecast

Optional (present but off by default):
- POST http://localhost:3001/api/mastra-weather → Proxies the assignment’s Mastra endpoint with threadId=70. Set BACKEND_API_KEY to enable Authorization.

## Prerequisites
- Node.js 18+
- npm

## Setup
```bash
npm install
```

## Run (recommended, two terminals)
Terminal A – backend:
```bash
node server/index.js
# Verify: open http://localhost:3001/api/health → { ok: true, service: "weather-backend" }
```

Terminal B – frontend:
```bash
npm run dev
# Open the printed Vite URL, e.g., http://localhost:5175
```

Single command alternative (starts both):
```bash
npm run dev
# If it picks a different Vite port (5173 busy), use the printed one (5174/5175/5176)
```

## Using the App
- Type a question like: “What’s the weather in Mumbai?”
- You’ll see current conditions, next‑24h rain, and weekly outlook.
- Use the header buttons to: New thread, Toggle theme, Export chat, Search messages.

## Optional: Use Mastra Agent (Document 1)
If you must call the Mastra agent instead of Open‑Meteo:
1) Set your key in the same terminal that will run the app (PowerShell example):
```powershell
$env:BACKEND_API_KEY="<your-key>"
```
2) Keep backend running: `node server/index.js`
3) Switch frontend to call the Mastra proxy if needed (currently set to weather-full). The backend route is already available at:
- POST http://localhost:3001/api/mastra-weather
  - Body: { "message": "What's the weather in London?", "threadId": "70" }

Note: Frontend directly calling the Mastra cloud endpoint is not recommended due to CORS and key security.

## Project Scripts
- `npm run dev` – starts backend (nodemon) + frontend (Vite)
- `npm run build` – build frontend
- `npm run preview` – preview built frontend
- `npm run lint` – run ESLint

## Folder Structure
```
project/
  server/index.js           # Express backend (weather-full, mastra-weather, health)
  src/                      # React app
    components/             # Chat UI components
    hooks/useChat.ts        # Chat state + API integration + threads
    types/chat.ts           # Message and chat types
  vite.config.ts            # Vite + dev proxy
  tailwind.config.js        # Tailwind setup
  README.md                 # This file
```

## Assumptions
- Open‑Meteo is acceptable for weather data (free, no key). Mastra proxy is provided but optional.
- Multi-threading stored in localStorage is sufficient for the assignment.

## Known Limitations / Future Work
- Mastra streaming UI not enabled by default.
- No unit tests yet.
- No sound notifications toggle yet.
- a11y can be improved further (landmarks/roles coverage).
- No PWA/SSR by default.

## License
MIT

1. **Clone and navigate to project**
```bash
git clone <repository-url>
cd weather-chat-interface
```

2. **Install dependencies**
```bash
npm install
```

3. **Start development server**
```bash
npm run dev
```

4. **Open your browser**
Navigate to `http://localhost:5173`

## 🏗️ Architecture

### Component Structure
```
src/
├── components/           # React components
│   ├── ChatWindow.tsx   # Main chat container
│   ├── ChatMessage.tsx  # Individual message bubbles
│   ├── ChatInput.tsx    # Message input with suggestions
│   ├── ChatHeader.tsx   # Header with actions
│   ├── ErrorMessage.tsx # Error handling UI
│   └── WelcomeMessage.tsx # Landing screen
├── hooks/               # Custom React hooks
│   └── useChat.ts       # Chat state management & API integration
├── types/               # TypeScript definitions
│   └── chat.ts          # Message and API types
└── App.tsx              # Root component
```

### Key Features

#### Streaming API Integration
- Real-time message streaming from weather API
- Proper handling of Server-Sent Events
- Automatic reconnection on connection loss
- Loading states and error handling

#### State Management
- Custom `useChat` hook for centralized chat logic
- Optimistic UI updates for better UX
- Message history persistence during session
- Proper cleanup of resources

#### Responsive Design
- Mobile-first approach with Tailwind CSS
- Breakpoints: 320px (mobile), 768px (tablet), 1024px (desktop)
- Touch-friendly interactions on mobile
- Keyboard shortcuts for desktop (Enter to send)

## 🎨 Design System

### Colors
- **Primary**: Sky blue (#0EA5E9) for user messages
- **Secondary**: Orange (#F97316) for agent branding
- **Background**: Light gray (#F9FAFB) for contrast
- **Text**: Dark gray (#1F2937) for readability

### Typography
- **Font**: System font stack for optimal performance
- **Hierarchy**: Clear visual hierarchy with proper sizing
- **Line Height**: 150% for body text, 120% for headings

### Animations
- Smooth message appearance with CSS transitions
- Typing indicators for streaming responses
- Hover states for interactive elements
- Scroll animations for message history

## 🔧 API Integration

The chat interface connects to the Mastra Weather Agent API:

**Endpoint**: `POST /api/agents/weatherAgent/stream`

**Features**:
- Streaming responses for real-time chat experience
- Context-aware conversations with message history
- Error handling and retry mechanisms
- Rate limiting and timeout management

**Configuration**:
- Thread ID: Configurable per user session
- Temperature: 0.5 for balanced responses
- Max retries: 2 attempts for failed requests
- Max steps: 5 for complex weather queries

## 🧪 Sample Queries

Try these weather queries to test the interface:

- "What's the weather in London?"
- "Will it rain tomorrow in New York?"
- "Weather forecast for next week in Tokyo"
- "Current temperature in Sydney"
- "Is it sunny in Miami right now?"

## 🛠️ Development

### Available Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build production bundle
- `npm run preview` - Preview production build locally
- `npm run lint` - Run ESLint for code quality

### Code Quality

- **ESLint**: Configured with React and TypeScript rules
- **TypeScript**: Strict mode enabled for type safety
- **Prettier**: Code formatting (configure in your editor)
- **File Organization**: Modular component structure

### Browser Support

- Modern browsers with ES2020+ support
- Chrome 88+, Firefox 78+, Safari 14+, Edge 88+
- Mobile browsers: iOS Safari 14+, Chrome Mobile 88+

## 📱 Mobile Optimization

- Touch-friendly buttons and inputs
- Optimized keyboard handling
- Responsive message bubbles
- Smooth scrolling on iOS
- PWA-ready architecture

## 🚧 Known Limitations

- API rate limiting may cause temporary delays
- Long messages may take time to stream completely
- Network connectivity affects real-time experience (now shows offline error and disables input)
- Chat history cleared on page refresh (per-thread persistence via localStorage is implemented)

## Evaluation Criteria 📊

- **Technical Implementation — 40%**
  - Quality of React implementation, component architecture, reusability
  - State management with custom hook and thread persistence
  - Proper use of hooks and API integration, error handling
- **User Experience — 30%**
  - Usability, intuitiveness, responsiveness, visual consistency
  - Loading states, typing indicator, user feedback, disabled states
- **Code Quality — 20%**
  - Readability, maintainability, performance considerations
  - Adherence to best practices and documentation
- **Innovation & Polish — 10%**
  - Creative problem solving, attention to detail, bonus features

## Sample Test Cases 🧪

Include steps, expected, and actual result when you test.

### Test Case 1 — Basic Interaction
- Steps: Open the app. Send message: "What's the weather in London?"
- Expected: Agent returns weather for London (temperature, condition, forecast). No UI overflow.

### Test Case 2 — Error Handling (offline)
- Steps: Disable network (or simulate offline). Send any message.
- Expected: App shows a clear network/offline error and does not crash. Retry enabled when back online.

### Test Case 3 — Multiple Messages
- Steps: Send several messages in sequence (3–5 different queries).
- Expected: Conversation remains intact, messages render in order, agent responds to each.

### Test Case 4 — Edge Cases
- Subcase A — Very long messages
  - Steps: Send an extremely long message (several paragraphs).
  - Expected: UI wraps/scrolls; response ok or helpful message if truncated.
- Subcase B — Empty messages
  - Steps: Press send with empty input.
  - Expected: App prevents sending and keeps button disabled.
- Subcase C — Special characters
  - Steps: Send messages with emojis, HTML tags, and special characters (<script>, 😀, &<>).
  - Expected: App safely renders as plain text; no XSS, no layout breaks.

## 🔮 Future Enhancements

- [ ] Message search functionality
- [ ] Export chat history
- [ ] Dark/light theme toggle
- [ ] Voice input support
- [ ] Weather map integration
- [ ] Push notifications
- [ ] Offline message queuing

## 📄 License

MIT License - see LICENSE file for details

---

Built with ❤️ using React, TypeScript, and Tailwind CSS
