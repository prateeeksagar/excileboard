# Excileboard — Architecture Reference

## Tech Stack

| Layer | Library | Version | Role |
|---|---|---|---|
| UI Framework | React | 19 | Component rendering |
| Language | TypeScript | 6 | Type safety across the entire codebase |
| Canvas Engine | Fabric.js | 7 | 2D canvas rendering, hit-testing, selection handles |
| State Management | MobX | 6 | Observable models, reactive rendering pipeline |
| React–MobX Bridge | mobx-react-lite | 4 | `observer()` HOC for React components |
| Styling | Tailwind CSS | 4 | Utility-first styles |
| UI Components | shadcn/ui + Radix UI | — | Accessible primitives (popover, slider, etc.) |
| Icons | Lucide React + react-icons | — | Toolbar and control icons |
| Build Tool | Vite | 8 | Dev server + production build |
| ID Generation | nanoid | 5 | Unique element IDs |

---

## Folder Structure

```
src/
├── main.tsx                          # React root mount
├── App.tsx                           # Top-level router / layout
├── index.css                         # Global styles
│
├── store/
│   └── RootStore.ts                  # Singleton store — creates and holds all managers
│
├── components/
│   ├── icons.tsx                     # Shared icon wrappers
│   └── ui/                           # Generic shadcn/ui components
│       ├── button.tsx
│       ├── button-group.tsx
│       ├── dropdown-menu.tsx
│       ├── popover.tsx
│       ├── scroll-area.tsx
│       ├── separator.tsx
│       ├── slider.tsx
│       └── spinner.tsx
│
├── lib/
│   └── utils.ts                      # clsx/tailwind-merge helper
│
└── modules/
    └── excileboard/
        ├── ExcileBoard.tsx           # Root whiteboard page layout
        │
        ├── types/
        │   ├── element.ts            # ElementType union, strokStyleType
        │   ├── style.ts              # StrokeStyle type
        │   └── tools.ts              # ToolType union
        │
        ├── canvas/
        │   ├── components/
        │   │   ├── WhiteBoard.tsx    # <canvas> mount, calls canvasManager.init()
        │   │   └── ZoomControls.tsx  # +/- zoom buttons, percentage display
        │   └── managers/
        │       ├── CanvasManager.ts
        │       ├── CanvasZoomManager.ts
        │       ├── CanvasPanningManager.ts
        │       └── FabricSyncManager.ts
        │
        ├── elements/
        │   └── managers/
        │       ├── BaseElementManager.ts       # Abstract base — id, x, y, w, h, style
        │       ├── ElementManager.ts           # Map<id, element> — the element registry
        │       ├── ElementFactoryManager.ts    # Registry pattern — creates elements by type
        │       ├── RectangleElementManager.ts
        │       ├── CircleElementManager.ts
        │       ├── DiamondElementManager.ts
        │       ├── LineElementManager.ts
        │       ├── ArrowElementManager.ts
        │       ├── DrawElementManager.ts
        │       └── TextElementManager.ts
        │
        ├── tools/
        │   ├── components/
        │   │   ├── ToolBar.tsx                 # Tool picker (hand, shapes, text, pencil, eraser)
        │   │   ├── ErasorCursor.tsx            # SVG dashed-circle cursor data URL
        │   │   ├── StrokeSelector.tsx          # Color picker for stroke
        │   │   ├── BackgroundFillSelector.tsx  # Color picker for fill
        │   │   ├── StrokeStyleSelector.tsx     # Solid / dashed / dotted
        │   │   ├── StrokWidthSelector.tsx      # Stroke width slider
        │   │   ├── OpacitySelector.tsx         # Opacity slider
        │   │   ├── CornorRadiusSelector.tsx    # Corner radius slider (rect / diamond)
        │   │   ├── FontSizeSelector.tsx        # Font size (text elements)
        │   │   ├── FontFamilySelector.tsx      # Font family (text elements)
        │   │   └── TextAlignSelector.tsx       # Text alignment
        │   └── managers/
        │       ├── ToolManager.ts
        │       ├── StyleManager.ts
        │       └── EraserManager.ts
        │
        ├── selection/
        │   └── SelectionManager.tsx
        │
        └── ui/
            ├── ToolControls.tsx      # Right-side property panel (shown on selection)
            ├── ToolbarMenu.tsx       # Top menu bar
            └── ViewPortControls.tsx  # Zoom % display + zoom buttons
```

