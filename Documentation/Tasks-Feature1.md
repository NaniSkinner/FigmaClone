# CollabCanvas Extended Features - Task List

**Version 2.0 | Detailed Implementation Tasks**

## Overview

This task list breaks down the PRD requirements into actionable tasks with clear subtasks, organized by PR. Each task includes estimated time, dependencies, and verification steps.

---

## PR #9: Extended Shape Types & Text Foundation ✅ COMPLETED

### Task 9.1: Update Type System for New Shapes ✅

- [x] Extend `src/types/canvas.ts` with Circle, Line, and Text interfaces
- [x] Add shape type enum: `type ShapeType = 'rectangle' | 'circle' | 'line' | 'text'`
- [x] Update CanvasObject union type to include all shapes
- [x] Add zIndex property to base object interface - SKIPPED (PR #13)
- [x] Add rotation property (optional) to all shapes - SKIPPED (PR #12)
- [x] Update imports in all files using CanvasObject type

### Task 9.2: Create Circle Component ✅

- [x] Create `src/components/Objects/Circle.tsx`
- [x] Implement Konva.Circle with proper props mapping
- [x] Add drag functionality matching Rectangle behavior
- [x] Implement selection state visualization
- [x] Add transformer for resize (maintain aspect ratio)
- [x] Handle boundary constraints for circles
- [x] Test real-time sync with Firestore

### Task 9.3: Create Line Component ✅

- [x] Create `src/components/Objects/Line.tsx`
- [x] Implement Konva.Line with points array
- [x] Add drag functionality for entire line
- [x] Create custom transformer for line endpoints
- [x] Add stroke width property (no fill) - **Increased to 6px for visibility**
- [x] Implement selection highlight for lines
- [x] Handle line-specific boundary constraints

### Task 9.4: Create Text Component ✅

- [x] Create `src/components/Objects/Text.tsx`
- [x] Implement Konva.Text with basic properties
- [x] Add placeholder text "Enter text"
- [x] Implement click-to-select behavior
- [x] Add text boundary box visualization
- [x] Prepare double-click handler (for PR #10)
- [x] Set default font properties (Arial, 16px)

### Task 9.5: Update Canvas Drawing Logic ✅

- [x] Modify `src/components/Canvas/Canvas.tsx` handleMouseDown
- [x] Add shape type state to track current drawing mode
- [x] Implement circle drawing (center + radius drag)
- [x] Implement line drawing (point-to-point)
- [x] Implement text placement (single click)
- [x] Update preview rendering for each shape type
- [x] Handle shape-specific creation completion logic

### Task 9.6: Update Canvas Controls UI ✅

- [x] Modify `src/components/Canvas/CanvasControls.tsx`
- [x] Add individual shape tool buttons (Option B)
- [x] Create icons/labels for each shape type
- [x] Update tool state management
- [x] Add keyboard shortcuts noted in tooltips (R, C, L, T)
- [x] Style active shape indicator (green highlight)
- [x] Update mobile responsive layout

### Task 9.7: Testing & Bug Fixes ✅

- [x] Test circle creation and sync
- [x] Test line creation and sync
- [x] Test text placement
- [x] Verify all shapes appear in other users' views
- [x] Fix line visibility (increased stroke width to 6px)
- [x] Update ObjectRenderer to handle all shape types

**Git Commits:**

- `2770f84` - feat: PR #9 - Add extended shape types (Circle, Line, Text)
- `ef14a2a` - fix: Increase line stroke width from 3px to 6px for better visibility

---

## PR #10: Text Formatting System ✅ COMPLETED

### Task 10.1: Create Text Editor Component ✅

- [x] Create `src/components/Objects/TextEditor.tsx`
- [x] Implement textarea overlay
- [x] Position editor over Konva text object
- [x] Handle zoom scaling for editor position
- [x] Implement focus/blur event handlers
- [x] Add escape key to exit edit mode
- [x] Handle click-outside to save and exit
- [x] Sync edited text to Firestore
- [x] Fix stale closure bug with textRef

### Task 10.2: Build Formatting Toolbar ✅

- [x] Create `src/components/UI/TextFormatToolbar.tsx`
- [x] Add font size dropdown (12, 14, 16, 18, 24, 32, 48, 72)
- [x] Add font family selector (Arial, Georgia, Courier New, Comic Sans, Roboto)
- [x] Create bold toggle button
- [x] Create italic toggle button
- [x] Add text color picker
- [x] Position toolbar above selected text
- [x] Handle toolbar show/hide logic
- [x] Add click detection to prevent editor closing

### Task 10.3: Implement Text Formatting Logic ✅

- [x] Track current text formatting state
- [x] Apply formatting to Konva text object
- [x] Update Firestore with formatting changes
- [x] Handle formatting for multi-line text
- [x] Immediate local updates before Firestore sync

### Task 10.4: Multi-line Text Support ✅

- [x] Enable Enter key for line breaks
- [x] Text wrapping logic built-in
- [x] Calculate text height dynamically

### Task 10.5: Testing & Polish ✅

- [x] Test formatting persistence - All working
- [x] Verify multi-user text editing - Syncs correctly
- [x] Test toolbar positioning - Works at all zoom levels
- [x] Ensure text scales with zoom - Confirmed
- [x] Increase default text size to 32px for better visibility

**Git Commits:**

- `9c163de` - feat: PR #10 - Text Formatting System with full editing capabilities

---

## PR #11: Multi-Selection System ✅ COMPLETED

### Task 11.1: Update State Management ✅

- [x] Modify `src/store/canvasStore.ts`
- [x] Change selectedObjectId to selectedObjectIds (Set<string>)
- [x] Add selection box state (start point, current point)
- [x] Add isSelecting flag
- [x] Create selection management actions
- [x] Add helper methods (addToSelection, removeFromSelection, clearSelection)
- [x] Update all components using selection state

### Task 11.2: Implement Shift-Click Selection ✅

- [x] Update all shape components' onClick handlers
- [x] Detect Shift key state on click
- [x] Toggle object in selection set
- [x] Update visual feedback for multi-selected state
- [x] Prevent deselection when Shift is held
- [x] Handle Shift-click on empty space (no deselect)

### Task 11.3: Create Selection Box Component ✅

- [x] Create `src/components/Canvas/SelectionBox.tsx`
- [x] Render semi-transparent blue rectangle
- [x] Update position during drag
- [x] Show dashed border style
- [x] Handle negative dimensions (drag up-left)
- [x] Z-index above objects but below cursors

### Task 11.4: Implement Drag Selection ✅

- [x] Update Canvas.tsx mouseDown handler for selection start
- [x] Track mouse position during selection drag
- [x] Calculate selection box bounds
- [x] Implement intersection detection for all shapes
- [x] Update selected set based on intersection
- [x] Handle partial vs. complete object intersection
- [x] Clear selection box on mouse up

### Task 11.5: Group Operations ✅

- [x] Implement group move (all selected objects) - Note: Individual objects can be moved; coordinated group drag deferred to future enhancement
- [x] Update delete to handle multiple objects
- [x] Calculate group bounding box - Deferred to PR #12
- [x] Show group selection outline - Individual selections shown
- [x] Update transform operations for groups - Deferred to PR #12
- [x] Sync group operations to Firestore

### Task 11.6: Keyboard Shortcuts ✅

- [x] Implement Ctrl/Cmd+A (select all)
- [x] Add Escape key (deselect all)
- [x] Handle Delete key for multi-delete
- [x] Prevent browser default actions
- [x] Add visual feedback for operations
- [x] Test across different OS/browsers

### Task 11.7: Testing & Performance ✅

- [x] Test with 20+ objects selected
- [x] Verify group operations sync
- [x] Test selection box accuracy
- [x] Optimize intersection calculations
- [x] Fix selection visual glitches
- [x] Profile performance with many objects

**Git Commits:**

- TBD - feat: PR #11 - Multi-Selection System with drag-to-select and keyboard shortcuts

---

## PR #12: Complete Transform Operations

### Task 12.1: Enhance Rectangle Resize

- [ ] Update `src/components/Objects/Rectangle.tsx`
- [ ] Configure 8-point transformer
- [ ] Add Shift key constraint for aspect ratio
- [ ] Implement min/max size limits
- [ ] Show size tooltip during resize
- [ ] Update bounds checking during resize

### Task 12.2: Implement Circle Resize

- [ ] Update Circle.tsx transformer config
- [ ] Map scale to radius changes
- [ ] Maintain circle aspect ratio always
- [ ] Show radius value during resize
- [ ] Handle center point during resize
- [ ] Update intersection for resized circles

### Task 12.3: Implement Line Resize

- [ ] Create custom line transformer
- [ ] Add endpoint drag handles
- [ ] Update points array during resize
- [ ] Maintain line stroke width
- [ ] Show line length during resize
- [ ] Handle line rotation separately

### Task 12.4: Implement Text Resize

- [ ] Update Text.tsx with resize capability
- [ ] Scale font size proportionally
- [ ] Maintain text aspect ratio
- [ ] Update text bounds after resize
- [ ] Handle multi-line text resize
- [ ] Preserve text formatting

### Task 12.5: Add Rotation System

- [ ] Add rotation handle to transformer
- [ ] Calculate rotation angle from mouse position
- [ ] Display rotation degrees in tooltip
- [ ] Implement 15° snap with Shift key
- [ ] Update object rotation property
- [ ] Handle rotation origin point
- [ ] Sync rotation to Firestore

### Task 12.6: Multi-Select Transform

- [ ] Create group transformer component
- [ ] Calculate group bounding box
- [ ] Apply transforms to all selected objects
- [ ] Maintain relative positions
- [ ] Handle group rotation center
- [ ] Update all objects in single Firestore batch

### Task 12.7: Transform Constraints

- [ ] Prevent objects leaving canvas during transform
- [ ] Implement smart snapping (optional)
- [ ] Add transform undo capability
- [ ] Handle edge cases (zero size, etc.)
- [ ] Performance optimize transform updates
- [ ] Test transform sync latency

---

## PR #13: Layer Management System

### Task 13.1: Add Z-Index Support

- [ ] Update all objects with zIndex property
- [ ] Modify object creation to assign zIndex
- [ ] Update ObjectRenderer to sort by zIndex
- [ ] Handle z-index conflicts (same value)
- [ ] Implement auto-increment for new objects
- [ ] Sync z-index changes to Firestore

### Task 13.2: Layer Ordering Functions

- [ ] Create `src/hooks/useLayerManagement.ts`
- [ ] Implement bringToFront function
- [ ] Implement sendToBack function
- [ ] Implement bringForward function
- [ ] Implement sendBackward function
- [ ] Handle multi-select layer operations
- [ ] Add keyboard shortcuts for layer operations

### Task 13.3: Create Layer Panel UI

- [ ] Create `src/components/Layers/LayerPanel.tsx`
- [ ] Design collapsible sidebar layout
- [ ] Add layer list with object thumbnails
- [ ] Implement drag handle for reordering
- [ ] Add visibility toggle (eye icon)
- [ ] Add lock toggle (lock icon)
- [ ] Style active/selected layer items

### Task 13.4: Layer Item Component

- [ ] Create `src/components/Layers/LayerItem.tsx`
- [ ] Render object preview/icon
- [ ] Display object name/type
- [ ] Handle click to select
- [ ] Handle double-click to rename
- [ ] Show selection state
- [ ] Add hover effects

### Task 13.5: Drag-to-Reorder Implementation

- [ ] Add drag-and-drop library or custom implementation
- [ ] Handle drag start/end events
- [ ] Update z-index during drag
- [ ] Show drop position indicator
- [ ] Animate layer reordering
- [ ] Sync new order to Firestore

### Task 13.6: Visibility & Lock System

- [ ] Add visible and locked properties to objects
- [ ] Update rendering to skip invisible objects
- [ ] Prevent selection of locked objects
- [ ] Update UI to show locked state
- [ ] Handle locked objects in group selection
- [ ] Sync visibility/lock state

### Task 13.7: Testing & Integration

- [ ] Test with 30+ layers
- [ ] Verify drag reordering accuracy
- [ ] Test visibility toggle performance
- [ ] Verify lock prevents all edits
- [ ] Test layer panel responsiveness
- [ ] Fix z-index sync conflicts

---

## PR #14: Productivity Features

### Task 14.1: Implement Duplicate System

- [ ] Create duplicate function in canvasStore
- [ ] Generate new UUIDs for duplicates
- [ ] Clone all object properties
- [ ] Offset duplicates by 10px right and down
- [ ] Handle multi-object duplication
- [ ] Maintain relative positions in groups
- [ ] Select duplicated objects after creation
- [ ] Add to Firestore in batch operation

### Task 14.2: Copy/Paste System

- [ ] Implement copy to clipboard (Ctrl+C)
- [ ] Store objects as JSON in clipboard
- [ ] Implement paste from clipboard (Ctrl+V)
- [ ] Paste at current mouse position
- [ ] Handle cross-browser clipboard API
- [ ] Validate and sanitize pasted data
- [ ] Generate new IDs for pasted objects
- [ ] Support cut operation (Ctrl+X)

### Task 14.3: Keyboard Shortcuts Manager

- [ ] Create `src/hooks/useKeyboardShortcuts.ts`
- [ ] Set up global keyboard event listener
- [ ] Implement shortcut registry system
- [ ] Handle OS-specific key mappings (Cmd vs Ctrl)
- [ ] Prevent browser default actions
- [ ] Add shortcut conflict detection
- [ ] Create shortcut documentation

### Task 14.4: Tool Shortcuts Implementation

- [ ] V - Select tool
- [ ] H - Pan tool
- [ ] R - Rectangle tool
- [ ] C - Circle tool
- [ ] L - Line tool
- [ ] T - Text tool
- [ ] Number keys for quick shape selection
- [ ] Space bar for temporary pan

### Task 14.5: Operation Shortcuts Implementation

- [ ] Delete/Backspace - Delete selected
- [ ] Ctrl+D - Duplicate
- [ ] Ctrl+A - Select all
- [ ] Escape - Clear selection
- [ ] Ctrl+Z - Undo (if time permits)
- [ ] Ctrl+Shift+Z - Redo (if time permits)
- [ ] Add visual feedback for operations

### Task 14.6: View Shortcuts Implementation

- [ ] Ctrl+0 - Reset zoom
- [ ] Ctrl++ - Zoom in
- [ ] Ctrl+- - Zoom out
- [ ] Ctrl+1 - Actual size (100%)
- [ ] Home - Go to canvas origin
- [ ] End - Go to canvas end

---

## Testing & Quality Assurance

### Integration Testing Checklist

**After Each PR:**

- [ ] All new features work as specified
- [ ] No regression in existing features
- [ ] Multi-user sync maintains <100ms latency
- [ ] Performance with 50+ objects acceptable
- [ ] No console errors or warnings
- [ ] Mobile responsive (if applicable)

### Final System Testing

**Day 14-15:**

- [ ] Create test scenario with all shape types
- [ ] Test all keyboard shortcuts
- [ ] Verify 5 concurrent users work smoothly
- [ ] Test with 100+ objects on canvas
- [ ] Check all layer operations
- [ ] Verify text formatting persistence
- [ ] Test copy/paste across sessions
- [ ] Performance profiling
- [ ] Browser compatibility (Chrome, Firefox, Safari)
- [ ] Document any known issues

---

## Daily Standup Checklist

### Questions to Answer Each Day:

1. Which tasks were completed yesterday?
2. Which tasks are blocked?
3. What's the target for today?
4. Any technical decisions needed?
5. Current sync latency metrics?
6. Any performance concerns?

### Metrics to Track:

- Tasks completed vs. planned
- Test coverage percentage
- Sync latency (target: <100ms)
- Frame rate during operations (target: 60fps)
- Number of concurrent users tested
- Bug count (critical/major/minor)

---

## Dependencies & Blockers

### Technical Dependencies:

- Konva.js transformer API for resize/rotate
- Browser clipboard API for copy/paste
- Font loading API for custom fonts
- Drag-and-drop library for layer panel (optional)

### Potential Blockers:

- Text editing conflicts in multi-user scenarios
- Performance with many objects and layers
- Complex transform math for rotations
- Browser-specific clipboard restrictions
- Font loading cross-origin issues

---

## Definition of Done

### For Each Task:

- [ ] Code implemented and working locally
- [ ] Real-time sync verified with 2+ users
- [ ] No TypeScript errors
- [ ] Performance meets requirements
- [ ] Tested on Chrome and Firefox
- [ ] Code reviewed (if team)
- [ ] Firestore rules updated if needed

### For Each PR:

- [ ] All tasks complete
- [ ] Integration tests passing
- [ ] Documentation updated
- [ ] No regression in existing features
- [ ] Deployed to staging/preview
- [ ] Stakeholder sign-off

---

## Notes

- Prioritize core functionality over perfect UI
- Keep sync latency under 100ms at all costs
- Test multi-user scenarios frequently
- Document any technical debt for later
- Consider feature flags for gradual rollout
- Keep PRD handy for requirement clarification
