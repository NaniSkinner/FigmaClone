# CollabCanvas MVP - Product Requirements Document

**Version 1.0 | 24-Hour Sprint**

## Executive Summary

CollabCanvas is a real-time collaborative design tool that allows multiple users to work simultaneously on a shared canvas. This PRD defines the Minimum Viable Product (MVP) requirements for the 24-hour checkpoint, focusing exclusively on collaborative infrastructure over feature richness.

**Core Principle**: A simple canvas with bulletproof multiplayer is worth more than a feature-rich canvas with broken sync.

---

## User Stories

### Primary User - Designer/Creator

- **As a designer**, I want to create and move shapes on a canvas so that I can express my ideas visually
- **As a designer**, I want to see other users' cursors and actions in real-time so that I can collaborate effectively
- **As a designer**, I want my work to persist when I leave and return so that my progress isn't lost
- **As a designer**, I want to pan and zoom the canvas so that I can navigate large designs

### Secondary User - Collaborator

- **As a collaborator**, I want to see who else is working on the canvas so that I know who I'm working with
- **As a collaborator**, I want to see changes instantly as they happen so that we avoid conflicts
- **As a collaborator**, I want to identify other users by their cursor labels so that I know who is making which changes

### System User - Anonymous to Authenticated

- **As a new user**, I want to quickly create an account or sign in so that I can start collaborating
- **As a returning user**, I want the canvas state to persist so that work isn't lost between sessions

---

## MVP Features (24-Hour Checkpoint)

### 🎯 Critical Path Features

#### 1. Canvas Foundation

- **Pan**: Click and drag to navigate the canvas
- **Zoom**: Mouse wheel or pinch to zoom (10% - 200% range is sufficient)
- **Viewport**: Minimum 2000x2000px workspace
- **Per-User Viewport**: Each user maintains their own pan/zoom state independently

#### 2. Object Manipulation

- **Single Shape Type**: Start with rectangles only (simplest to implement)
- **Create**: Click to place a rectangle at cursor position
- **Move**: Drag to reposition objects
- **Visual Feedback**: Show selection state with border/handles

#### 3. Real-Time Synchronization

- **Object Sync**: All object creates/moves broadcast in <100ms
- **Cursor Sync**: All cursor positions update in <50ms
- **Conflict Resolution**: Last-write-wins for simultaneous edits
- **State Persistence**: Canvas state saved to database

#### 4. Multiplayer Presence

- **Live Cursors**: Show all active user cursors with smooth interpolation
- **Name Labels**: Display username next to cursor
- **Online List**: Show who's currently connected
- **User Colors**: Assign unique colors to each user
- **Presence TTL**: Auto-cleanup of disconnected users (~30 seconds)

#### 5. Authentication

- **Simple Auth**: Email/password or Google OAuth
- **User Profiles**: Store username and assigned color
- **Session Management**: Handle login/logout states

#### 6. Deployment

- **Public URL**: Accessible without VPN/localhost
- **SSL**: HTTPS required for WebSocket connections
- **Environment**: Production-ready, not development mode

---

## Tech Stack Recommendations

### Option A: Firebase Stack (Recommended for 24-hour sprint)

**Pros**: Fastest to implement, built-in real-time sync, minimal backend code
**Cons**: Potential scalability costs, vendor lock-in

- **Frontend**: React + TypeScript (Next.js optional for static export)
- **Canvas Library**: Konva.js (React-Konva)
- **Real-time DB**: Firebase Firestore with real-time listeners (WebSocket under the hood)
- **Authentication**: Firebase Auth (Anonymous primary, Email/Password, Google OAuth optional)
- **Hosting**: Vercel or Firebase Hosting
- **State Management**: Zustand (lightweight, perfect for real-time)

### Option B: Supabase Stack (Good alternative)

**Pros**: Open-source, PostgreSQL, good real-time features
**Cons**: Slightly more setup than Firebase

- **Frontend**: React + TypeScript
- **Canvas Library**: Konva.js
- **Real-time**: Supabase Realtime (PostgreSQL changes)
- **Authentication**: Supabase Auth
- **Database**: Supabase (PostgreSQL)
- **Hosting**: Vercel