---

## Manager Tree

```
RootStore
├── CanvasManager          (canvas lifecycle + event routing)
│   ├── CanvasZoomManager  (zoom level, gesture/wheel)
│   ├── CanvasPanningManager (two-finger / mouse wheel pan)
│   └── FabricSyncManager  (MobX → Fabric rendering bridge)
├── ElementManager         (element registry — the source of truth)
│   └── [per-type element managers — all extend BaseElementManager]
│       ├── RectangleElementManager
│       ├── CircleElementManager
│       ├── DiamondElementManager
│       ├── LineElementManager
│       ├── ArrowElementManager
│       ├── DrawElementManager
│       └── TextElementManager
├── ToolManager            (active tool, drag-to-create lifecycle)
├── StyleManager           (current style defaults + apply to selection)
├── EraserManager          (hit-test erase + fade-out animation)
└── SelectionManager       (selected element IDs + style sync)
```

---

## Manager Reference

### `RootStore`
**File:** `src/store/RootStore.ts`

The singleton container. Instantiates every manager and passes `this` to each so they can communicate peer-to-peer via `this.root.someManager` without circular imports. There is no prop-drilling or React Context — all state is accessed through this one reference.

---

### `CanvasManager`
**File:** `src/modules/excileboard/canvas/managers/CanvasManager.ts`

Owns the `fabric.Canvas` instance.

- Calls `canvas.init(el)` when the `<canvas>` DOM element is mounted.
- Registers all canvas-level events: `mouse:down`, `mouse:move`, `mouse:up`, `mouse:wheel`, `text:changed`, `text:editing:exited`, `selection:created/updated/cleared`.
- Routes pointer events to `ToolManager.onPointerDown/Move/Up`.
- Reacts to `toolManager.activeTool` changes: toggles `isDrawingMode`, sets `defaultCursor`/`hoverCursor`, enables/disables `selectable`/`evented` on all objects, creates `PencilBrush` for the pencil tool.
- Holds sub-managers `CanvasZoomManager`, `CanvasPanningManager`, `FabricSyncManager`.

---

### `CanvasZoomManager`
**File:** `src/modules/excileboard/canvas/managers/CanvasZoomManager.ts`

Handles zoom level.

- `onWheelZoom(opt)` — called when `ctrlKey` is held during a wheel event (trackpad pinch or ctrl+scroll). Clamps zoom to a min/max range and zooms toward the pointer (`canvas.zoomToPoint`).
- `toPercentage()` — converts the Fabric zoom factor to a 0–100% display value.
- `zoomPercentage` — observable used by `ZoomControls` to display the current zoom level.
- `setZoom(value)` / `zoomIn()` / `zoomOut()` — programmatic zoom for the +/- buttons.

---

### `CanvasPanningManager`
**File:** `src/modules/excileboard/canvas/managers/CanvasPanningManager.ts`

Handles canvas panning.

- `onWheelPan(opt)` — called on plain wheel scroll (no `ctrlKey`). Applies `canvas.relativePan(new Point(-deltaX, -deltaY))` to scroll the viewport.

---

### `FabricSyncManager`
**File:** `src/modules/excileboard/canvas/managers/FabricSyncManager.ts`

The reactive bridge between MobX models and Fabric.js objects. This is the most complex manager.

**Responsibilities:**
- `start()` — sets up a top-level reaction on `elementManager.elements` that calls `sync()` whenever elements are added or removed.
- `sync()` — adds new Fabric objects for new elements, removes Fabric objects for deleted elements.
- `createFabricObject(el)` — creates the correct Fabric shape for each element type: `Rect`, `Ellipse`, `Path` (diamond), `Polyline` (line/arrow), `Path` (draw/pencil), `Textbox` (text).
- `watchElement(el, fabricObj)` — sets up **two separate MobX reactions** per element:
  - *Geometry reaction* — fires when `x/y/width/height` change → calls `applyToFabric` to reposition/resize the shape.
  - *Style reaction* — fires when `strokeColor/fillColor/strokeWidth/opacity/strokeStyle` change → calls `applyStyle` which only sets visual properties, never geometry (prevents drift).
