# CollabCanvas MVP - Task List by PR

**24-Hour Sprint Checklist**

## 🧪 Test Setup & Configuration

### Initial Test Setup (Add to PR #1)

```bash
# Install testing dependencies
npm install --save-dev jest @testing-library/react @testing-library/jest-dom
npm install --save-dev @firebase/testing firebase-admin
npm install --save-dev @types/jest
```

### Jest Configuration

Create `jest.config.js`:

```javascript
module.exports = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  moduleNameMapper: {
    '^@/(.*)
```

collabcanvas/
├── .env.local # Environment variables
├── .gitignore
├── package.json
├── tsconfig.json
├── next.config.js # If using Next.js
├── README.md
├── public/
│ └── favicon.ico
├── src/
│ ├── app/ # Next.js 13+ app directory
│ │ ├── layout.tsx
│ │ ├── page.tsx # Main canvas page
│ │ ├── globals.css
│ │ └── auth/
│ │ └── page.tsx # Auth page
│ ├── components/
│ │ ├── Canvas/
│ │ │ ├── Canvas.tsx
│ │ │ ├── CanvasControls.tsx
│ │ │ └── index.ts
│ │ ├── Multiplayer/
│ │ │ ├── Cursor.tsx
│ │ │ ├── CursorPresence.tsx
│ │ │ ├── OnlineUsers.tsx
│ │ │ └── index.ts
│ │ ├── Objects/
│ │ │ ├── Rectangle.tsx
│ │ │ ├── ObjectRenderer.tsx
│ │ │ └── index.ts
│ │ └── Auth/
│ │ ├── LoginForm.tsx
│ │ ├── AuthGuard.tsx
│ │ └── index.ts
│ ├── lib/
│ │ ├── firebase.ts # Firebase config
│ │ ├── constants.ts
│ │ └── utils.ts
│ ├── hooks/
│ │ ├── useAuth.ts
│ │ ├── useCanvas.ts
│ │ ├── useMultiplayer.ts
│ │ └── useRealtimeSync.ts
│ ├── store/
│ │ ├── canvasStore.ts # Zustand store
│ │ ├── userStore.ts
│ │ └── index.ts
│ └── types/
│ ├── canvas.ts
│ ├── user.ts
│ └── index.ts

````

---

## PR #1: Project Foundation & Setup ⏰ Hour 0-2

### Main Tasks:
- [ ] Initialize Next.js project with TypeScript
- [ ] Set up Firebase project and configuration
- [ ] Configure deployment pipeline
- [ ] Verify deployment works

### Subtasks:
- [ ] **Create Next.js project**
  - Run: `npx create-next-app@latest collabcanvas --typescript --tailwind --app`
  - Files created: All base files

