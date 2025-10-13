# PRD & Architecture Alignment Changes

## Summary

Updated both `PRD.md` and `Architecture.md` to ensure complete alignment between product requirements and technical architecture. All changes maintain consistency across both documents.

---

## Changes Made to Architecture.md

### 1. **Cursor Throttling & Rate Limits** ✅

- **Changed**: Cursor throttle from 20 FPS → **30 FPS** (lines 67, 138, 356)
- **Changed**: Rate limit from 20/sec → **30/sec** (line 422)
- **Rationale**: Aligns with PRD guidance of 30-60 FPS throttling for optimal cursor smoothness

### 2. **Firestore Collection Path Naming** ✅

- **Changed**: `canvas/canvasId/` → **`canvases/canvasId/`** (line 37)
- **Rationale**: Standardizes collection naming convention throughout architecture

### 3. **Viewport Management** ✅

- **Changed**: Moved viewport from shared Canvas Store to **User Store (Personal Viewport)** (lines 15, 253, 483)
- **Changed**: State persistence now saves to Presence per-user (line 182)
- **Rationale**: Enables independent pan/zoom as required by PRD success criteria

### 4. **Authentication Providers** ✅

- **Changed**: Added priority order and Google OAuth option (line 29)
  - Anonymous (Primary)
  - Email/Password
  - Google OAuth (Optional)
- **Rationale**: Clarifies MVP auth strategy matching PRD recommendations

### 5. **Hosting & Deployment Details** ✅

- **Enhanced**: Added explicit requirements (line 49)
  - CDN + SSL/HTTPS
  - WSS for WebSockets
  - CORS Configuration
  - Firebase Env Vars
- **Rationale**: Addresses PRD warnings about deployment issues

### 6. **Performance Targets** ✅

- **Changed**: Object count expectations (lines 209-210, 403)
  - MVP: **50+ objects** (stable target)
  - Stretch: **500+ objects** (aspirational)
- **Rationale**: Aligns with PRD risk mitigation guidance

### 7. **React.memo & Performance** ✅

- **Added**: Performance optimization notes (lines 239, 469)
  - Object Renderer: "React.memo for Performance"
  - Rectangle Component: "Memoized"
- **Rationale**: Implements PRD performance best practices

### 8. **Cursor Interpolation** ✅

- **Added**: Client-side interpolation notes (lines 243, 473)
  - Cursor Presence: "Client-side Interpolation"
  - Cursor Component: "Smooth Animation"
  - Sequence diagram: "Render U1 Cursor (Interpolated)" (line 142)
- **Rationale**: Matches PRD requirement for smooth cursor movement

### 9. **Presence System Details** ✅

- **Enhanced**: Presence Listener documentation (line 344)
  - "Per-User Presence"
  - "30s TTL"
  - "50ms broadcast"
- **Rationale**: Clarifies presence cleanup behavior

### 10. **Single Canvas MVP Scope** ✅

- **Added**: Canvas Listener note (line 346)
  - "Single Canvas MVP"
- **Updated**: Firestore Storage documentation (line 351)
  - "canvases (single MVP)"
  - "canvases/{id}/objects"
- **Rationale**: Clarifies MVP scope (no multi-room UI)

### 11. **Next.js/WebSocket Clarification** ✅

- **Changed**: Next.js Server marked as optional (line 325)
  - "Next.js Server (Optional)"
  - "Static Export Preferred"
  - "Minimal Backend"
  - "Firestore handles real-time"
- **Changed**: WebSocket nodes clarified (lines 329-332)
  - "Firestore Listener" added to labels
- **Rationale**: Emphasizes Firebase handles real-time, avoiding custom WebSocket confusion

---

## Changes Made to PRD.md

### 1. **Canvas Foundation** ✅

- **Added**: Per-user viewport requirement (line 44)
  - "Each user maintains their own pan/zoom state independently"
- **Rationale**: Explicit requirement for independent navigation

### 2. **Multiplayer Presence** ✅

- **Added**: Presence TTL detail (line 65)
  - "Presence TTL: Auto-cleanup of disconnected users (~30 seconds)"
- **Rationale**: Matches Architecture implementation detail

### 3. **Performance Bottlenecks** ✅

- **Added**: Cursor interpolation guidance (line 133)
  - "Implement client-side cursor interpolation for smooth movement"
- **Rationale**: Ensures smooth cursor rendering is planned

### 4. **Tech Stack Details** ✅

- **Enhanced**: Firebase Stack option (lines 89-94)
  - Frontend: "Next.js optional for static export"
  - Real-time DB: "WebSocket under the hood"
  - Authentication: "Anonymous primary, Email/Password, Google OAuth optional"
- **Rationale**: Clarifies tech choices and priorities

### 5. **Out of Scope Clarification** ✅

- **Changed**: Room/document management note (line 168)
  - "Room/document management (single canvas for MVP)"
- **Rationale**: Explicit about single-canvas limitation

### 6. **Success Metrics** ✅

- **Added**: Performance criterion (line 187)
  - "Stable performance with 50+ objects (500+ objects is stretch goal)"
- **Rationale**: Sets clear MVP performance target

### 7. **Risk Mitigation** ✅

- **Changed**: Performance guidance (line 240)
  - "MVP target is 50+ objects stable"
- **Rationale**: Consistent with updated success metrics

---

## Verification Checklist

### Alignment Confirmed ✅

- [x] Cursor throttling: 30 FPS (Architecture) ↔ 30-60 FPS range (PRD)
- [x] Rate limits: 30/sec cursor (Architecture) ↔ throttle guidance (PRD)
- [x] Viewport: Per-user in UserStore (Architecture) ↔ Independent pan/zoom (PRD)
- [x] Collection paths: `canvases/{id}/objects` standardized
- [x] Performance: 50+ MVP, 500+ stretch (both docs)
- [x] Auth: Anonymous primary, Email/Password, Google optional (both docs)
- [x] Hosting: HTTPS/WSS, CORS, env vars documented (both docs)
- [x] Cursor: Interpolation noted in both docs
- [x] Presence: 30s TTL documented in both docs
- [x] Scope: Single canvas MVP clarified in both docs
- [x] Backend: Minimal/optional server, Firestore real-time (both docs)
- [x] React.memo: Performance practice noted in both docs

---

## Key Takeaways

1. **Performance targets are realistic**: MVP focuses on 50+ objects, with 500+ as stretch
2. **Independent viewports**: Each user maintains their own pan/zoom state
3. **Cursor smoothness**: 30 FPS throttle with client-side interpolation
4. **Minimal backend**: Firebase handles all real-time, optional Next.js for static export
5. **Auth priority**: Start with Anonymous, add Email/Password, Google is optional
6. **Single canvas MVP**: No multi-room UI in initial version
7. **Deployment ready**: Explicit HTTPS/WSS, CORS, and env var requirements

---

## No Breaking Changes

All changes are **clarifications and alignments** - no fundamental architecture changes required. The updates make implicit assumptions explicit and ensure both documents tell the same story.
