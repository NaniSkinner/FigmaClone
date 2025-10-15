# PR #9: Extended Shape Types - Test Checklist

## Testing Date: October 15, 2025

## Status: ✅ Ready for Testing

---

## 🎯 Test Scenarios

### 1. Rectangle Tool

- [ ] Click rectangle tool button (▭) to activate
- [ ] Button shows green highlight when active
- [ ] Click and drag on white canvas to draw rectangle
- [ ] Rectangle preview shows while dragging (semi-transparent)
- [ ] Release mouse to create rectangle
- [ ] Rectangle appears with matcha green fill and purple stroke
- [ ] Minimum size enforced (10x10px)
- [ ] Can't draw outside canvas bounds
- [ ] Switch to select tool and resize rectangle
- [ ] Switch to delete tool and delete rectangle
- [ ] Create multiple rectangles

### 2. Circle Tool

- [ ] Click circle tool button (⭕) to activate
- [ ] Button shows green highlight when active
- [ ] Click and drag from center point to draw circle
- [ ] Circle preview shows while dragging (semi-transparent)
- [ ] Release mouse to create circle
- [ ] Circle appears with matcha green fill and purple stroke
- [ ] Maintains perfect circle shape
- [ ] Minimum radius enforced (5px)
- [ ] Can't draw outside canvas bounds
- [ ] Switch to select tool and resize circle
- [ ] Circle maintains aspect ratio when resizing
- [ ] Can drag circle around canvas
- [ ] Create multiple circles

### 3. Line Tool

- [ ] Click line tool button (📏) to activate
- [ ] Button shows green highlight when active
- [ ] Click and drag to draw line from start to end point
- [ ] Line preview shows while dragging (semi-transparent)
- [ ] Release mouse to create line
- [ ] Line appears with purple stroke, no fill
- [ ] Minimum length enforced (10px)
- [ ] Line ends are rounded (lineCap: round)
- [ ] Switch to select tool and move line
- [ ] Can resize line by dragging endpoints
- [ ] Create multiple lines at different angles

### 4. Text Tool

- [ ] Click text tool button (T) to activate
- [ ] Button shows green highlight when active
- [ ] Single click on canvas to place text
- [ ] Text object appears immediately with "Enter text" placeholder
- [ ] Text is auto-selected after creation
- [ ] Default font: Arial, 16px
- [ ] Text color is dark gray
- [ ] Can switch to select tool and move text
- [ ] Can resize text (font scales proportionally)
- [ ] Create multiple text objects
- [ ] Note: Editing text content comes in PR #10

### 5. Tool Switching

- [ ] Select tool is default on page load
- [ ] Clicking each tool button activates that tool
- [ ] Active tool button shows green highlight
- [ ] Only one tool active at a time
- [ ] Pan tool (🤚) still works for canvas navigation
- [ ] Delete tool (🗑️) still works to remove objects

### 6. Multi-Shape Canvas

- [ ] Create 2 rectangles, 2 circles, 2 lines, 2 text objects
- [ ] All shapes visible simultaneously
- [ ] Can select and move any shape
- [ ] Can resize any shape (select tool + transformer)
- [ ] Can delete any shape (delete tool)
- [ ] Shapes don't interfere with each other
- [ ] Pan/zoom works with all shapes

### 7. Real-Time Sync (Multi-User)

- [ ] Open canvas in two browser windows/tabs
- [ ] Log in as different users in each tab
- [ ] Create a rectangle in Tab 1 → appears instantly in Tab 2
- [ ] Create a circle in Tab 2 → appears instantly in Tab 1
- [ ] Create a line in Tab 1 → appears instantly in Tab 2
- [ ] Create text in Tab 2 → appears instantly in Tab 1
- [ ] Move shapes in Tab 1 → updates in Tab 2 < 100ms
- [ ] Resize shapes in Tab 2 → updates in Tab 1 < 100ms
- [ ] Delete shapes in Tab 1 → disappears from Tab 2
- [ ] All 4 shape types sync reliably

### 8. Canvas Boundaries

- [ ] Can't create shapes partially outside white canvas area
- [ ] Can't drag shapes outside canvas bounds
- [ ] Can't resize shapes beyond canvas edges
- [ ] All shapes respect 2000x2000 canvas limit
- [ ] Gray background area allows panning but not drawing

### 9. Performance

- [ ] Creating 10 rectangles feels responsive (<50ms each)
- [ ] Creating 10 circles feels responsive
- [ ] Creating 10 lines feels responsive
- [ ] Creating 10 text objects feels responsive
- [ ] Canvas with 40+ mixed shapes maintains 60 FPS
- [ ] Pan/zoom smooth with many objects
- [ ] No lag when switching between tools

### 10. UI/UX

- [ ] Tool buttons are clearly labeled with icons
- [ ] Tool tooltips show on hover
- [ ] Active tool visually obvious (green highlight)
- [ ] Shape previews help understand what will be created
- [ ] Controls responsive on mobile (if applicable)
- [ ] No console errors in browser DevTools
- [ ] No warning messages in browser console

---

## 🐛 Known Issues / Limitations

### Expected Behavior (Not Bugs):

1. **Text editing**: Cannot edit text content yet (PR #10)
2. **Rotation**: No rotation handles visible (PR #12)
3. **Multi-select**: Can only select one shape at a time (PR #11)
4. **Layers**: No z-index control yet (PR #13)

### Report Any Issues Here:

- [ ] Issue #1: ****\_\_\_****
- [ ] Issue #2: ****\_\_\_****
- [ ] Issue #3: ****\_\_\_****

---

## ✅ Test Sign-Off

- **Tester Name**: ****\_\_\_****
- **Test Date**: ****\_\_\_****
- **Browser(s) Tested**: Chrome **_ / Firefox _** / Safari \_\_\_
- **All Critical Tests Passed**: Yes / No
- **Ready for Next PR**: Yes / No

---

## 📸 Visual Verification

Take screenshots showing:

1. All 4 shape types on canvas simultaneously
2. Active tool button highlighted
3. Two browser tabs with synced shapes
4. Shape resizing in progress

---

## Next Steps

After all tests pass:

- ✅ Mark PR #9 as complete
- ⬜ Begin PR #10: Text Formatting System
