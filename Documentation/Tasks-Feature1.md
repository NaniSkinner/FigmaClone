# CollabCanvas Extended Features - Task List

**Version 2.0 | Detailed Implementation Tasks**

## Overview

This task list breaks down the PRD requirements into actionable tasks with clear subtasks, organized by PR. Each task includes estimated time, dependencies, and verification steps.

---

## PR #9: Extended Shape Types & Text Foundation

**Target: Day 1-2 (10 hours)**

### Task 9.1: Update Type System for New Shapes

**Time: 1 hour**

- [ ] Extend `src/types/canvas.ts` with Circle, Line, and Text interfaces
- [ ] Add shape type enum: `type ShapeType = 'rectangle' | 'circle' | 'line' | 'text'`
- [ ] Update CanvasObject union type to include all shapes
- [ ] Add zIndex property to base object interface
- [ ] Add rotation property (optional) to all shapes
- [ ] Update imports in all files using CanvasObject type

### Task 9.2: Create Circle Component

**Time: 2 hours**

- [ ] Create `src/components/Objects/Circle.tsx`
- [ ] Implement Konva.Circle with proper props mapping
- [ ] Add drag functionality matching Rectangle behavior
- [ ] Implement selection state visualization
- [ ] Add transformer for resize (maintain aspect ratio)
- [ ] Handle boundary constraints for circles
- [ ] Test real-time sync with Firestore

### Task 9.3: Create Line Component

**Time: 2 hours**

- [ ] Create `src/components/Objects/Line.tsx`
- [ ] Implement Konva.Line with points array
- [ ] Add drag functionality for entire line
- [ ] Create custom transformer for line endpoints
- [ ] Add stroke width property (no fill)
- [ ] Implement selection highlight for lines
- [ ] Handle line-specific boundary constraints

### Task 9.4: Create Text Component

**Time: 2 hours**