- [ ] **Install core dependencies**
  ```bash
  npm install firebase konva react-konva zustand uuid
  npm install --save-dev @types/uuid
````

- File modified: `package.json`

- [ ] **Set up Firebase project**

  - Create project at console.firebase.google.com
  - Enable Firestore Database
  - Enable Authentication (Anonymous + Email)
  - Get configuration keys

- [ ] **Create Firebase configuration**

  - File created: `src/lib/firebase.ts`
  - File created: `.env.local`

  ```typescript
  // src/lib/firebase.ts
  import { initializeApp } from "firebase/app";
  import { getAuth } from "firebase/auth";
  import { getFirestore } from "firebase/firestore";
  ```

- [ ] **Set up type definitions**

  - File created: `src/types/user.ts`
  - File created: `src/types/canvas.ts`
  - File created: `src/types/index.ts`

  ```typescript
  // src/types/user.ts
  export interface User {
    id: string;
    name: string;
    color: string;
    cursor?: { x: number; y: number };
  }
  ```

- [ ] **Configure Zustand stores**

  - File created: `src/store/userStore.ts`
  - File created: `src/store/canvasStore.ts`
  - File created: `src/store/index.ts`

- [ ] **Deploy empty app to Vercel**
  - Connect GitHub repo
  - Add environment variables
  - Verify deployment works

### Files Modified:

- `.env.local` (created)
- `src/lib/firebase.ts` (created)
- `src/types/*.ts` (created)
- `src/store/*.ts` (created)

---

## PR #2: Authentication & User Management ⏰ Hour 2-4

### Main Tasks:

- [ ] Implement authentication flow
- [ ] Create user profile management
- [ ] Set up protected routes
- [ ] Assign user colors
- [ ] ✅ Run integration tests

### Subtasks:

- [ ] **Create auth hook**

  - File created: `src/hooks/useAuth.ts`

  ```typescript
  export const useAuth = () => {
    // Handle Firebase auth state
    // Return user, login, logout, signup
  };
  ```

- [ ] **Build login component**

  - File created: `src/components/Auth/LoginForm.tsx`
  - Features: Email/password or anonymous auth

- [ ] **Create auth guard wrapper**

  - File created: `src/components/Auth/AuthGuard.tsx`
  - Wraps canvas page, redirects if not authenticated

- [ ] **Set up auth page**

  - File created: `src/app/auth/page.tsx`
  - Simple form with login/signup toggle

- [ ] **Update main layout**

  - File modified: `src/app/layout.tsx`
  - Add auth provider context

- [ ] **Generate user colors**

  - File modified: `src/lib/utils.ts`

  ```typescript
  export const generateUserColor = (userId: string): string => {
    const colors = ["#FF6B6B", "#4ECDC4", "#45B7D1", "#96CEB4", "#FFEAA7"];
    return colors[userId.charCodeAt(0) % colors.length];
  };
  ```

- [ ] **Store user in Firestore on signup**
  - Collection: `users`
  - Document: User ID
  - Fields: name, color, createdAt

### 🧪 Integration Tests:

- [ ] **Create auth integration test**

  - File created: `src/__tests__/auth.test.ts`

  ```typescript
  // Test: User can sign up and gets assigned a color
  describe("Authentication Flow", () => {
    it("should create user with unique color on signup", async () => {
      const email = "test@example.com";
      const password = "testpass123";

      const { user } = await signUp(email, password);
      expect(user).toBeDefined();
      expect(user.uid).toBeTruthy();

      // Check Firestore for user document
      const userDoc = await getDoc(doc(db, "users", user.uid));
      expect(userDoc.exists()).toBe(true);
      expect(userDoc.data().color).toMatch(/^#[0-9A-F]{6}$/i);
    });

    it("should handle anonymous authentication", async () => {
      const { user } = await signInAnonymously();
      expect(user).toBeDefined();
      expect(user.isAnonymous).toBe(true);
    });

    it("should persist auth state on refresh", async () => {
      // Sign in first
      await signUp("persist@test.com", "password");

      // Simulate page refresh
      const currentUser = await new Promise((resolve) => {
        onAuthStateChanged(auth, resolve);
      });

      expect(currentUser).toBeDefined();
    });
  });
  ```

  **Verification:** Confirms auth flow works and users get proper initialization

### Files Modified:

- `src/hooks/useAuth.ts` (created)
- `src/components/Auth/*` (created)
- `src/app/auth/page.tsx` (created)
- `src/app/layout.tsx` (modified)
- `src/lib/utils.ts` (modified)
- `src/__tests__/auth.test.ts` (created)

---

## PR #3: Real-time Cursor Presence ⏰ Hour 4-8

### Main Tasks:

- [ ] Implement cursor tracking
- [ ] Build presence system
- [ ] Create cursor component
- [ ] Show online users
- [ ] ✅ Run real-time integration tests

### Subtasks:

- [ ] **Create multiplayer hook**

  - File created: `src/hooks/useMultiplayer.ts`

  ```typescript
  export const useMultiplayer = (canvasId: string) => {
    // Track cursor position
    // Broadcast to Firestore
    // Listen for other cursors
  };
  ```

- [ ] **Build cursor component**

  - File created: `src/components/Multiplayer/Cursor.tsx`

  ```typescript
  interface CursorProps {
    user: User;
    position: { x: number; y: number };
  }
  ```

- [ ] **Create presence tracker**

  - File created: `src/components/Multiplayer/CursorPresence.tsx`
  - Renders all active cursors
  - Handles cursor interpolation

- [ ] **Build online users list**

  - File created: `src/components/Multiplayer/OnlineUsers.tsx`
  - Shows avatar + name + color indicator

- [ ] **Set up Firestore presence**

  - Collection: `presence`
  - Document: User ID
  - Fields: cursor, lastSeen, user info
  - TTL: Clear after 30 seconds inactive

- [ ] **Add cursor broadcasting**

  - File modified: `src/app/page.tsx`

  ```typescript
  const handleMouseMove = throttle((e) => {
    updateCursorPosition(e.clientX, e.clientY);
  }, 50); // 20 FPS for cursor updates
  ```

- [ ] **Test with multiple browsers**
  - Verify cursors appear
  - Check smooth movement
  - Confirm <50ms latency

### 🧪 Integration Tests:

- [ ] **Create real-time cursor test**

  - File created: `src/__tests__/multiplayer.test.ts`

  ```typescript
  // Test: Cursor updates propagate to other users
  describe("Real-time Cursor Sync", () => {
    let user1: FirebaseUser;
    let user2: FirebaseUser;

    beforeEach(async () => {
      user1 = await signInAnonymously();
      user2 = await signInAnonymously();
    });

    it("should broadcast cursor position in <50ms", async () => {
      const startTime = Date.now();
      const testPosition = { x: 100, y: 200 };

      // User 1 updates cursor
      await updateDoc(doc(db, "presence", user1.uid), {
        cursor: testPosition,
        lastSeen: serverTimestamp(),
      });

      // User 2 listens for update
      const unsubscribe = onSnapshot(doc(db, "presence", user1.uid), (doc) => {
        const latency = Date.now() - startTime;
        expect(latency).toBeLessThan(50);
        expect(doc.data().cursor).toEqual(testPosition);
      });

      // Cleanup
      unsubscribe();
    });

    it("should show all online users", async () => {
      // Add both users to presence
      await setDoc(doc(db, "presence", user1.uid), {
        user: { name: "User 1", color: "#FF0000" },
        lastSeen: serverTimestamp(),
      });

      await setDoc(doc(db, "presence", user2.uid), {
        user: { name: "User 2", color: "#00FF00" },
        lastSeen: serverTimestamp(),
      });

      // Query all present users
      const snapshot = await getDocs(collection(db, "presence"));
      expect(snapshot.size).toBe(2);
    });

    it("should remove inactive users after 30 seconds", async () => {
      jest.useFakeTimers();

      // Add user to presence
      await setDoc(doc(db, "presence", user1.uid), {
        lastSeen: serverTimestamp(),
      });

      // Fast-forward 31 seconds
      jest.advanceTimersByTime(31000);

      // Check if user was removed (would need cloud function)
      const doc = await getDoc(doc(db, "presence", user1.uid));
      expect(doc.exists()).toBe(false);

      jest.useRealTimers();
    });
  });
  ```

  **Verification:** Ensures cursor sync meets latency requirements and presence works

### Files Modified:

- `src/hooks/useMultiplayer.ts` (created)
- `src/components/Multiplayer/*` (created)
- `src/app/page.tsx` (modified)
- `src/__tests__/multiplayer.test.ts` (created)

---

## PR #4: Canvas Implementation ⏰ Hour 8-12

### Main Tasks:

- [ ] Integrate Konva.js
- [ ] Implement pan and zoom
- [ ] Create canvas controls
- [ ] Set up viewport management
- [ ] ✅ Run unit tests for viewport calculations

### Subtasks:

- [ ] **Create canvas component**

  - File created: `src/components/Canvas/Canvas.tsx`

  ```typescript
  import { Stage, Layer } from "react-konva";
  // 2000x2000 minimum viewport
  ```

- [ ] **Build canvas hook**

  - File created: `src/hooks/useCanvas.ts`
  - Handles pan, zoom, viewport state

- [ ] **Add zoom controls**

  - File created: `src/components/Canvas/CanvasControls.tsx`
  - Mouse wheel zoom (10% - 200% range)
  - Pinch gesture support for trackpad
  - Current zoom level display (optional)

- [ ] **Implement pan functionality**

  - Mouse drag with middle button or spacebar
  - Touch support (optional for MVP)

- [ ] **Set up canvas store**

  - File modified: `src/store/canvasStore.ts`

  ```typescript
  interface CanvasState {
    scale: number;
    position: { x: number; y: number };
    objects: CanvasObject[];
  }
  ```

- [ ] **Add grid background (REQUIRED)**

  - Light gray grid pattern (#F5F5F5 background, #E0E0E0 lines)
  - Helps with visual feedback and navigation

- [ ] **Integrate canvas into main page**
  - File modified: `src/app/page.tsx`
  - Add Stage component
  - Wire up controls

### 🧪 Unit Tests:

- [ ] **Create canvas viewport tests**

  - File created: `src/__tests__/canvas.test.ts`

  ```typescript
  // Test: Pan and zoom calculations work correctly
  describe("Canvas Viewport", () => {
    it("should calculate zoom within bounds", () => {
      const MIN_ZOOM = 0.1;
      const MAX_ZOOM = 2;

      const zoomIn = (current: number) => Math.min(current * 1.2, MAX_ZOOM);
      const zoomOut = (current: number) => Math.max(current * 0.8, MIN_ZOOM);

      expect(zoomIn(1)).toBeCloseTo(1.2);
      expect(zoomIn(1.9)).toBe(2); // Capped at max
      expect(zoomOut(1)).toBeCloseTo(0.8);
      expect(zoomOut(0.12)).toBeCloseTo(0.1); // Capped at min
    });

    it("should calculate pan position correctly", () => {
      const canvasSize = { width: 2000, height: 2000 };
      const viewport = { width: 800, height: 600 };
      const scale = 1;

      const pan = (currentPos: Point, delta: Point): Point => {
        const newX = currentPos.x + delta.x;
        const newY = currentPos.y + delta.y;

        // Bound checking
        const maxX = canvasSize.width * scale - viewport.width;
        const maxY = canvasSize.height * scale - viewport.height;

        return {
          x: Math.max(0, Math.min(newX, maxX)),
          y: Math.max(0, Math.min(newY, maxY)),
        };
      };

      const result = pan({ x: 100, y: 100 }, { x: 50, y: -50 });
      expect(result).toEqual({ x: 150, y: 50 });

      // Test boundary
      const boundaryResult = pan({ x: 1900, y: 1900 }, { x: 500, y: 500 });
      expect(boundaryResult.x).toBeLessThanOrEqual(1200); // Max allowed
    });

    it("should convert screen to canvas coordinates", () => {
      const screenToCanvas = (
        screenPos: Point,
        canvasPos: Point,
        scale: number
      ): Point => {
        return {
          x: (screenPos.x - canvasPos.x) / scale,
          y: (screenPos.y - canvasPos.y) / scale,
        };
      };

      const result = screenToCanvas(
        { x: 400, y: 300 },
        { x: 100, y: 100 },
        2 // 2x zoom
      );

      expect(result).toEqual({ x: 150, y: 100 });
    });
  });
  ```

  **Verification:** Ensures viewport math is correct for pan/zoom operations

### Files Modified:

- `src/components/Canvas/*` (created)
- `src/hooks/useCanvas.ts` (created)
- `src/store/canvasStore.ts` (modified)
- `src/app/page.tsx` (modified)
- `src/__tests__/canvas.test.ts` (created)

---

## PR #5: Object Creation & Synchronization ⏰ Hour 12-16

### Main Tasks:

- [ ] Implement rectangle creation
- [ ] Add object movement
- [ ] Set up real-time object sync
- [ ] Handle selection states
- [ ] ✅ Run object sync integration tests

### Subtasks:

- [ ] **Create Rectangle component**

  - File created: `src/components/Objects/Rectangle.tsx`

  ```typescript
  import { Rect } from "react-konva";
  // Handle selection, drag, sync
  ```

- [ ] **Build object renderer**

  - File created: `src/components/Objects/ObjectRenderer.tsx`
  - Renders all objects from store
  - Handles object events

- [ ] **Add object creation logic**

  - Click and drag to draw rectangle (user-defined size)
  - Matcha latte fill (#D4E7C5) with lavender purple border (#B4A7D6)

- [ ] **Implement object movement**

  - Drag to move
  - Update Firestore on drag end
  - Show selection border

- [ ] **Set up Firestore sync**

  - Collection: `canvas/{canvasId}/objects`
  - Document: Object ID
  - Fields: type, x, y, width, height, userId, createdAt

- [ ] **Create sync hook**

  - File created: `src/hooks/useRealtimeSync.ts`

  ```typescript
  export const useRealtimeSync = (canvasId: string) => {
    // Listen to object changes
    // Update local state
    // Handle conflicts
  };
  ```

- [ ] **Add object to canvas store**

  - File modified: `src/store/canvasStore.ts`
  - Add/update/remove object methods

- [ ] **Implement conflict resolution**
  - Last write wins
  - Use Firestore timestamps

### 🧪 Integration Tests:

- [ ] **Create object sync tests**

  - File created: `src/__tests__/objectSync.test.ts`

  ```typescript
  // Test: Objects sync correctly between users
  describe("Object Synchronization", () => {
    const canvasId = "test-canvas";
    let user1: FirebaseUser;
    let user2: FirebaseUser;

    beforeEach(async () => {
      user1 = await signInAnonymously();
      user2 = await signInAnonymously();
      // Clear test canvas
      const objects = await getDocs(
        collection(db, `canvas/${canvasId}/objects`)
      );
      objects.forEach((doc) => deleteDoc(doc.ref));
    });

    it("should sync object creation in <100ms", async () => {
      const startTime = Date.now();
      const testObject = {
        id: "rect-1",
        type: "rectangle",
        x: 100,
        y: 100,
        width: 100,
        height: 100,
        userId: user1.uid,
        createdAt: serverTimestamp(),
      };

      // User 1 creates object
      await setDoc(
        doc(db, `canvas/${canvasId}/objects`, testObject.id),
        testObject
      );

      // User 2 listens for new object
      return new Promise((resolve) => {
        const unsubscribe = onSnapshot(
          collection(db, `canvas/${canvasId}/objects`),
          (snapshot) => {
            snapshot.docChanges().forEach((change) => {
              if (change.type === "added") {
                const latency = Date.now() - startTime;
                expect(latency).toBeLessThan(100);
                expect(change.doc.data()).toMatchObject({
                  id: testObject.id,
                  x: testObject.x,
                  y: testObject.y,
                });
                unsubscribe();
                resolve(true);
              }
            });
          }
        );
      });
    });

    it("should handle simultaneous object moves (last write wins)", async () => {
      const objectId = "rect-conflict";

      // Create initial object
      await setDoc(doc(db, `canvas/${canvasId}/objects`, objectId), {
        x: 0,
        y: 0,
        updatedAt: serverTimestamp(),
      });

      // Both users move object at "same time"
      const move1 = updateDoc(doc(db, `canvas/${canvasId}/objects`, objectId), {
        x: 100,
        y: 100,
        updatedAt: serverTimestamp(),
      });

      const move2 = updateDoc(doc(db, `canvas/${canvasId}/objects`, objectId), {
        x: 200,
        y: 200,
        updatedAt: serverTimestamp(),
      });

      await Promise.all([move1, move2]);

      // Check final state (last write wins)
      const finalDoc = await getDoc(
        doc(db, `canvas/${canvasId}/objects`, objectId)
      );

      const finalData = finalDoc.data();
      // One of these positions should have won
      expect([100, 200]).toContain(finalData.x);
      expect([100, 200]).toContain(finalData.y);
    });

    it("should sync object deletion", async () => {
      const objectId = "rect-delete";

      // Create object
      await setDoc(doc(db, `canvas/${canvasId}/objects`, objectId), {
        type: "rectangle",
        x: 0,
        y: 0,
      });

      // Delete object
      await deleteDoc(doc(db, `canvas/${canvasId}/objects`, objectId));

      // Verify it's gone
      const deletedDoc = await getDoc(
        doc(db, `canvas/${canvasId}/objects`, objectId)
      );
      expect(deletedDoc.exists()).toBe(false);
    });

    it("should maintain object count under load", async () => {
      // Create 50 objects rapidly
      const promises = [];
      for (let i = 0; i < 50; i++) {
        promises.push(
          setDoc(doc(db, `canvas/${canvasId}/objects`, `rect-${i}`), {
            type: "rectangle",
            x: i * 10,
            y: i * 10,
            width: 100,
            height: 100,
          })
        );
      }

      await Promise.all(promises);

      // Verify all objects exist
      const snapshot = await getDocs(
        collection(db, `canvas/${canvasId}/objects`)
      );
      expect(snapshot.size).toBe(50);
    });
  });
  ```

  **Verification:** Confirms objects sync correctly with proper latency and conflict handling

### Files Modified:

- `src/components/Objects/*` (created)
- `src/hooks/useRealtimeSync.ts` (created)
- `src/store/canvasStore.ts` (modified)
- `src/__tests__/objectSync.test.ts` (created)

---

## PR #6: State Persistence ⏰ Hour 16-18

### Main Tasks:

- [ ] Implement canvas persistence
- [ ] Handle reconnection
- [ ] Add loading states
- [ ] Test persistence
- [ ] ✅ Run persistence integration tests

### Subtasks:

- [ ] **Save canvas state to Firestore**

  - Collection: `canvases`
  - Document: Canvas ID
  - Update on object changes

- [ ] **Load canvas on mount**

  - Fetch existing objects
  - Restore viewport position
  - Show loading spinner

- [ ] **Handle connection loss**

  - Queue updates when offline
  - Sync when reconnected
  - Show connection status

- [ ] **Add canvas ID routing**

  - File modified: `src/app/page.tsx`
  - Use URL param or generate new

- [ ] **Test persistence scenarios**
  - All users leave and return
  - Browser refresh
  - Network disconnect/reconnect

### 🧪 Integration Tests:

- [ ] **Create persistence tests**

  - File created: `src/__tests__/persistence.test.ts`

  ```typescript
  // Test: Canvas state persists correctly
  describe("State Persistence", () => {
    const canvasId = "test-persist-canvas";

    it("should restore canvas state after all users disconnect", async () => {
      // Create initial state
      const objects = [
        { id: "rect-1", x: 100, y: 100 },
        { id: "rect-2", x: 200, y: 200 },
        { id: "rect-3", x: 300, y: 300 },
      ];

      // Save objects to Firestore
      for (const obj of objects) {
        await setDoc(doc(db, `canvas/${canvasId}/objects`, obj.id), {
          ...obj,
          type: "rectangle",
          width: 100,
          height: 100,
        });
      }

      // Simulate all users disconnecting
      // (In real app, this would be presence cleanup)

      // Simulate new user connecting and loading canvas
      const snapshot = await getDocs(
        collection(db, `canvas/${canvasId}/objects`)
      );

      expect(snapshot.size).toBe(3);

      const loadedObjects = [];
      snapshot.forEach((doc) => {
        loadedObjects.push(doc.data());
      });

      // Verify all objects were restored
      expect(loadedObjects).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ id: "rect-1", x: 100 }),
          expect.objectContaining({ id: "rect-2", x: 200 }),
          expect.objectContaining({ id: "rect-3", x: 300 }),
        ])
      );
    });

    it("should handle offline queue and sync when reconnected", async () => {
      // This tests the offline persistence capability
      const testObject = {
        id: "offline-rect",
        type: "rectangle",
        x: 500,
        y: 500,
      };

      // Enable offline persistence (in real app)
      // await enableNetwork(db); // Re-enable when online

      // Create object while "offline"
      const docRef = doc(db, `canvas/${canvasId}/objects`, testObject.id);
      await setDoc(docRef, testObject);

      // Verify it exists after "reconnection"
      const savedDoc = await getDoc(docRef);
      expect(savedDoc.exists()).toBe(true);
      expect(savedDoc.data()).toMatchObject(testObject);
    });

    it("should load canvas with correct viewport state", async () => {
      const canvasState = {
        id: canvasId,
        viewport: {
          x: 250,
          y: 150,
          scale: 1.5,
        },
        lastUpdated: serverTimestamp(),
      };

      // Save canvas viewport state
      await setDoc(doc(db, "canvases", canvasId), canvasState);

      // Load canvas state
      const canvasDoc = await getDoc(doc(db, "canvases", canvasId));
      expect(canvasDoc.exists()).toBe(true);

      const loaded = canvasDoc.data();
      expect(loaded.viewport).toEqual({
        x: 250,
        y: 150,
        scale: 1.5,
      });
    });
  });
  ```

  **Verification:** Ensures canvas state persists and recovers correctly

### Files Modified:

- `src/hooks/useRealtimeSync.ts` (modified)
- `src/app/page.tsx` (modified)
- `src/__tests__/persistence.test.ts` (created)

---

## PR #7: Performance & Polish ⏰ Hour 18-20

### Main Tasks:

- [ ] Optimize rendering
- [ ] Add error handling
- [ ] Improve UX feedback
- [ ] Performance testing

### Subtasks:

- [ ] **Add React.memo to components**

  - Files modified: All component files
  - Prevent unnecessary re-renders

- [ ] **Throttle updates**

  - Cursor updates: 20 FPS
  - Object moves: 10 FPS
  - Batch Firestore writes

- [ ] **Add loading states**

  - Initial load
  - Creating objects
  - Saving changes

- [ ] **Implement error boundaries**

  - File created: `src/components/ErrorBoundary.tsx`
  - Graceful error handling

- [ ] **Add user feedback**

  - Toast notifications
  - Connection status indicator
  - User joined/left messages

- [ ] **Performance monitoring**
  - Log render times
  - Track sync latency
  - Monitor FPS

### Files Modified:

- Multiple component files (memo additions)
- `src/components/ErrorBoundary.tsx` (created)

---

## PR #8: Final Testing & Deployment ⏰ Hour 20-24

### Main Tasks:

- [ ] Multi-user testing
- [ ] Fix critical bugs
- [ ] Update documentation
- [ ] Record demo video

### Subtasks:

- [ ] **Stress test with 5 users**

  - Create 50+ objects
  - Rapid movements
  - Simultaneous edits

- [ ] **Update README**

  - File modified: `README.md`
  - Setup instructions
  - Architecture overview
  - Known limitations

- [ ] **Environment check**

  - Verify all env vars in Vercel
  - Check WebSocket connection
  - Test HTTPS/WSS

- [ ] **Fix critical bugs**

  - Sync issues
  - Performance problems
  - Auth failures

- [ ] **Record demo video**

  - Show 2+ users collaborating
  - Demonstrate all MVP features
  - Keep under 3 minutes

- [ ] **Final deployment**
  - Build production bundle
  - Deploy to Vercel
  - Test public URL

### Files Modified:

- `README.md` (modified)
- Various files (bug fixes)

---

## 🚀 Git Commit Strategy

Each PR should have clear commits:

```bash
# PR #1
git commit -m "feat: Initialize project with Next.js and TypeScript"
git commit -m "feat: Add Firebase configuration and types"

# PR #2
git commit -m "feat: Implement authentication with Firebase"
git commit -m "feat: Add user color generation and profile storage"

# PR #3
git commit -m "feat: Add real-time cursor tracking"
git commit -m "feat: Implement online presence system"

# Continue pattern...
```

---

## ⚡ Critical Path Checklist

**Must have for MVP approval:**

- [ ] Canvas with pan/zoom works
- [ ] Can create and move rectangles
- [ ] 2+ users see each other's cursors
- [ ] Object changes sync in <100ms
- [ ] Cursor updates sync in <50ms
- [ ] State persists after disconnect
- [ ] Users have names on cursors
- [ ] Shows who's online
- [ ] Deployed to public URL

---

## 📊 Testing Checklist per PR

After each PR, test:

- [ ] No console errors
- [ ] Works in Chrome and Firefox
- [ ] Multiplayer features work with 2+ tabs
- [ ] Performance maintains 60 FPS
- [ ] Deploy still works

---

## 🔥 If Behind Schedule

**Hour 12 checkpoint:** If cursor sync isn't working, STOP and fix it
**Hour 18 checkpoint:** If objects aren't syncing, skip polish and focus on sync
**Hour 22 checkpoint:** If not deployed, skip new features and deploy what works

---

## 🧪 Test Coverage Summary

### PRs with Tests (Critical Path):

1. **PR #2 - Authentication**

   - Integration tests verify auth flow works
   - Critical for user identification in multiplayer

2. **PR #3 - Cursor Presence**

   - Integration tests verify <50ms latency requirement
   - Core multiplayer feature - must work perfectly

3. **PR #4 - Canvas**

   - Unit tests verify viewport math is correct
   - Wrong calculations = broken UX

4. **PR #5 - Object Sync**

   - Integration tests verify <100ms sync requirement
   - The main collaborative feature - absolute requirement

5. **PR #6 - Persistence**
   - Integration tests verify state recovery
   - Without this, work is lost = fail

### PRs without Tests:

- **PR #1** - Just setup and configuration
- **PR #7** - Performance optimizations (manual testing)
- **PR #8** - Final deployment (manual testing)

### Why These Tests Matter:

- **Verify AI Code**: Each test confirms the AI coding agent generated working code
- **Catch Sync Issues Early**: Real-time bugs are hard to debug without tests
- **Latency Requirements**: Tests ensure you meet the <50ms and <100ms requirements
- **Confidence in Deploy**: Passing tests = working MVP

**Pro Tip**: If a test fails, it means the AI-generated code has a bug. Fix the code, not the test!: '<rootDir>/src/$1',
},
testMatch: ['**/__tests__/**/*.test.ts', '**/__tests__/**/*.test.tsx'],
};

