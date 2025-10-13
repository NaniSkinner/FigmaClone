# Mockup Matcha Hub MVP 🍵

A real-time collaborative canvas application built with Next.js, Firebase, and Konva.js. Create and move objects while seeing other users' cursors in real-time.

## Features

- 🎨 Infinite canvas with pan and zoom
- 📦 Create and move rectangle objects
- 👥 Real-time cursor presence
- 🔄 Live synchronization across users
- 💾 Persistent canvas state
- 🔐 Anonymous or email authentication

## Tech Stack

- **Frontend**: Next.js 14 with App Router, TypeScript, Tailwind CSS
- **Canvas**: Konva.js + react-konva
- **Backend**: Firebase (Firestore + Authentication)
- **State Management**: Zustand
- **Deployment**: Vercel

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- A Firebase project ([Create one here](https://console.firebase.google.com/))

### Firebase Setup

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project or select an existing one
3. Enable **Firestore Database**:
   - Go to Firestore Database
   - Click "Create database"
   - Start in production mode (we'll set rules later)
4. Enable **Authentication**:
   - Go to Authentication
   - Enable Email/Password provider
   - Enable Anonymous provider
5. Get your Firebase configuration:
   - Go to Project Settings (gear icon)
   - Scroll down to "Your apps"
   - Copy the configuration values

### Installation

1. Clone the repository and navigate to the project:

```bash
cd mockup-matcha-hub
```

2. Install dependencies:

```bash
npm install
```

3. Create a `.env.local` file in the root directory:

```bash
# Copy the example
cp .env.example .env.local
```

4. Edit `.env.local` and add your Firebase credentials:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key_here
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

5. Run the development server:

```bash
npm run dev
```

6. Open [http://localhost:3000](http://localhost:3000) in your browser

### Firestore Security Rules

Add these rules to your Firestore database:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users collection
    match /users/{userId} {
      allow read: if true;
      allow write: if request.auth != null && request.auth.uid == userId;
    }

    // Presence collection
    match /presence/{userId} {
      allow read: if true;
      allow write: if request.auth != null && request.auth.uid == userId;
    }

    // Canvas objects
    match /canvas/{canvasId}/objects/{objectId} {
      allow read: if true;
      allow create: if request.auth != null;
      allow update, delete: if request.auth != null;
    }

    // Canvas metadata
    match /canvases/{canvasId} {
      allow read: if true;
      allow write: if request.auth != null;
    }
  }
}
```

## Project Structure

```
mockup-matcha-hub/
├── src/
│   ├── app/                 # Next.js app directory
│   │   ├── layout.tsx      # Root layout
│   │   ├── page.tsx        # Main canvas page
│   │   └── auth/           # Authentication pages
│   ├── components/         # React components
│   │   ├── Canvas/         # Canvas-related components
│   │   ├── Multiplayer/    # Presence & cursor components
│   │   ├── Objects/        # Canvas objects (Rectangle, etc.)
│   │   └── Auth/           # Authentication components
│   ├── hooks/              # Custom React hooks
│   │   ├── useAuth.ts
│   │   ├── useCanvas.ts
│   │   ├── useMultiplayer.ts
│   │   └── useRealtimeSync.ts
│   ├── lib/                # Utilities and config
│   │   ├── firebase.ts     # Firebase initialization
│   │   ├── constants.ts    # App constants
│   │   └── utils.ts        # Helper functions
│   ├── store/              # Zustand state management
│   │   ├── userStore.ts
│   │   ├── canvasStore.ts
│   │   └── index.ts
│   └── types/              # TypeScript type definitions
│       ├── user.ts
│       ├── canvas.ts
│       └── index.ts
└── public/                 # Static assets
```

## Development Roadmap

### PR #1: Project Foundation ✅

- [x] Next.js setup
- [x] Firebase configuration
- [x] Type definitions
- [x] Zustand stores

### PR #2: Authentication (Next)

- [ ] Auth hooks
- [ ] Login/signup components
- [ ] User color generation
- [ ] Protected routes

### PR #3: Real-time Cursor Presence

- [ ] Cursor tracking
- [ ] Presence system
- [ ] Online users list

### PR #4: Canvas Implementation

- [ ] Konva.js integration
- [ ] Pan and zoom
- [ ] Viewport management

### PR #5: Object Creation & Sync

- [ ] Rectangle creation
- [ ] Object movement
- [ ] Real-time synchronization

### PR #6: State Persistence

- [ ] Canvas persistence
- [ ] Reconnection handling
- [ ] Loading states

### PR #7: Performance & Polish

- [ ] Optimizations
- [ ] Error handling
- [ ] UX improvements

### PR #8: Final Testing & Deployment

- [ ] Multi-user testing
- [ ] Bug fixes
- [ ] Vercel deployment

## Performance Targets

- ⚡ Cursor updates: <50ms latency
- 🔄 Object sync: <100ms latency
- 🎯 60 FPS rendering
- 📦 Support 50+ objects per canvas
- 👥 Support 5+ concurrent users

## Testing

Run the test suite:

```bash
npm test
```

Run tests in watch mode:

```bash
npm test -- --watch
```

## Deployment

### Deploy to Vercel

1. Push your code to GitHub
2. Go to [Vercel](https://vercel.com/)
3. Import your repository
4. Add environment variables from `.env.local`
5. Deploy!

The app will be available at your Vercel URL.

## Known Limitations (MVP)

- Single object type (rectangles only)
- No object deletion
- No undo/redo
- No text or other shapes
- Basic styling only

## Future Enhancements

- Multiple shape types (circles, text, images)
- Advanced selection (multi-select, grouping)
- Styling controls (colors, borders, shadows)
- Undo/redo functionality
- Export canvas as image
- Collaborative permissions
- Canvas templates

## Contributing

This is an MVP project. PRs are organized sequentially (PR #1 through PR #8) to build the application step by step.

## License

GAUNTLET

---

Built with 🍵 matcha love as a 24-hour sprint MVP
