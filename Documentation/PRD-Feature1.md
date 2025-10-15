# CollabCanvas Extended Features - Product Requirements Document

**Version 2.0 | Post-MVP Feature Set**

## Executive Summary

This PRD defines the extended feature set required to achieve "Excellent" grade (7-8 points) in Canvas Functionality. Building upon the existing MVP (basic rectangles, pan/zoom, single selection), we need to implement comprehensive shape support, text layers, multi-selection, complete transform operations, layer management, and productivity features.

**Success Criteria**: Achieve all 7 evaluation points for Canvas Functionality grading category.

---

## Feature Requirements

### 🎯 PR #9: Extended Shape Types & Text Foundation

**Objective**: Expand from single rectangle type to support circles, lines, and text objects.

#### 9.1 Circle Shape

**Functional Requirements:**

- Create circles by clicking and dragging from center point
- Display radius while drawing
- Maintain perfect circle aspect ratio
- Support same styling as rectangles (fill: #D4E7C5, stroke: #B4A7D6)

**Technical Requirements:**

- Extend `CanvasObject` type to include `Circle` interface
- Create `Circle.tsx` component using Konva.Circle
- Add circle tool to toolbar with icon
- Sync circle properties to Firestore

**Data Model:**

```typescript
interface Circle {
  id: string;
  type: "circle";
  x: number; // center x
  y: number; // center y
  radius: number;
  fill: string;
  stroke: string;
  strokeWidth: number;
  rotation?: number;
  zIndex: number;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}
```

#### 9.2 Line Shape

**Functional Requirements:**

- Create lines by click-drag (start to end point)
- Show line preview during creation
- Support different stroke widths (1-10px)
- No fill property (stroke only)

**Technical Requirements:**

- Implement `Line.tsx` using Konva.Line
- Handle two-point coordinate system
- Add line thickness selector in toolbar

**Data Model:**

```typescript
interface Line {
  id: string;
  type: "line";
  points: [number, number, number, number]; // [x1, y1, x2, y2]
  stroke: string;
  strokeWidth: number;
  rotation?: number;
  zIndex: number;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}
```

#### 9.3 Text Object

**Functional Requirements:**

- Single-click to place text cursor
- Default text: "Enter text"
- Immediate edit mode on creation
- Basic text properties (no formatting in this PR)

**Technical Requirements:**

- Create `Text.tsx` using Konva.Text
- Implement click-to-place mechanism
- Store text content in Firestore

**Data Model:**

```typescript
interface Text {
  id: string;
  type: "text";
  x: number;
  y: number;
  text: string;
  fontSize: number; // default: 16
  fontFamily: string; // default: 'Arial'
  fontStyle?: "normal" | "bold" | "italic" | "bold italic";
  fill: string;
  width?: number; // auto-width initially
  rotation?: number;
  zIndex: number;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}
```

**Acceptance Criteria:**

- [ ] Can create circles, lines, and text objects
- [ ] All shapes sync in real-time across users
- [ ] Shape selector UI in toolbar
- [ ] Each shape type has distinct creation pattern

---

### 🎯 PR #10: Text Formatting System

**Objective**: Add rich text editing capabilities with formatting toolbar.

#### 10.1 Inline Text Editor

**Functional Requirements:**

- Double-click text to enter edit mode
- Show text cursor and selection
- Support keyboard navigation (arrows, home/end)
- Exit on Escape or click outside
- Auto-save on blur

**Technical Requirements:**

- Create `TextEditor.tsx` component
- Use contentEditable or textarea overlay
- Position editor exactly over Konva text
- Handle zoom scaling for editor

#### 10.2 Formatting Toolbar

**Functional Requirements:**

- Appears above selected text
- Font size selector (12, 14, 16, 18, 24, 32, 48, 72px)
- Font family dropdown (Arial, Georgia, Courier New, Comic Sans, Roboto)
- Bold/Italic toggle buttons
- Color picker for text

**Technical Requirements:**

- Create `TextFormatToolbar.tsx`
- Position using floating UI principles
- Update text properties in real-time
- Sync formatting changes to Firestore

**UI Mockup:**

```
[12px ▼] [Arial ▼] [B] [I] [Color■]
```

#### 10.3 Multi-line Text Support

**Functional Requirements:**

- Enter key creates new line
- Text wrapping at specified width
- Adjustable text box width

**Acceptance Criteria:**

- [ ] Double-click enters edit mode
- [ ] Formatting toolbar shows for selected text
- [ ] All formatting options work and persist
- [ ] Multi-user text editing doesn't conflict
- [ ] Text scales properly with zoom

---

### 🎯 PR #11: Multi-Selection System

**Objective**: Enable selecting and manipulating multiple objects simultaneously.

#### 11.1 Selection Methods

**Functional Requirements:**

1. **Shift-Click Selection**
   - Hold Shift to add/remove from selection
   - Visual feedback for multi-selected state
2. **Drag Rectangle Selection**
   - Click empty space and drag to create selection box
   - Select all objects fully or partially within box
   - Show semi-transparent blue selection rectangle
3. **Select All (Ctrl/Cmd+A)**
   - Select all objects on canvas
   - Show selection count indicator

**Technical Requirements:**

- Modify `canvasStore` to track Set of selected IDs
- Create `SelectionBox.tsx` for visual selection rectangle
- Implement intersection detection algorithm
- Update all object components to handle multi-select state

#### 11.2 Multi-Selection UI

**Visual Requirements:**

- Selected objects show blue outline
- Multi-selection shows bounding box around all
- Display selection count badge
- Transform handles on group bounding box

**State Management:**

```typescript
interface CanvasState {
  selectedObjectIds: Set<string>;
  selectionBounds: BoundingBox | null;
  isSelecting: boolean;
  selectionStart: Point | null;
}
```

#### 11.3 Group Operations

**Functional Requirements:**

- Move all selected objects together
- Delete all selected with single action
- Duplicate preserves relative positions
- Deselect all on Escape key

**Acceptance Criteria:**

- [ ] Shift-click toggles object selection
- [ ] Drag selection box works accurately
- [ ] Ctrl/Cmd+A selects all objects
- [ ] Group operations affect all selected items
- [ ] Visual feedback clear for multi-selection

---

### 🎯 PR #12: Complete Transform Operations

**Objective**: Add resize and rotation capabilities to all objects.

#### 12.1 Resize Functionality

**Functional Requirements:**

- 8 resize handles (corners + edges)
- Maintain aspect ratio with Shift key
- Minimum size: 10x10px
- Maximum size: canvas bounds
- Live preview during resize

**Technical Requirements:**

- Enhance Konva Transformer configuration
- Add resize logic to all shape types
- Handle circle radius vs. rectangle dimensions
- Sync size changes with throttling

#### 12.2 Rotation System

**Functional Requirements:**

- Rotation handle above object
- Show degree indicator while rotating
- Snap to 15° increments with Shift
- Support 360° rotation
- Rotation center at object center

**Technical Requirements:**

- Add rotation property to all objects
- Implement rotation handle UI
- Calculate rotation angles from mouse position
- Update rendering for rotated objects

#### 12.3 Transform Constraints

**Functional Requirements:**

- Prevent objects from leaving canvas
- Maintain minimum sizes
- Handle multi-select transforms
- Show transform values in tooltip

**UI Enhancement:**

```
While resizing: "200 x 150px"
While rotating: "45°"
```

**Acceptance Criteria:**

- [ ] All shapes can be resized
- [ ] Rotation works smoothly
- [ ] Shift constraints work (aspect ratio, angle snap)
- [ ] Multi-selected objects transform together
- [ ] Transform syncs in real-time

---

### 🎯 PR #13: Layer Management System

**Objective**: Implement z-index control and layer organization.

#### 13.1 Layer Order Control

**Functional Requirements:**

- Bring to front (Ctrl+Shift+])
- Send to back (Ctrl+Shift+[)
- Bring forward (Ctrl+])
- Send backward (Ctrl+[)
- Visual layer stack in UI

**Technical Requirements:**

- Add `zIndex` to all objects
- Implement layer sorting algorithm
- Update render order based on zIndex
- Handle z-index conflicts

#### 13.2 Layer Panel

**Functional Requirements:**

- Collapsible sidebar panel
- List all objects with thumbnails
- Drag to reorder layers
- Show/hide toggle per layer
- Lock/unlock toggle per layer
- Double-click to rename

**UI Structure:**

```
Layers
├─ [👁️] [🔒] Text: "Hello"
├─ [👁️] [🔓] Rectangle
├─ [👁️] [🔓] Circle
└─ [👁️] [🔓] Line
```

#### 13.3 Layer Properties

**Data Model Enhancement:**

```typescript
interface LayerProperties {
  visible: boolean;
  locked: boolean;
  opacity?: number; // 0-100
  name?: string; // Custom layer name
}
```

**Acceptance Criteria:**

- [ ] Layer ordering controls work
- [ ] Layer panel shows all objects
- [ ] Drag to reorder updates z-index
- [ ] Hide/show toggles object visibility
- [ ] Lock prevents object selection/edit

---

### 🎯 PR #14: Productivity Features

**Objective**: Add duplicate functionality and comprehensive keyboard shortcuts.

#### 14.1 Duplicate System

**Functional Requirements:**

- Duplicate selected objects (Ctrl/Cmd+D)
- Offset duplicates by 10px down-right
- Preserve all properties except ID
- Support multi-object duplication
- Maintain relative positions in group

**Technical Requirements:**

- Generate new UUIDs for duplicates
- Clone all object properties
- Update Firestore with new objects
- Select duplicated objects after creation

#### 14.2 Keyboard Shortcuts

**Complete Shortcut Map:**

```javascript
// Selection
'Escape': clearSelection
'Ctrl+A': selectAll
'Delete/Backspace': deleteSelected

// Tools
'V': selectTool
'H': panTool
'R': rectangleTool
'C': circleTool
'L': lineTool
'T': textTool

// Operations
'Ctrl+D': duplicate
'Ctrl+C': copy
'Ctrl+V': paste
'Ctrl+X': cut

// Layers
'Ctrl+]': bringForward
'Ctrl+[': sendBackward
'Ctrl+Shift+]': bringToFront
'Ctrl+Shift+[': sendToBack

// View
'Ctrl+0': resetZoom
'Ctrl++': zoomIn
'Ctrl+-': zoomOut
```

#### 14.3 Copy/Paste System

**Functional Requirements:**

- Copy objects to clipboard
- Paste at mouse position
- Support cross-session paste
- Handle multi-object copy/paste

**Technical Requirements:**

- Use browser clipboard API
- Store objects in JSON format
- Validate pasted data
- Generate new IDs on paste

**Acceptance Criteria:**

- [ ] Ctrl+D duplicates selection
- [ ] All shortcuts work as specified
- [ ] Copy/paste maintains properties
- [ ] Shortcuts don't conflict with browser
- [ ] Visual feedback for operations

---

## Testing Requirements

### Integration Test Coverage

Each PR must include tests verifying:

1. Feature functionality works correctly
2. Multi-user sync maintains <100ms latency
3. No regression in existing features
4. Performance with 50+ objects

### User Acceptance Testing

- Create 5 different shape types
- Select 10+ objects simultaneously
- Transform objects with all operations
- Manage 20+ layers
- Use all keyboard shortcuts

---

## Performance Requirements

- Shape creation: <50ms response time
- Transform operations: 60 FPS
- Multi-select with 20 objects: <100ms
- Layer reordering: <50ms
- Text editing: No input lag
- Support 100+ objects on canvas

---

## Risk Mitigation

### High Risk Items

1. **Text editing conflicts**: Implement operational transformation or lock during edit
2. **Performance with many objects**: Use virtualization for layer panel
3. **Complex transform math**: Use proven geometry libraries
4. **Z-index conflicts**: Implement deterministic ordering algorithm

### Fallback Options

- If text formatting complex: Start with plain text
- If layer panel slow: Begin with simple z-index buttons
- If rotation math issues: Use Konva's built-in rotation

---

## Implementation Timeline

### Week 1 (PRs 9-10)

- Day 1-2: Shape types implementation
- Day 3-4: Text system with formatting
- Day 5: Testing and bug fixes

### Week 2 (PRs 11-12)

- Day 6-7: Multi-selection system
- Day 8-9: Transform operations
- Day 10: Integration testing

### Week 3 (PRs 13-14)

- Day 11-12: Layer management
- Day 13: Productivity features
- Day 14-15: Final testing and polish

**Total Timeline: 15 development days**

---

## Success Metrics

### Grading Alignment (8 points total)

- ✅ Smooth pan/zoom (already implemented)
- ⬜ 3+ shape types (PR #9)
- ⬜ Text with formatting (PR #10)
- ⬜ Multi-select (PR #11)
- ⬜ Transform operations (PR #12)
- ⬜ Layer management (PR #13)
- ⬜ Duplicate/delete (PR #14)

### Quality Metrics

- Zero critical bugs
- <100ms sync latency maintained
- 60 FPS during all operations
- Works with 5+ concurrent users
- Supports 100+ objects