- `applyToFabric(el, obj)` — shape-aware full sync: rebuilds Polygon points, Ellipse rx/ry, diamond Path via `_setPath`, Textbox text/width.
- `applyStyle(el, obj)` — sets only `stroke/fill/strokeWidth/opacity/strokeDashArray`. For diamonds, rebuilds the Path data via `_setPath`.
- `handleObjectModified` — writes Fabric drag/resize edits back into the element model (bakes `scaleX/scaleY` into `width/height`).
- `handlePathCreated` — captures a completed pencil stroke as a `DrawElementManager` model.
- `handleTextChanged` — auto-grows a `Textbox` width while `autoWidth` is true (Excalidraw-style single-line growth). Uses a sentinel `"|"` character to correctly measure trailing spaces.
- `watchTextElement` — fires `textbox.enterEditing()` when `el.isEditing` becomes true; listens for `editing:exited` to commit the text back to the model and remove empty elements.
- `watchArrowElement` — reacts to arrow endpoints AND bound element geometry so the arrow redraws when a connected shape moves.
- `resolveArrowEndpoints` / `edgePoint` — snaps arrow endpoints to the bounding-box border of bound elements.
- `elementIdAt(x, y)` — hit-tests the canvas to find a bindable element at a scene point (used by the arrow tool for binding).

---

### `ElementManager`
**File:** `src/modules/excileboard/elements/managers/ElementManager.ts`

The element registry — the single source of truth for all canvas elements.

- Stores elements in a `Map<string, BaseElementManager>` (insertion order = z-order).
- `add(el)` / `remove(el)` / `removeById(id)` / `get(id)` — CRUD operations.
- `all` computed getter returns all elements as an array.
- MobX makes the map observable so `FabricSyncManager` can react to insertions and deletions.

---

### `BaseElementManager`
**File:** `src/modules/excileboard/elements/managers/BaseElementManager.ts`

Abstract base class for all element types. Every element has:

- `id` — unique nanoid string.
- `x, y, width, height, angle` — geometry (all MobX observable).
- `strokeColor, fillColor, strokeWidth, strokeStyle, opacity, cornorRadius, fontFamily, fontSize, textAlign` — style (all observable).
- `update(props)` — generic partial update via `Object.assign`.
- `move(dx, dy)` — translates the element.
- Uses `makeObservable` (not `makeAutoObservable`) because MobX forbids `makeAutoObservable` on subclassed classes.

---

### Element Subclasses

Each extends `BaseElementManager` and adds type-specific observable fields:

| Class | Type string | Extra fields |
|---|---|---|
| `RectangleElementManager` | `"rectangle"` | `cornorRadius` (inherited, used for `rx/ry`) |
| `CircleElementManager` | `"circle"` | — |
| `DiamondElementManager` | `"diamond"` | `cornorRadius` (controls rounded tips via SVG Path) |
| `LineElementManager` | `"line"` | — |
| `ArrowElementManager` | `"arrow"` | `x1, y1, x2, y2`, `startBindingId`, `endBindingId` |
| `DrawElementManager` | `"draw"` | `pathData` (Fabric path command array from PencilBrush) |
| `TextElementManager` | `"text"` | `text`, `fontSize`, `fontFamily`, `isEditing`, `autoWidth` |

---

### `ElementFactoryManager`
**File:** `src/modules/excileboard/elements/managers/ElementFactoryManager.ts`

Registry pattern for element creation.

- `REGISTRY` maps each `ElementType` string to its constructor.
- `create(type, x, y, w, h, style)` — instantiates the correct subclass without any `switch` in the caller.

---

### `ToolManager`
**File:** `src/modules/excileboard/tools/managers/ToolManager.ts`

Manages the active drawing tool and the drag-to-create lifecycle.