- [ ] Create `src/components/Objects/Text.tsx`
- [ ] Implement Konva.Text with basic properties
- [ ] Add placeholder text "Enter text"
- [ ] Implement click-to-select behavior
- [ ] Add text boundary box visualization
- [ ] Prepare double-click handler (for PR #10)
- [ ] Set default font properties (Arial, 16px)

### Task 9.5: Update Canvas Drawing Logic

**Time: 2 hours**

- [ ] Modify `src/components/Canvas/Canvas.tsx` handleMouseDown
- [ ] Add shape type state to track current drawing mode
- [ ] Implement circle drawing (center + radius drag)
- [ ] Implement line drawing (point-to-point)
- [ ] Implement text placement (single click)
- [ ] Update preview rendering for each shape type
- [ ] Handle shape-specific creation completion logic

### Task 9.6: Update Canvas Controls UI

**Time: 1 hour**

- [ ] Modify `src/components/Canvas/CanvasControls.tsx`
- [ ] Add shape selector dropdown or button group
- [ ] Create icons/labels for each shape type
- [ ] Update tool state management
- [ ] Add keyboard shortcuts (R, C, L, T)
- [ ] Style active shape indicator
- [ ] Update mobile responsive layout

### Task 9.7: Testing & Bug Fixes

- [ ] Test circle creation and sync
- [ ] Test line creation and sync
- [ ] Test text placement
- [ ] Verify all shapes appear in other users' views
- [ ] Fix any sync latency issues
- [ ] Update ObjectRenderer to handle all shape types

---

## PR #10: Text Formatting System

**Target: Day 3-4 (8 hours)**

### Task 10.1: Create Text Editor Component

**Time: 3 hours**

- [ ] Create `src/components/Objects/TextEditor.tsx`
- [ ] Implement textarea or contentEditable overlay
- [ ] Position editor over Konva text object
- [ ] Handle zoom scaling for editor position
- [ ] Implement focus/blur event handlers
- [ ] Add escape key to exit edit mode
- [ ] Handle click-outside to save and exit
- [ ] Sync edited text to Firestore on blur

### Task 10.2: Build Formatting Toolbar

**Time: 2 hours**

- [ ] Create `src/components/UI/TextFormatToolbar.tsx`
- [ ] Add font size dropdown (12, 14, 16, 18, 24, 32, 48, 72)
- [ ] Add font family selector (Arial, Georgia, Courier New, Comic Sans, Roboto)
- [ ] Create bold toggle button
- [ ] Create italic toggle button
- [ ] Add text color picker
- [ ] Position toolbar above selected text
- [ ] Handle toolbar show/hide logic

### Task 10.3: Implement Text Formatting Logic

**Time: 2 hours**

- [ ] Create `src/hooks/useTextEditor.ts`
- [ ] Track current text formatting state
- [ ] Apply formatting to Konva text object
- [ ] Update Firestore with formatting changes
- [ ] Handle formatting for multi-line text
- [ ] Implement text measurement for auto-width
- [ ] Add font loading for custom fonts

### Task 10.4: Multi-line Text Support

**Time: 1 hour**

- [ ] Enable Enter key for line breaks
- [ ] Implement text wrapping logic
- [ ] Add draggable text box width handles
- [ ] Calculate text height dynamically
- [ ] Update text bounds calculation
- [ ] Handle text alignment options

### Task 10.5: Testing & Polish

- [ ] Test formatting persistence
- [ ] Verify multi-user text editing
- [ ] Test toolbar positioning at canvas edges
- [ ] Ensure text scales with zoom
- [ ] Fix formatting conflicts
- [ ] Add loading states for font changes

---

## PR #11: Multi-Selection System

**Target: Day 6-7 (10 hours)**

### Task 11.1: Update State Management

**Time: 1 hour**

- [ ] Modify `src/store/canvasStore.ts`
- [ ] Change selectedObjectId to selectedObjectIds (Set<string>)
- [ ] Add selection box state (start point, current point)
- [ ] Add isSelecting flag
- [ ] Create selection management actions
- [ ] Add helper methods (addToSelection, removeFromSelection, clearSelection)
- [ ] Update all components using selection state

### Task 11.2: Implement Shift-Click Selection

**Time: 2 hours**

- [ ] Update all shape components' onClick handlers
- [ ] Detect Shift key state on click
- [ ] Toggle object in selection set
- [ ] Update visual feedback for multi-selected state
- [ ] Prevent deselection when Shift is held
- [ ] Handle Shift-click on empty space (no deselect)

### Task 11.3: Create Selection Box Component

**Time: 2 hours**

- [ ] Create `src/components/Canvas/SelectionBox.tsx`
- [ ] Render semi-transparent blue rectangle
- [ ] Update position during drag
- [ ] Show dashed border style
- [ ] Handle negative dimensions (drag up-left)
- [ ] Z-index above objects but below cursors

### Task 11.4: Implement Drag Selection

**Time: 3 hours**

- [ ] Update Canvas.tsx mouseDown handler for selection start
- [ ] Track mouse position during selection drag
- [ ] Calculate selection box bounds
- [ ] Implement intersection detection for all shapes
- [ ] Update selected set based on intersection
- [ ] Handle partial vs. complete object intersection
- [ ] Clear selection box on mouse up

### Task 11.5: Group Operations

**Time: 1 hour**

- [ ] Implement group move (all selected objects)
- [ ] Update delete to handle multiple objects
- [ ] Calculate group bounding box
- [ ] Show group selection outline
- [ ] Update transform operations for groups
- [ ] Sync group operations to Firestore

### Task 11.6: Keyboard Shortcuts

**Time: 1 hour**

- [ ] Implement Ctrl/Cmd+A (select all)
- [ ] Add Escape key (deselect all)
- [ ] Handle Delete key for multi-delete
- [ ] Prevent browser default actions
- [ ] Add visual feedback for operations
- [ ] Test across different OS/browsers

### Task 11.7: Testing & Performance

- [ ] Test with 20+ objects selected
- [ ] Verify group operations sync
- [ ] Test selection box accuracy
- [ ] Optimize intersection calculations
- [ ] Fix selection visual glitches
- [ ] Profile performance with many objects

---

## PR #12: Complete Transform Operations

**Target: Day 8-9 (10 hours)**

### Task 12.1: Enhance Rectangle Resize

**Time: 1 hour**

- [ ] Update `src/components/Objects/Rectangle.tsx`
- [ ] Configure 8-point transformer
- [ ] Add Shift key constraint for aspect ratio
- [ ] Implement min/max size limits
- [ ] Show size tooltip during resize
- [ ] Update bounds checking during resize

### Task 12.2: Implement Circle Resize

**Time: 1 hour**

- [ ] Update Circle.tsx transformer config
- [ ] Map scale to radius changes
- [ ] Maintain circle aspect ratio always
- [ ] Show radius value during resize
- [ ] Handle center point during resize
- [ ] Update intersection for resized circles

### Task 12.3: Implement Line Resize

**Time: 1 hour**

- [ ] Create custom line transformer
- [ ] Add endpoint drag handles
- [ ] Update points array during resize
- [ ] Maintain line stroke width
- [ ] Show line length during resize
- [ ] Handle line rotation separately

### Task 12.4: Implement Text Resize

**Time: 1 hour**

- [ ] Update Text.tsx with resize capability
- [ ] Scale font size proportionally
- [ ] Maintain text aspect ratio
- [ ] Update text bounds after resize
- [ ] Handle multi-line text resize
- [ ] Preserve text formatting

### Task 12.5: Add Rotation System

**Time: 3 hours**

- [ ] Add rotation handle to transformer
- [ ] Calculate rotation angle from mouse position
- [ ] Display rotation degrees in tooltip
- [ ] Implement 15° snap with Shift key
- [ ] Update object rotation property
- [ ] Handle rotation origin point
- [ ] Sync rotation to Firestore

### Task 12.6: Multi-Select Transform

**Time: 2 hours**

- [ ] Create group transformer component
- [ ] Calculate group bounding box
- [ ] Apply transforms to all selected objects
- [ ] Maintain relative positions
- [ ] Handle group rotation center
- [ ] Update all objects in single Firestore batch

### Task 12.7: Transform Constraints

**Time: 1 hour**

- [ ] Prevent objects leaving canvas during transform
- [ ] Implement smart snapping (optional)
- [ ] Add transform undo capability
- [ ] Handle edge cases (zero size, etc.)
- [ ] Performance optimize transform updates
- [ ] Test transform sync latency

---

## PR #13: Layer Management System

**Target: Day 11-12 (10 hours)**

### Task 13.1: Add Z-Index Support

**Time: 2 hours**

- [ ] Update all objects with zIndex property
- [ ] Modify object creation to assign zIndex
- [ ] Update ObjectRenderer to sort by zIndex
- [ ] Handle z-index conflicts (same value)
- [ ] Implement auto-increment for new objects
- [ ] Sync z-index changes to Firestore

### Task 13.2: Layer Ordering Functions

**Time: 2 hours**

- [ ] Create `src/hooks/useLayerManagement.ts`
- [ ] Implement bringToFront function
- [ ] Implement sendToBack function
- [ ] Implement bringForward function
- [ ] Implement sendBackward function
- [ ] Handle multi-select layer operations
- [ ] Add keyboard shortcuts for layer operations

### Task 13.3: Create Layer Panel UI

**Time: 3 hours**

- [ ] Create `src/components/Layers/LayerPanel.tsx`
- [ ] Design collapsible sidebar layout
- [ ] Add layer list with object thumbnails
- [ ] Implement drag handle for reordering
- [ ] Add visibility toggle (eye icon)
- [ ] Add lock toggle (lock icon)
- [ ] Style active/selected layer items

### Task 13.4: Layer Item Component

**Time: 1 hour**

- [ ] Create `src/components/Layers/LayerItem.tsx`
- [ ] Render object preview/icon
- [ ] Display object name/type
- [ ] Handle click to select
- [ ] Handle double-click to rename
- [ ] Show selection state
- [ ] Add hover effects

### Task 13.5: Drag-to-Reorder Implementation

**Time: 1 hour**

- [ ] Add drag-and-drop library or custom implementation
- [ ] Handle drag start/end events
- [ ] Update z-index during drag
- [ ] Show drop position indicator
- [ ] Animate layer reordering
- [ ] Sync new order to Firestore

### Task 13.6: Visibility & Lock System

**Time: 1 hour**

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

**Target: Day 13 (8 hours)**

### Task 14.1: Implement Duplicate System

**Time: 2 hours**

- [ ] Create duplicate function in canvasStore
- [ ] Generate new UUIDs for duplicates
- [ ] Clone all object properties
- [ ] Offset duplicates by 10px right and down
- [ ] Handle multi-object duplication
- [ ] Maintain relative positions in groups
- [ ] Select duplicated objects after creation
- [ ] Add to Firestore in batch operation

### Task 14.2: Copy/Paste System

**Time: 2 hours**

- [ ] Implement copy to clipboard (Ctrl+C)
- [ ] Store objects as JSON in clipboard
- [ ] Implement paste from clipboard (Ctrl+V)
- [ ] Paste at current mouse position
- [ ] Handle cross-browser clipboard API
- [ ] Validate and sanitize pasted data
- [ ] Generate new IDs for pasted objects
- [ ] Support cut operation (Ctrl+X)

### Task 14.3: Keyboard Shortcuts Manager

**Time: 2 hours**

- [ ] Create `src/hooks/useKeyboardShortcuts.ts`
- [ ] Set up global keyboard event listener
- [ ] Implement shortcut registry system
- [ ] Handle OS-specific key mappings (Cmd vs Ctrl)
- [ ] Prevent browser default actions
- [ ] Add shortcut conflict detection
- [ ] Create shortcut documentation

### Task 14.4: Tool Shortcuts Implementation

**Time: 1 hour**

- [ ] V - Select tool
- [ ] H - Pan tool
- [ ] R - Rectangle tool
- [ ] C - Circle tool
- [ ] L - Line tool
- [ ] T - Text tool
- [ ] Number keys for quick shape selection
- [ ] Space bar for temporary pan

### Task 14.5: Operation Shortcuts Implementation

**Time: 1 hour**

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
