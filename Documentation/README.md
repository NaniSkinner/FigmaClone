#  Mockup Matcha Hub

A **real-time collaborative canvas** application built with Next.js, Firebase, and Konva.js. Design mockups together with your team and see everyone's cursor movements in real-time!

[![Next.js](https://img.shields.io/badge/Next.js-15.5-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue)](https://www.typescriptlang.org/)
[![Firebase](https://img.shields.io/badge/Firebase-12.4-orange)](https://firebase.google.com/)
[![License](https://img.shields.io/badge/License-GAUNTLET-green)](./LICENSE)

##  Features

###  Canvas & Objects

- **Infinite canvas** with smooth pan and zoom controls
- **Draw rectangles** by click & drag
- **Move and resize** objects with intuitive controls
- **Delete objects** using Delete/Backspace keys
- **Fit to screen** - automatic canvas centering and zoom
- **Persistent state** - your work is saved in real-time

###  Real-time Collaboration

- **Live cursor tracking** - see where others are working
- **User presence** - know who's online with draggable user list
- **User join/leave notifications** - stay informed of collaborators
- **Color-coded cursors** - each user gets a unique color
- **Anonymous usernames** - fun auto-generated names

###  Authentication

- **Email/Password** authentication
- **Anonymous login** for quick starts
- **Secure sessions** with Firebase Auth
- **Auto-generated profiles** with unique colors

###  User Experience

- **Responsive design** - works on desktop and mobile
- **Loading states** - smooth transitions
- **Error boundaries** - graceful error handling
- **Connection status** - know when you're offline
- **Matcha-themed UI** - beautiful green and purple design
- **Dark mode support** (removed in final version for consistency)

###  Performance

- **Throttled updates** - 20 FPS cursor, 10 FPS object sync
- **Optimized rendering** - React.memo on key components
- **Efficient state management** - Zustand for minimal re-renders
- **Real-time sync** - <100ms latency for object updates

##  Tech Stack

### Frontend

- **[Next.js 15.5](https://nextjs.org/)** - React framework with App Router
- **[TypeScript 5.9](https://www.typescriptlang.org/)** - Type-safe code
- **[Tailwind CSS 4.1](https://tailwindcss.com/)** - Utility-first styling
- **[Konva.js](https://konvajs.org/)** - Canvas rendering engine
- **[React-Konva](https://github.com/konvajs/react-konva)** - React bindings for Konva

### Backend

- **[Firebase Authentication](https://firebase.google.com/products/auth)** - User management
- **[Firestore](https://firebase.google.com/products/firestore)** - Real-time database
- **[Firebase Security Rules](https://firebase.google.com/docs/rules)** - Data protection

### State Management & Utils

- **[Zustand](https://github.com/pmndrs/zustand)** - Lightweight state management
- **[UUID](https://github.com/uuidjs/uuid)** - Unique ID generation

### Testing & Quality

- **[Jest](https://jestjs.io/)** - Unit testing
- **[React Testing Library](https://testing-library.com/react)** - Component testing
- **[ESLint](https://eslint.org/)** - Code linting

### Deployment

- **[Vercel](https://vercel.com/)** - Hosting and CI/CD

##  Getting Started

### Prerequisites

- **Node.js 18+** and npm
- A **Firebase project** ([Create one here](https://console.firebase.google.com/))

### Firebase Setup

1. **Create a Firebase Project**

   - Go to [Firebase Console](https://console.firebase.google.com/)
   - Click "Add project" and follow the prompts

2. **Enable Firestore Database**

   - Navigate to **Firestore Database** in the sidebar
   - Click "Create database"
   - Start in **production mode**
   - Choose a location close to your users

3. **Enable Authentication**

   - Navigate to **Authentication** in the sidebar
   - Click "Get started"
   - Enable **Email/Password** sign-in method
   - Enable **Anonymous** sign-in method

4. **Get Firebase Configuration**

   - Go to **Project Settings** ( icon)
   - Scroll to "Your apps" section
   - Click the web icon (`</>`) to add a web app
   - Register your app and copy the configuration values

5. **Set Firestore Security Rules**
   - Go to **Firestore Database** > **Rules** tab
   - Copy and paste the rules from below (see "Firestore Security Rules" section)

### Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/yourusername/mockup-matcha-hub.git
   cd mockup-matcha-hub/collabcanvas
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Create environment file**

   ```bash
   cp .env.example .env.local
   ```

4. **Add your Firebase credentials**
   Edit `.env.local` and add your Firebase config:

   ```env
   NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key_here
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
   NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
   ```

5. **Run the development server**

   ```bash
   npm run dev
   ```

6. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

### Firestore Security Rules

Add these rules to your Firestore database for secure access:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // Users collection - authenticated users can read all, write their own
    match /users/{userId} {
      allow read: if true;
      allow write: if request.auth != null && request.auth.uid == userId;
    }

    // Presence collection - for real-time cursor tracking
    match /presence/{userId} {
      allow read: if true;
      allow write: if request.auth != null && request.auth.uid == userId;
    }

    // Canvas objects - authenticated users can create, read, update, delete
    match /canvas/{canvasId}/objects/{objectId} {
      allow read: if true;
      allow create, update, delete: if request.auth != null;
    }

    // Canvas metadata
    match /canvases/{canvasId} {
      allow read: if true;
      allow write: if request.auth != null;
    }
  }
}
```

##  Usage

### Creating Your First Shape

1. **Sign in** with email or anonymously
2. **Click and drag** on the white canvas area to draw a rectangle
3. **Click and drag** the object to move it
4. **Click and drag** the corners to resize
5. Press **Delete** or **Backspace** to remove selected objects

### Navigation Controls

- **Mouse wheel** - Zoom in/out (centered on cursor)
- **Drag the grid area** - Pan the canvas
- **+/- buttons** - Zoom controls in toolbar
- **Reset button** - Return to 100% zoom and re-center

### Collaboration

- **Share your URL** - All users on the same page collaborate in real-time
- **Watch cursors** - See where other users are pointing
- **Online users panel** - Draggable list showing who's active
- **Notifications** - Get alerts when users join or leave

### Account Management

- **Logout** - Click the power button in the top-left corner
- **Profile** - Auto-generated username and color
- **Session** - Stays logged in until you sign out

##  Project Structure

```
mockup-matcha-hub/
 app/                          # Next.js App Router
‚    layout.tsx               # Root layout with providers
‚    page.tsx                 # Main canvas page
‚    auth/
‚   ‚    page.tsx             # Authentication page
‚    not-found.tsx            # 404 page
‚    globals.css              # Global styles
‚
 src/
‚    components/
‚   ‚    Auth/
‚   ‚   ‚    AuthGuard.tsx   # Protected route wrapper
‚   ‚   ‚    LoginForm.tsx   # Login/signup form
‚   ‚    Canvas/
‚   ‚   ‚    Canvas.tsx       # Main Konva canvas
‚   ‚   ‚    CanvasControls.tsx # Zoom controls toolbar
‚   ‚    Multiplayer/
‚   ‚   ‚    Cursor.tsx       # Individual cursor component
‚   ‚   ‚    CursorPresence.tsx # Cursor manager
‚   ‚   ‚    OnlineUsers.tsx  # Online users list
‚   ‚    Objects/
‚   ‚   ‚    Rectangle.tsx    # Rectangle shape component
‚   ‚   ‚    ObjectRenderer.tsx # Object list renderer
‚   ‚    UI/
‚   ‚   ‚    LoadingSpinner.tsx # Loading indicator
‚   ‚   ‚    ConnectionStatus.tsx # Online/offline status
‚   ‚    ErrorBoundary.tsx    # Error boundary wrapper
‚   ‚    Providers/
‚   ‚        ClientProviders.tsx # Client-side providers
‚   ‚
‚    hooks/
‚   ‚    useAuth.ts           # Authentication hook
‚   ‚    useCanvas.ts         # Canvas state (pan, zoom)
‚   ‚    useMultiplayer.ts    # Presence & cursor tracking
‚   ‚    useRealtimeSync.ts   # Firestore sync hook
‚   ‚
‚    lib/
‚   ‚    firebase.ts          # Firebase initialization
‚   ‚    constants.ts         # App constants & config
‚   ‚    utils.ts             # Helper functions
‚   ‚
‚    store/
‚   ‚    userStore.ts         # User state (Zustand)
‚   ‚    canvasStore.ts       # Canvas state (Zustand)
‚   ‚    index.ts             # Store exports
‚   ‚
‚    types/
‚   ‚    user.ts              # User type definitions
‚   ‚    canvas.ts            # Canvas type definitions
‚   ‚    index.ts             # Type exports
‚   ‚
‚    __tests__/               # Test files
‚        auth.test.ts
‚        multiplayer.test.ts
‚        canvas.test.ts
‚        objectSync.test.ts
‚
 public/                       # Static assets
 .env.local                    # Environment variables (not in git)
 .eslintrc.json               # ESLint configuration
 jest.config.js               # Jest configuration
 jest.setup.js                # Jest setup file
 next.config.ts               # Next.js configuration
 tailwind.config.js           # Tailwind CSS configuration
 tsconfig.json                # TypeScript configuration
 package.json                 # Dependencies & scripts
```

##  Testing

Run the full test suite:

```bash
npm test
```

Run tests in watch mode:

```bash
npm test -- --watch
```

Run linting:

```bash
npm run lint
```

##  Building for Production

Build the production bundle:

```bash
npm run build
```

Start the production server:

```bash
npm start
```

Test the production build locally:

```bash
npm run build && npm start
```

##  Deployment

### Deploy to Vercel (Recommended)

1. **Push to GitHub**

   ```bash
   git add .
   git commit -m "Ready for deployment"
   git push origin main
   ```

2. **Import to Vercel**

   - Go to [Vercel](https://vercel.com/)
   - Click "Import Project"
   - Select your GitHub repository
   - Vercel will auto-detect Next.js

3. **Add Environment Variables**

   - In Vercel project settings, go to "Environment Variables"
   - Add all variables from your `.env.local` file
   - Click "Deploy"

4. **Done!** Your app will be live at `your-project.vercel.app`

### Deploy to Other Platforms

This app can be deployed to any platform that supports Next.js:

- **Netlify** - Use the Next.js plugin
- **AWS Amplify** - Full serverless deployment
- **Railway** - Simple container deployment
- **DigitalOcean** - App Platform support

##  Development Roadmap

###  Completed

- **PR #1: Project Foundation** - Next.js setup, Firebase config, type definitions
- **PR #2: Authentication** - Email/password & anonymous auth, user profiles
- **PR #3: Real-time Cursor Presence** - Cursor tracking, online users list
- **PR #4: Canvas Implementation** - Konva.js integration, pan & zoom
- **PR #5: Object Creation & Synchronization** - Rectangle drawing, real-time sync
- **PR #6: State Persistence** - Canvas state saving, loading indicators
- **PR #7: Performance & Polish** - Error boundaries, React.memo, toast notifications
- **PR #8: Final Testing & Deployment** - ESLint setup, production build testing

###  Future Enhancements

- **More shapes** - Circles, triangles, lines, arrows
- **Text tool** - Add and edit text labels
- **Image upload** - Add images to canvas
- **Color picker** - Custom colors for objects
- **Layer management** - Bring to front, send to back
- **Undo/Redo** - Command history
- **Copy/Paste** - Duplicate objects
- **Multi-select** - Select and move multiple objects
- **Export** - Download canvas as PNG/SVG
- **Templates** - Pre-built mockup templates
- **Comments** - Leave feedback on designs
- **Permissions** - View-only mode for stakeholders
- **Version history** - Time-travel through changes

##  Performance Metrics

Target performance for optimal user experience:

-  **Cursor updates**: <50ms latency (20 FPS)
-  **Object sync**: <100ms latency (10 FPS)
-  **Rendering**: 60 FPS maintained
-  **Canvas capacity**: 50+ objects per canvas
-  **Concurrent users**: 5+ users simultaneous
-  **Initial load**: <2s time to interactive
-  **Build size**: Optimized with Next.js code splitting

##  Known Limitations (MVP Scope)

- Single canvas per session (no canvas selection)
- Rectangle shapes only (no circles, text, or images)
- Basic styling (no custom colors or borders)
- No undo/redo functionality
- No copy/paste functionality
- No export to image/PDF
- No permission system (all users can edit)
- No canvas versioning or history
- No mobile touch optimizations (works but not optimized)

##  Contributing

This project was built as a **24-hour MVP sprint** following a structured PR approach. Each PR builds on the previous one:

1. **Fork the repository**
2. **Create a feature branch** (`git checkout -b feature/amazing-feature`)
3. **Commit your changes** (`git commit -m 'Add amazing feature'`)
4. **Push to the branch** (`git push origin feature/amazing-feature`)
5. **Open a Pull Request**

##  License

This project is licensed under the **GAUNTLET** License.

##  Acknowledgments

- **Next.js Team** - For the amazing React framework
- **Firebase** - For the real-time backend infrastructure
- **Konva.js** - For the powerful canvas library
- **Vercel** - For seamless deployment
- **Matcha** - For the inspiration 

##  Contact

Questions? Issues? Suggestions?

- **GitHub Issues**: [Report a bug](https://github.com/yourusername/mockup-matcha-hub/issues)
- **Discussions**: [Start a discussion](https://github.com/yourusername/mockup-matcha-hub/discussions)

---

**Built with  matcha love during a 24-hour development sprint**

_Mockup Matcha Hub - Where design collaboration meets real-time magic_ 