- `activeTool` — observable. Changing it triggers the `CanvasManager` reaction that reconfigures the canvas cursor and selection mode.
- `setActiveTool(tool)` — sets the active tool. Reverts to `"hand"` automatically after placing a shape.
- `onPointerDown(x, y)` — starts a drag: creates a draft element via `ElementFactoryManager`, adds it to `ElementManager`. Special cases for `"eraser"` (delegates to `EraserManager`), `"text"` (immediately enters editing), `"arrow"` (binds start to element under cursor).
- `onPointerMove(x, y)` — updates the draft's `width/height` as the user drags. For arrows, updates `x2/y2`.
- `onPointerUp()` — commits the draft. Discards zero-size accidental clicks. For arrows, binds the end to any element under the tip.

---

### `StyleManager`
**File:** `src/modules/excileboard/tools/managers/StyleManager.ts`

Holds the current style defaults and applies them to selected elements.

- Observable fields: `strokeColor, fillColor, strokeWidth, strokeStyle, opacity, fontSize, fontFamily, cornorRadius`.
- `applyFromElement(el)` — when an element is selected, syncs the panel's values to match that element.
- `setStrokeColor(c)` / `setFillColor(c)` / `setStrokeWidth(w)` / `setStrokStyle(s)` / `setCornorRadius(r)` — update the observable and push the change to all selected elements via `updateSelected`.
- `updateSelected(updates)` — iterates `selectionManager.selectedIds`, calls `el.update(updates)` on each. `FabricSyncManager`'s style reaction picks up the change and re-renders without touching geometry.
- `currentDefaults` getter — returns a style object used by `ToolManager` when creating new elements.

---

### `EraserManager`
**File:** `src/modules/excileboard/tools/managers/EraserManager.ts`

Handles eraser tool logic.

- `startErasing()` / `stopErasing()` — set `isErasing` flag, cleared by `ToolManager.onPointerUp`.
- `eraseAtPoint(x, y)` — hit-tests the top-most canvas object at the scene point. Skips objects already fading out (`erasedIds` set).
- `animateErase(obj, id)` — runs a 180ms opacity fade-out via `obj.animate({ opacity: 0 }, ...)`, then calls `elementManager.removeById(id)`. The model removal triggers `FabricSyncManager.sync()` which removes the Fabric object and disposes its per-element reactions.

---

### `SelectionManager`
**File:** `src/modules/excileboard/selection/SelectionManager.tsx`

Tracks which elements are currently selected.

- `selectedIds` — observable `Set<string>`.
- `setSelectedIds(ids[])` — replaces the selection and calls `styleManager.applyFromElement(el)` on the first selected element to sync the property panel.
- `clearSelection()` — empties the set.
- `selectedElements` computed — resolves IDs to element models.
- `hasSelection` computed — `true` when anything is selected (used to conditionally show the property panel).
- Fed by `FabricSyncManager.handleSelectionCreated/Cleared` which maps Fabric's selection events to element IDs.

---

## Data Flow

```
User interaction (mouse / keyboard)
         │
         ▼
  CanvasManager  ──────────────────────────────────────────────────────┐
  (Fabric events)                                                       │
         │                                                             │
         ├─► ToolManager.onPointerDown/Move/Up                        │
         │       │                                                     │
         │       ├─► ElementFactoryManager.create()                   │
         │       │       └─► ElementManager.add(el)   ◄──────────┐   │
         │       │                                                │   │
         │       └─► EraserManager.eraseAtPoint()                 │   │
         │               └─► ElementManager.removeById()          │   │
         │                                                         │   │
         └─► FabricSyncManager (reacts to ElementManager)         │   │
                 │                                                 │   │
                 ├─► sync()  ── creates / removes Fabric objects  │   │
                 ├─► watchElement()  per-element reactions         │   │
                 │       ├─► geometry reaction → applyToFabric()  │   │
                 │       └─► style reaction    → applyStyle()     │   │
                 │                                                 │   │
                 └─► handleObjectModified  ───────────────────────┘   │
                     (writes Fabric edits back into model)             │
                                                                       │
  StyleManager  ◄──────────────────────────────────────────────────────┘
  (selection:created → applyFromElement → UI property panel)
```

**Rule:** Element models are the single source of truth. `FabricSyncManager` only reads models to render — it never holds rendering state. The only writes back to models are from `handleObjectModified`, `handlePathCreated`, and `handleTextChanged` (Fabric → model sync after user interaction).