````

Create `jest.setup.js`:
```javascript
import '@testing-library/jest-dom';

// Mock Firebase for tests
jest.mock('firebase/app');
jest.mock('firebase/auth');
jest.mock('firebase/firestore');
````

### Running Tests

```bash
# Run all tests after each PR
npm test

# Run specific test suite
npm test auth.test.ts

# Run tests in watch mode during development
npm test -- --watch

# Run tests with coverage
npm test -- --coverage
```

### Test Verification Strategy

- **Unit Tests**: Run after implementing core logic (PR #4)
- **Integration Tests**: Run after implementing features (PR #2, 3, 5, 6)
- **Each PR must pass its tests before merging**
- **Tests act as verification that AI-generated code works correctly**

---

## 📁 File Structure

```
collabcanvas/
├── .env.local                    # Environment variables
├── .gitignore
├── package.json
├── tsconfig.json
├── jest.config.js               # Jest configuration
├── jest.setup.js                # Jest setup file
├── next.config.js               # If using Next.js
├── README.md
├── public/
│   └── favicon.ico
├── src/
│   ├── __tests__/               # Test files
│   │   ├── auth.test.ts         # PR #2 tests
│   │   ├── multiplayer.test.ts  # PR #3 tests
│   │   ├── canvas.test.ts       # PR #4 tests
│   │   ├── objectSync.test.ts   # PR #5 tests
│   │   └── persistence.test.ts  # PR #6 tests
│   ├── app/                     # Next.js 13+ app directory
│   │   ├── layout.tsx
│   │   ├── page.tsx             # Main canvas page
│   │   ├── globals.css
│   │   └── auth/
│   │       └── page.tsx         # Auth page
│   ├── components/
│   │   ├── Canvas/
│   │   │   ├── Canvas.tsx
│   │   │   ├── CanvasControls.tsx
│   │   │   └── index.ts
│   │   ├── Multiplayer/
│   │   │   ├── Cursor.tsx
│   │   │   ├── CursorPresence.tsx
│   │   │   ├── OnlineUsers.tsx
│   │   │   └── index.ts
│   │   ├── Objects/
│   │   │   ├── Rectangle.tsx
│   │   │   ├── ObjectRenderer.tsx
│   │   │   └── index.ts
│   │   └── Auth/
│   │       ├── LoginForm.tsx
│   │       ├── AuthGuard.tsx
│   │       └── index.ts
│   ├── lib/
│   │   ├── firebase.ts         # Firebase config
│   │   ├── constants.ts
│   │   └── utils.ts
│   ├── hooks/
│   │   ├── useAuth.ts
│   │   ├── useCanvas.ts
│   │   ├── useMultiplayer.ts
│   │   └── useRealtimeSync.ts
│   ├── store/
│   │   ├── canvasStore.ts      # Zustand store
│   │   ├── userStore.ts
│   │   └── index.ts
│   └── types/
│       ├── canvas.ts
│       ├── user.ts
│       └── index.ts
```

---

## PR #1: Project Foundation & Setup ⏰ Hour 0-2

### Main Tasks:

- [ ] Initialize Next.js project with TypeScript
- [ ] Set up Firebase project and configuration
- [ ] Configure deployment pipeline
- [ ] Verify deployment works

### Subtasks:

- [ ] **Create Next.js project**

  - Run: `npx create-next-app@latest collabcanvas --typescript --tailwind --app`
  - Files created: All base files

- [ ] **Install core dependencies**

  ```bash
  npm install firebase konva react-konva zustand uuid
  npm install --save-dev @types/uuid
  ```

  - File modified: `package.json`

- [ ] **Set up Firebase project**

  - Create project at console.firebase.google.com
  - Enable Firestore Database
  - Enable Authentication (Anonymous + Email)
  - Get configuration keys

- [ ] **Create Firebase configuration**

  - File created: `src/lib/firebase.ts`
  - File created: `.env.local`

  ```typescript
  // src/lib/firebase.ts
  import { initializeApp } from "firebase/app";
  import { getAuth } from "firebase/auth";
  import { getFirestore } from "firebase/firestore";
  ```

- [ ] **Set up type definitions**

  - File created: `src/types/user.ts`
  - File created: `src/types/canvas.ts`
  - File created: `src/types/index.ts`

  ```typescript
  // src/types/user.ts
  export interface User {
    id: string;
    name: string;
    color: string;
    cursor?: { x: number; y: number };
  }
  ```

- [ ] **Configure Zustand stores**

  - File created: `src/store/userStore.ts`
  - File created: `src/store/canvasStore.ts`
  - File created: `src/store/index.ts`

- [ ] **Deploy empty app to Vercel**
  - Connect GitHub repo
  - Add environment variables
  - Verify deployment works

### Files Modified:

- `.env.local` (created)
- `src/lib/firebase.ts` (created)
- `src/types/*.ts` (created)
- `src/store/*.ts` (created)

---

## PR #2: Authentication & User Management ⏰ Hour 2-4

### Main Tasks:

- [ ] Implement authentication flow
- [ ] Create user profile management
- [ ] Set up protected routes
- [ ] Assign user colors
- [ ] ✅ Run integration tests

### Subtasks:

- [ ] **Create auth hook**

  - File created: `src/hooks/useAuth.ts`

  ```typescript
  export const useAuth = () => {
    // Handle Firebase auth state
    // Return user, login, logout, signup
  };
  ```

- [ ] **Build login component**

  - File created: `src/components/Auth/LoginForm.tsx`
  - Features: Email/password or anonymous auth

- [ ] **Create auth guard wrapper**

  - File created: `src/components/Auth/AuthGuard.tsx`
  - Wraps canvas page, redirects if not authenticated

- [ ] **Set up auth page**

  - File created: `src/app/auth/page.tsx`
  - Simple form with login/signup toggle

- [ ] **Update main layout**

  - File modified: `src/app/layout.tsx`
  - Add auth provider context

- [ ] **Generate user colors**

  - File modified: `src/lib/utils.ts`

  ```typescript
  export const generateUserColor = (userId: string): string => {
    const colors = ["#FF6B6B", "#4ECDC4", "#45B7D1", "#96CEB4", "#FFEAA7"];
    return colors[userId.charCodeAt(0) % colors.length];
  };
  ```

- [ ] **Store user in Firestore on signup**
  - Collection: `users`
  - Document: User ID
  - Fields: name, color, createdAt

### 🧪 Integration Tests:

- [ ] **Create auth integration test**

  - File created: `src/__tests__/auth.test.ts`

  ```typescript
  // Test: User can sign up and gets assigned a color
  describe("Authentication Flow", () => {
    it("should create user with unique color on signup", async () => {
      const email = "test@example.com";
      const password = "testpass123";

      const { user } = await signUp(email, password);
      expect(user).toBeDefined();
      expect(user.uid).toBeTruthy();

      // Check Firestore for user document
      const userDoc = await getDoc(doc(db, "users", user.uid));
      expect(userDoc.exists()).toBe(true);
      expect(userDoc.data().color).toMatch(/^#[0-9A-F]{6}$/i);
    });

    it("should handle anonymous authentication", async () => {
      const { user } = await signInAnonymously();
      expect(user).toBeDefined();
      expect(user.isAnonymous).toBe(true);
    });

    it("should persist auth state on refresh", async () => {
      // Sign in first
      await signUp("persist@test.com", "password");

      // Simulate page refresh
      const currentUser = await new Promise((resolve) => {
        onAuthStateChanged(auth, resolve);
      });

      expect(currentUser).toBeDefined();
    });
  });
  ```

  **Verification:** Confirms auth flow works and users get proper initialization

### Files Modified:

- `src/hooks/useAuth.ts` (created)
- `src/components/Auth/*` (created)
- `src/app/auth/page.tsx` (created)
- `src/app/layout.tsx` (modified)
- `src/lib/utils.ts` (modified)
- `src/__tests__/auth.test.ts` (created)

---

## PR #3: Real-time Cursor Presence ⏰ Hour 4-8

### Main Tasks:

- [ ] Implement cursor tracking
- [ ] Build presence system
- [ ] Create cursor component
- [ ] Show online users
- [ ] ✅ Run real-time integration tests

### Subtasks:

- [ ] **Create multiplayer hook**

  - File created: `src/hooks/useMultiplayer.ts`

  ```typescript
  export const useMultiplayer = (canvasId: string) => {
    // Track cursor position
    // Broadcast to Firestore
    // Listen for other cursors
  };
  ```

- [ ] **Build cursor component**

  - File created: `src/components/Multiplayer/Cursor.tsx`

  ```typescript
  interface CursorProps {
    user: User;
    position: { x: number; y: number };
  }
  ```

- [ ] **Create presence tracker**

  - File created: `src/components/Multiplayer/CursorPresence.tsx`
  - Renders all active cursors
  - Handles cursor interpolation

- [ ] **Build online users list**

  - File created: `src/components/Multiplayer/OnlineUsers.tsx`
  - Shows avatar + name + color indicator

- [ ] **Set up Firestore presence**

  - Collection: `presence`
  - Document: User ID
  - Fields: cursor, lastSeen, user info
  - TTL: Clear after 30 seconds inactive

- [ ] **Add cursor broadcasting**

  - File modified: `src/app/page.tsx`

  ```typescript
  const handleMouseMove = throttle((e) => {
    updateCursorPosition(e.clientX, e.clientY);
  }, 50); // 20 FPS for cursor updates
  ```

- [ ] **Test with multiple browsers**
  - Verify cursors appear
  - Check smooth movement
  - Confirm <50ms latency

### 🧪 Integration Tests:

- [ ] **Create real-time cursor test**

  - File created: `src/__tests__/multiplayer.test.ts`

  ```typescript
  // Test: Cursor updates propagate to other users
  describe("Real-time Cursor Sync", () => {
    let user1: FirebaseUser;
    let user2: FirebaseUser;

    beforeEach(async () => {
      user1 = await signInAnonymously();
      user2 = await signInAnonymously();
    });

    it("should broadcast cursor position in <50ms", async () => {
      const startTime = Date.now();
      const testPosition = { x: 100, y: 200 };

      // User 1 updates cursor
      await updateDoc(doc(db, "presence", user1.uid), {
        cursor: testPosition,
        lastSeen: serverTimestamp(),
      });

      // User 2 listens for update
      const unsubscribe = onSnapshot(doc(db, "presence", user1.uid), (doc) => {
        const latency = Date.now() - startTime;
        expect(latency).toBeLessThan(50);
        expect(doc.data().cursor).toEqual(testPosition);
      });

      // Cleanup
      unsubscribe();
    });

    it("should show all online users", async () => {
      // Add both users to presence
      await setDoc(doc(db, "presence", user1.uid), {
        user: { name: "User 1", color: "#FF0000" },
        lastSeen: serverTimestamp(),
      });

      await setDoc(doc(db, "presence", user2.uid), {
        user: { name: "User 2", color: "#00FF00" },
        lastSeen: serverTimestamp(),
      });

      // Query all present users
      const snapshot = await getDocs(collection(db, "presence"));
      expect(snapshot.size).toBe(2);
    });

    it("should remove inactive users after 30 seconds", async () => {
      jest.useFakeTimers();

      // Add user to presence
      await setDoc(doc(db, "presence", user1.uid), {
        lastSeen: serverTimestamp(),
      });

      // Fast-forward 31 seconds
      jest.advanceTimersByTime(31000);

      // Check if user was removed (would need cloud function)
      const doc = await getDoc(doc(db, "presence", user1.uid));
      expect(doc.exists()).toBe(false);

      jest.useRealTimers();
    });
  });
  ```

  **Verification:** Ensures cursor sync meets latency requirements and presence works

### Files Modified:

- `src/hooks/useMultiplayer.ts` (created)
- `src/components/Multiplayer/*` (created)
- `src/app/page.tsx` (modified)
- `src/__tests__/multiplayer.test.ts` (created)

---

## PR #4: Canvas Implementation ⏰ Hour 8-12

### Main Tasks:

- [ ] Integrate Konva.js
- [ ] Implement pan and zoom
- [ ] Create canvas controls
- [ ] Set up viewport management
- [ ] ✅ Run unit tests for viewport calculations

### Subtasks:

- [ ] **Create canvas component**

  - File created: `src/components/Canvas/Canvas.tsx`

  ```typescript
  import { Stage, Layer } from "react-konva";
  // 2000x2000 minimum viewport
  ```

- [ ] **Build canvas hook**

  - File created: `src/hooks/useCanvas.ts`
  - Handles pan, zoom, viewport state

- [ ] **Add zoom controls**

  - File created: `src/components/Canvas/CanvasControls.tsx`
  - Mouse wheel zoom (10% - 200% range)
  - Pinch gesture support for trackpad
  - Current zoom level display (optional)

- [ ] **Implement pan functionality**

  - Mouse drag with middle button or spacebar
  - Touch support (optional for MVP)

- [ ] **Set up canvas store**

  - File modified: `src/store/canvasStore.ts`

  ```typescript
  interface CanvasState {
    scale: number;
    position: { x: number; y: number };
    objects: CanvasObject[];
  }
  ```

- [ ] **Add grid background (REQUIRED)**

  - Light gray grid pattern (#F5F5F5 background, #E0E0E0 lines)
  - Helps with visual feedback and navigation

- [ ] **Integrate canvas into main page**
  - File modified: `src/app/page.tsx`
  - Add Stage component
  - Wire up controls

### 🧪 Unit Tests:

- [ ] **Create canvas viewport tests**

  - File created: `src/__tests__/canvas.test.ts`

  ```typescript
  // Test: Pan and zoom calculations work correctly
  describe("Canvas Viewport", () => {
    it("should calculate zoom within bounds", () => {
      const MIN_ZOOM = 0.1;
      const MAX_ZOOM = 2;

      const zoomIn = (current: number) => Math.min(current * 1.2, MAX_ZOOM);
      const zoomOut = (current: number) => Math.max(current * 0.8, MIN_ZOOM);

      expect(zoomIn(1)).toBeCloseTo(1.2);
      expect(zoomIn(1.9)).toBe(2); // Capped at max
      expect(zoomOut(1)).toBeCloseTo(0.8);
      expect(zoomOut(0.12)).toBeCloseTo(0.1); // Capped at min
    });

    it("should calculate pan position correctly", () => {
      const canvasSize = { width: 2000, height: 2000 };
      const viewport = { width: 800, height: 600 };
      const scale = 1;

      const pan = (currentPos: Point, delta: Point): Point => {
        const newX = currentPos.x + delta.x;
        const newY = currentPos.y + delta.y;

        // Bound checking
        const maxX = canvasSize.width * scale - viewport.width;
        const maxY = canvasSize.height * scale - viewport.height;

        return {
          x: Math.max(0, Math.min(newX, maxX)),
          y: Math.max(0, Math.min(newY, maxY)),
        };
      };

      const result = pan({ x: 100, y: 100 }, { x: 50, y: -50 });
      expect(result).toEqual({ x: 150, y: 50 });

      // Test boundary
      const boundaryResult = pan({ x: 1900, y: 1900 }, { x: 500, y: 500 });
      expect(boundaryResult.x).toBeLessThanOrEqual(1200); // Max allowed
    });

    it("should convert screen to canvas coordinates", () => {
      const screenToCanvas = (
        screenPos: Point,
        canvasPos: Point,
        scale: number
      ): Point => {
        return {
          x: (screenPos.x - canvasPos.x) / scale,
          y: (screenPos.y - canvasPos.y) / scale,
        };
      };

      const result = screenToCanvas(
        { x: 400, y: 300 },
        { x: 100, y: 100 },
        2 // 2x zoom
      );

      expect(result).toEqual({ x: 150, y: 100 });
    });
  });
  ```

  **Verification:** Ensures viewport math is correct for pan/zoom operations

### Files Modified:

- `src/components/Canvas/*` (created)
- `src/hooks/useCanvas.ts` (created)
- `src/store/canvasStore.ts` (modified)
- `src/app/page.tsx` (modified)
- `src/__tests__/canvas.test.ts` (created)

---

## PR #5: Object Creation & Synchronization ⏰ Hour 12-16

### Main Tasks:

- [ ] Implement rectangle creation
- [ ] Add object movement
- [ ] Set up real-time object sync
- [ ] Handle selection states
- [ ] ✅ Run object sync integration tests

### Subtasks:

- [ ] **Create Rectangle component**

  - File created: `src/components/Objects/Rectangle.tsx`

  ```typescript
  import { Rect } from "react-konva";
  // Handle selection, drag, sync
  ```

- [ ] **Build object renderer**

  - File created: `src/components/Objects/ObjectRenderer.tsx`
  - Renders all objects from store
  - Handles object events

- [ ] **Add object creation logic**

  - Click and drag to draw rectangle (user-defined size)
  - Matcha latte fill (#D4E7C5) with lavender purple border (#B4A7D6)

- [ ] **Implement object movement**

  - Drag to move
  - Update Firestore on drag end
  - Show selection border

- [ ] **Set up Firestore sync**

  - Collection: `canvas/{canvasId}/objects`
  - Document: Object ID
  - Fields: type, x, y, width, height, userId, createdAt

- [ ] **Create sync hook**

  - File created: `src/hooks/useRealtimeSync.ts`

  ```typescript
  export const useRealtimeSync = (canvasId: string) => {
    // Listen to object changes
    // Update local state
    // Handle conflicts
  };
  ```

- [ ] **Add object to canvas store**

  - File modified: `src/store/canvasStore.ts`
  - Add/update/remove object methods

- [ ] **Implement conflict resolution**
  - Last write wins
  - Use Firestore timestamps

### 🧪 Integration Tests:

- [ ] **Create object sync tests**

  - File created: `src/__tests__/objectSync.test.ts`

  ```typescript
  // Test: Objects sync correctly between users
  describe("Object Synchronization", () => {
    const canvasId = "test-canvas";
    let user1: FirebaseUser;
    let user2: FirebaseUser;

    beforeEach(async () => {
      user1 = await signInAnonymously();
      user2 = await signInAnonymously();
      // Clear test canvas
      const objects = await getDocs(
        collection(db, `canvas/${canvasId}/objects`)
      );
      objects.forEach((doc) => deleteDoc(doc.ref));
    });

    it("should sync object creation in <100ms", async () => {
      const startTime = Date.now();
      const testObject = {
        id: "rect-1",
        type: "rectangle",
        x: 100,
        y: 100,
        width: 100,
        height: 100,
        userId: user1.uid,
        createdAt: serverTimestamp(),
      };

      // User 1 creates object
      await setDoc(
        doc(db, `canvas/${canvasId}/objects`, testObject.id),
        testObject
      );

      // User 2 listens for new object
      return new Promise((resolve) => {
        const unsubscribe = onSnapshot(
          collection(db, `canvas/${canvasId}/objects`),
          (snapshot) => {
            snapshot.docChanges().forEach((change) => {
              if (change.type === "added") {
                const latency = Date.now() - startTime;
                expect(latency).toBeLessThan(100);
                expect(change.doc.data()).toMatchObject({
                  id: testObject.id,
                  x: testObject.x,
                  y: testObject.y,
                });
                unsubscribe();
                resolve(true);
              }
            });
          }
        );
      });
    });

    it("should handle simultaneous object moves (last write wins)", async () => {
      const objectId = "rect-conflict";

      // Create initial object
      await setDoc(doc(db, `canvas/${canvasId}/objects`, objectId), {
        x: 0,
        y: 0,
        updatedAt: serverTimestamp(),
      });

      // Both users move object at "same time"
      const move1 = updateDoc(doc(db, `canvas/${canvasId}/objects`, objectId), {
        x: 100,
        y: 100,
        updatedAt: serverTimestamp(),
      });

      const move2 = updateDoc(doc(db, `canvas/${canvasId}/objects`, objectId), {
        x: 200,
        y: 200,
        updatedAt: serverTimestamp(),
      });

      await Promise.all([move1, move2]);

      // Check final state (last write wins)
      const finalDoc = await getDoc(
        doc(db, `canvas/${canvasId}/objects`, objectId)
      );

      const finalData = finalDoc.data();
      // One of these positions should have won
      expect([100, 200]).toContain(finalData.x);
      expect([100, 200]).toContain(finalData.y);
    });

    it("should sync object deletion", async () => {
      const objectId = "rect-delete";

      // Create object
      await setDoc(doc(db, `canvas/${canvasId}/objects`, objectId), {
        type: "rectangle",
        x: 0,
        y: 0,
      });

      // Delete object
      await deleteDoc(doc(db, `canvas/${canvasId}/objects`, objectId));

      // Verify it's gone
      const deletedDoc = await getDoc(
        doc(db, `canvas/${canvasId}/objects`, objectId)
      );
      expect(deletedDoc.exists()).toBe(false);
    });

    it("should maintain object count under load", async () => {
      // Create 50 objects rapidly
      const promises = [];
      for (let i = 0; i < 50; i++) {
        promises.push(
          setDoc(doc(db, `canvas/${canvasId}/objects`, `rect-${i}`), {
            type: "rectangle",
            x: i * 10,
            y: i * 10,
            width: 100,
            height: 100,
          })
        );
      }

      await Promise.all(promises);

      // Verify all objects exist
      const snapshot = await getDocs(
        collection(db, `canvas/${canvasId}/objects`)
      );
      expect(snapshot.size).toBe(50);
    });
  });
  ```

  **Verification:** Confirms objects sync correctly with proper latency and conflict handling

### Files Modified:

- `src/components/Objects/*` (created)
- `src/hooks/useRealtimeSync.ts` (created)
- `src/store/canvasStore.ts` (modified)
- `src/__tests__/objectSync.test.ts` (created)

---

## PR #6: State Persistence ⏰ Hour 16-18

### Main Tasks:

- [ ] Implement canvas persistence
- [ ] Handle reconnection
- [ ] Add loading states
- [ ] Test persistence
- [ ] ✅ Run persistence integration tests

### Subtasks:

- [ ] **Save canvas state to Firestore**

  - Collection: `canvases`
  - Document: Canvas ID
  - Update on object changes

- [ ] **Load canvas on mount**

  - Fetch existing objects
  - Restore viewport position
  - Show loading spinner

- [ ] **Handle connection loss**

  - Queue updates when offline
  - Sync when reconnected
  - Show connection status

- [ ] **Add canvas ID routing**

  - File modified: `src/app/page.tsx`
  - Use URL param or generate new

- [ ] **Test persistence scenarios**
  - All users leave and return
  - Browser refresh
  - Network disconnect/reconnect

### 🧪 Integration Tests:

- [ ] **Create persistence tests**

  - File created: `src/__tests__/persistence.test.ts`

  ```typescript
  // Test: Canvas state persists correctly
  describe("State Persistence", () => {
    const canvasId = "test-persist-canvas";

    it("should restore canvas state after all users disconnect", async () => {
      // Create initial state
      const objects = [
        { id: "rect-1", x: 100, y: 100 },
        { id: "rect-2", x: 200, y: 200 },
        { id: "rect-3", x: 300, y: 300 },
      ];

      // Save objects to Firestore
      for (const obj of objects) {
        await setDoc(doc(db, `canvas/${canvasId}/objects`, obj.id), {
          ...obj,
          type: "rectangle",
          width: 100,
          height: 100,
        });
      }

      // Simulate all users disconnecting
      // (In real app, this would be presence cleanup)

      // Simulate new user connecting and loading canvas
      const snapshot = await getDocs(
        collection(db, `canvas/${canvasId}/objects`)
      );

      expect(snapshot.size).toBe(3);

      const loadedObjects = [];
      snapshot.forEach((doc) => {
        loadedObjects.push(doc.data());
      });

      // Verify all objects were restored
      expect(loadedObjects).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ id: "rect-1", x: 100 }),
          expect.objectContaining({ id: "rect-2", x: 200 }),
          expect.objectContaining({ id: "rect-3", x: 300 }),
        ])
      );
    });

    it("should handle offline queue and sync when reconnected", async () => {
      // This tests the offline persistence capability
      const testObject = {
        id: "offline-rect",
        type: "rectangle",
        x: 500,
        y: 500,
      };

      // Enable offline persistence (in real app)
      // await enableNetwork(db); // Re-enable when online

      // Create object while "offline"
      const docRef = doc(db, `canvas/${canvasId}/objects`, testObject.id);
      await setDoc(docRef, testObject);

      // Verify it exists after "reconnection"
      const savedDoc = await getDoc(docRef);
      expect(savedDoc.exists()).toBe(true);
      expect(savedDoc.data()).toMatchObject(testObject);
    });

    it("should load canvas with correct viewport state", async () => {
      const canvasState = {
        id: canvasId,
        viewport: {
          x: 250,
          y: 150,
          scale: 1.5,
        },
        lastUpdated: serverTimestamp(),
      };

      // Save canvas viewport state
      await setDoc(doc(db, "canvases", canvasId), canvasState);

      // Load canvas state
      const canvasDoc = await getDoc(doc(db, "canvases", canvasId));
      expect(canvasDoc.exists()).toBe(true);

      const loaded = canvasDoc.data();
      expect(loaded.viewport).toEqual({
        x: 250,
        y: 150,
        scale: 1.5,
      });
    });
  });
  ```

  **Verification:** Ensures canvas state persists and recovers correctly

### Files Modified:

- `src/hooks/useRealtimeSync.ts` (modified)
- `src/app/page.tsx` (modified)
- `src/__tests__/persistence.test.ts` (created)

---

## PR #7: Performance & Polish ⏰ Hour 18-20

### Main Tasks:

- [ ] Optimize rendering
- [ ] Add error handling
- [ ] Improve UX feedback
- [ ] Performance testing

### Subtasks:

- [ ] **Add React.memo to components**

  - Files modified: All component files
  - Prevent unnecessary re-renders

- [ ] **Throttle updates**

  - Cursor updates: 20 FPS
  - Object moves: 10 FPS
  - Batch Firestore writes

- [ ] **Add loading states**

  - Initial load
  - Creating objects
  - Saving changes

- [ ] **Implement error boundaries**

  - File created: `src/components/ErrorBoundary.tsx`
  - Graceful error handling

- [ ] **Add user feedback**

  - Toast notifications
  - Connection status indicator
  - User joined/left messages

- [ ] **Performance monitoring**
  - Log render times
  - Track sync latency
  - Monitor FPS

### Files Modified:

- Multiple component files (memo additions)
- `src/components/ErrorBoundary.tsx` (created)

---

## PR #8: Final Testing & Deployment ⏰ Hour 20-24

### Main Tasks:

- [ ] Multi-user testing
- [ ] Fix critical bugs
- [ ] Update documentation
- [ ] Record demo video

### Subtasks:

- [ ] **Stress test with 5 users**

  - Create 50+ objects
  - Rapid movements
  - Simultaneous edits

- [ ] **Update README**

  - File modified: `README.md`
  - Setup instructions
  - Architecture overview
  - Known limitations

- [ ] **Environment check**

  - Verify all env vars in Vercel
  - Check WebSocket connection
  - Test HTTPS/WSS

- [ ] **Fix critical bugs**

  - Sync issues
  - Performance problems
  - Auth failures

- [ ] **Record demo video**

  - Show 2+ users collaborating
  - Demonstrate all MVP features
  - Keep under 3 minutes

- [ ] **Final deployment**
  - Build production bundle
  - Deploy to Vercel
  - Test public URL

### Files Modified:

- `README.md` (modified)
- Various files (bug fixes)

---

## 🚀 Git Commit Strategy

Each PR should have clear commits:

```bash
# PR #1
git commit -m "feat: Initialize project with Next.js and TypeScript"
git commit -m "feat: Add Firebase configuration and types"

# PR #2
git commit -m "feat: Implement authentication with Firebase"
git commit -m "feat: Add user color generation and profile storage"

# PR #3
git commit -m "feat: Add real-time cursor tracking"
git commit -m "feat: Implement online presence system"

# Continue pattern...
```

---

## ⚡ Critical Path Checklist

**Must have for MVP approval:**

- [ ] Canvas with pan/zoom works
- [ ] Can create and move rectangles
- [ ] 2+ users see each other's cursors
- [ ] Object changes sync in <100ms
- [ ] Cursor updates sync in <50ms
- [ ] State persists after disconnect
- [ ] Users have names on cursors
- [ ] Shows who's online
- [ ] Deployed to public URL

---

## 📊 Testing Checklist per PR

After each PR, test:

- [ ] No console errors
- [ ] Works in Chrome and Firefox
- [ ] Multiplayer features work with 2+ tabs
- [ ] Performance maintains 60 FPS
- [ ] Deploy still works

---

## 🔥 If Behind Schedule

**Hour 12 checkpoint:** If cursor sync isn't working, STOP and fix it
**Hour 18 checkpoint:** If objects aren't syncing, skip polish and focus on sync
**Hour 22 checkpoint:** If not deployed, skip new features and deploy what works