### Option C: Custom WebSocket (Not recommended for MVP)

**Pros**: Full control, potentially better performance
**Cons**: Too much work for 24 hours, more things can break

---

## Implementation Pitfalls & Considerations

### 🚨 Critical Warnings

1. **Start with Multiplayer First**

   - Build cursor sync → object sync → then UI
   - Testing multiplayer last = guaranteed failure

2. **State Management Complexity**

   - Don't use Redux for real-time (too much boilerplate)
   - Avoid reconciling local and remote state manually
   - Let Firebase/Supabase handle sync, just listen and update UI

3. **Performance Bottlenecks**

   - Throttle cursor updates (30-60 FPS max, not every mousemove)
   - Batch object updates when possible
   - Use React.memo() aggressively for canvas objects
   - Implement client-side cursor interpolation for smooth movement

4. **Canvas Library Choice**

   - HTML5 Canvas API = too low level for 24 hours
   - Konva.js = good balance of features and performance
   - Fabric.js = good but heavier, more features you won't use

5. **Authentication Gotchas**

   - Anonymous auth first, upgrade to email later
   - Don't build custom auth in 24 hours
   - Store user color/cursor in user metadata

6. **Deployment Issues**
   - WebSockets need WSS (secure) in production
   - CORS will be a problem - configure early
   - Environment variables for Firebase/Supabase keys

---

## Out of Scope for MVP

### ❌ Do NOT Build These

- Multiple shape types (stick to rectangles only)
- Shape styling (colors, borders, fills)
- Resize or rotate transformations
- Text editing capabilities
- Undo/redo functionality
- Copy/paste
- Layers panel
- Export functionality
- Room/document management (single canvas for MVP)
- Permission systems
- Shape selection rectangles
- Keyboard shortcuts
- Touch/mobile support
- AI features (save for after MVP)

---

## Success Metrics

### MVP Validation Criteria

✅ 2 users can see each other's cursors moving smoothly
✅ Creating a rectangle on one screen appears on another in <100ms
✅ Users can pan and zoom independently
✅ Canvas state persists after all users disconnect
✅ 5 users can connect simultaneously without crashes
✅ Deployed to public URL with HTTPS
✅ Stable performance with 50+ objects (500+ objects is stretch goal)

---

## Development Timeline (24 Hours)

### Suggested Sprint Plan

**Hours 0-4: Foundation**

- Set up React project with TypeScript
- Configure Firebase/Supabase
- Deploy empty app to verify pipeline

**Hours 4-8: Authentication & Presence**

- Implement basic auth flow
- Set up user presence tracking
- Create cursor component with labels

**Hours 8-12: Real-time Sync**

- Implement cursor position broadcasting
- Add Firestore/Supabase listeners
- Test with 2 browser windows

**Hours 12-16: Canvas & Objects**

- Integrate Konva.js
- Add pan/zoom controls
- Implement rectangle creation and movement

**Hours 16-20: Object Synchronization**

- Sync object creation across clients
- Sync object movement
- Add persistence layer

**Hours 20-24: Testing & Polish**

- Multi-user testing (3-4 browsers)
- Fix sync bugs
- Deploy and verify production works
- Record demo video

---

## Risk Mitigation

1. **If real-time sync is failing**: Switch to polling (not ideal but works)
2. **If canvas library is problematic**: Use plain SVG (simpler but works)
3. **If deployment fails**: Use Firebase Hosting (most reliable)
4. **If auth is taking too long**: Use anonymous sessions only
5. **If performance is poor**: Reduce viewport size, MVP target is 50+ objects stable

---

## Final Recommendations

1. **Use Firebase** - It's built for this exact use case
2. **Start with cursors only** - Get this working in first 4 hours
3. **Keep shapes simple** - Rectangles only, no styling
4. **Test constantly** - Always have 2+ browser tabs open
5. **Deploy early** - Hour 4, not hour 23
6. **One developer, one feature** - Don't split real-time sync across people

**Remember**: The evaluators will test with multiple users creating and moving shapes rapidly. Your sync MUST be rock solid. Everything else is secondary.
