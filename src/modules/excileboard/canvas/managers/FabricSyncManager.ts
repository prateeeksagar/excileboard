import type { RootStore } from "@/store/RootStore";
import {
  Ellipse,
  FabricObject,
  Rect,
  Polyline,
  Path,
  Textbox,
  FabricText,
  Point,
} from "fabric";
import { makeAutoObservable, reaction, type IReactionDisposer } from "mobx";
import type { BaseElementManager } from "../../elements/managers/BaseElementManager";
import { DrawElementManager } from "../../elements/managers/DrawElementManager";
import type { TextElementManager } from "../../elements/managers/TextElementManager";
import type { ArrowElementManager } from "../../elements/managers/ArrowElementManager";
import { InteractiveFabricObject } from "fabric";
import type { RectangleElementManager } from "../../elements/managers/RectangleElementManager";
import type { DiamonElementManager } from "../../elements/managers/DiamondElementManager";

export class FabricSyncManager {
  private disposeReaction: IReactionDisposer | null = null;
  private fabricMap = new Map<string, FabricObject>();
  private elementDisposers = new Map<string, () => void>(); // reaction disposer (or composite of several)
  root: RootStore;

  constructor(root: RootStore) {
    this.root = root;
    makeAutoObservable(this);
  }

  start() {
    this.applyGlobalFabricDefaults();

    //react to element list changes
    this.disposeReaction = reaction(
      () =>
        Array.from(this.root.elementManager.elements.values()).map(
          (el) => el.id,
        ),
      () => this.sync(),
      { fireImmediately: true },
    );

    // this.applyGlobalFabricDefaults();

    // write Fabric edits (move/resize/rotate) back into the element models,
    // otherwise the model goes stale and the next sync snaps the shape back.
    this.root.canvasManager.canvas?.on(
      "object:modified",
      this.handleObjectModified,
    );
    this.root.canvasManager.canvas?.on("path:created", this.handlePathCreated);
    this.root.canvasManager.canvas?.on("text:changed", this.handleTextChanged);
    // auto-grow a text box's wi dth to fit content while typing (Excalidraw-style)

    // Sync Fabric selection → SelectionManager
    this.root.canvasManager.canvas?.on(
      "selection:created",
      this.handleSelectionCreated,
    );
    this.root.canvasManager.canvas?.on(
      "selection:updated",
      this.handleSelectionCreated,
    ); // same handler
    this.root.canvasManager.canvas?.on(
      "selection:cleared",
      this.handleSelectionCleared,
    );
  }

  private handleSelectionCreated = (opt: { selected?: FabricObject[] }) => {
    const selected = opt.selected ?? [];

    // Get ids from selected Fabric objects
    const ids = selected
      .map((obj) => (obj as FabricObject & { elementId?: string }).elementId)
      .filter(Boolean) as string[];

    // ✅ Sync to SelectionManager
    this.root.selectionManager.setSelectedIds(ids);
  };

  private handleSelectionCleared = () => {
    // ✅ Clear selection
    this.root.selectionManager.clearSelection();
  };

  private handleObjectModified = (opt: { target?: FabricObject }) => {
    console.log("handle object modified");
    const obj = opt.target;
    if (!obj) return;
    const id = (obj as FabricObject & { elementId?: string }).elementId;
    if (!id) return;
    const el = this.root.elementManager.get(id);
    if (!el) return;

    // Text: a manual resize fixes the width → switch off auto-grow so it now wraps.
    if (el.type === "text") {
      const w = (obj.width ?? 0) * (obj.scaleX ?? 1);
      (el as TextElementManager).setManualWidth(w);
      obj.set({ width: w });
      obj.setCoords();
      el.update({
        x: obj.left ?? el.x,
        y: obj.top ?? el.y,
        angle: obj.angle ?? el.angle,
      } as Partial<BaseElementManager>);
      return;
    }

    // Fabric resizes via scaleX/scaleY — bake it into width/height and reset scale
    // so width/height stay canonical and watchElement doesn't double-apply the scale.
    const width = (obj.width ?? 0) * (obj.scaleX ?? 1);
    const height = (obj.height ?? 0) * (obj.scaleY ?? 1);
    obj.set({ width, height, scaleX: 1, scaleY: 1 });
    obj.setCoords();

    el.update({
      x: obj.left ?? el.x,
      y: obj.top ?? el.y,
      width,
      height,
      angle: obj.angle ?? el.angle,
    } as Partial<BaseElementManager>);
  };

  private handleTextChanged = (opt: { target?: FabricObject }) => {
    const obj = opt.target as Textbox | undefined;
    const id = (obj as (FabricObject & { elementId?: string }) | undefined)
      ?.elementId;
    const el = id ? this.root.elementManager.get(id) : undefined;
    if (!obj || !el || el.type !== "text") return;

    const t = el as TextElementManager;

    if (!t.autoWidth) return; // user manually resized → wrap instead of grow
    console.log("after autowidth");
    // ✅ Measure natural width including trailing spaces
    const natural = this.naturalTextWidth(
      obj.text ?? "",
      obj.fontSize ?? t.fontSize,
      obj.fontFamily ?? t.fontFamily,
    );

    const newWidth = Math.max(natural, 20); // never collapse to 0

    obj.set({ width: newWidth });
    // obj.setCoords();
    t.width = newWidth; // keep model in sync

    this.root.canvasManager.canvas?.requestRenderAll();
  };

  // Natural single-line width of the text (max line width for explicit \n), via a throwaway probe.
  // A sentinel "|" is appended so TRAILING spaces are measured (FabricText drops trailing
  // whitespace otherwise), then its own width is subtracted back out.
  private naturalTextWidth(
    text: string,
    fontSize: number,
    fontFamily: string,
  ): number {
    // ✅ Append sentinel BEFORE measuring so trailing spaces are included
    const probe = new FabricText((text || " ") + "|", { fontSize, fontFamily });
    const sentinel = new FabricText("|", { fontSize, fontFamily });

    // Extra 8px padding so caret never sits at the edge
    return Math.ceil(probe.width - sentinel.width) + 8;
  }

  private handlePathCreated = (opt: { path?: FabricObject }) => {
    const path = opt.path as Path | undefined;
    const canvas = this.root.canvasManager.canvas;
    if (!path || !canvas) return;

    canvas.remove(path); // sync will recreate it from the model

    const el = new DrawElementManager(
      path.left ?? 0,
      path.top ?? 0,
      path.width ?? 0,
      path.height ?? 0,
      {
        strokeColor: (path.stroke as string) ?? "#000000",
        strokeWidth: path.strokeWidth ?? 2,
      },
    );
    el.pathData = path.path as unknown[]; // the captured commands (absolute coords)
    this.root.elementManager.add(el);
  };

  private sync() {
    const canvas = this.root.canvasManager.canvas;
    if (!canvas) return;

    const elements = Array.from(this.root.elementManager.elements.values()); // ← fix

    const currentIds = new Set(elements.map((e) => e.id));

    // Remove deleted elements
    this.fabricMap.forEach((fabricObj, id) => {
      if (!currentIds.has(id)) {
        canvas.remove(fabricObj);
        this.fabricMap.delete(id);
        this.elementDisposers.get(id)?.(); // ← stop the per-element reaction
        this.elementDisposers.delete(id);
      }
    });

    // Add new elements
    elements.forEach((el) => {
      // ← fix
      if (!this.fabricMap.has(el.id)) {
        const fabricObj = this.createFabricObject(el);
        if (!fabricObj) return;
        // tag so object:modified can map the fabric object back to its model
        (fabricObj as FabricObject & { elementId?: string }).elementId = el.id;
        this.fabricMap.set(el.id, fabricObj);
        canvas.add(fabricObj);
        this.watchElement(el, fabricObj);
      }
    });
    canvas.renderAll();
  }

  private watchElement(el: BaseElementManager, fabricObj: FabricObject) {
    if (el.type == "text") {
      const textEl = el as TextElementManager;
      this.watchTextElement(textEl, fabricObj);
      return;
    }

    if (el.type === "arrow") {
      this.watchArrowElement(el as ArrowElementManager, fabricObj);
      return;
    }

    // Geometry: re-position / re-size only when x/y/width/height change.
    const dGeom = reaction(
      () => ({ x: el.x, y: el.y, width: el.width, height: el.height }),
      () => {
        this.applyToFabric(el, fabricObj);
        this.root.canvasManager.canvas?.requestRenderAll();
      },
    );

    // Style: stroke/fill/opacity only — must NOT touch geometry, or the object drifts
    // (re-running left/top + setCoords/setDimensions nudges it) on a pure color change.
    const dStyle = reaction(
      () => ({
        strokeColor: el.strokeColor,
        fillColor: el.fillColor,
        strokeWidth: el.strokeWidth,
        opacity: el.opacity,
        strokeStyle: el.strokeStyle,
        cornorRadius: (el.type == "rectangle" || el.type == "diamond") ? (el as RectangleElementManager | DiamonElementManager).cornorRadius : undefined
      }),
      () => {
        this.applyStyle(el, fabricObj);
        this.root.canvasManager.canvas?.requestRenderAll();
      },
    );

    this.elementDisposers.set(el.id, () => {
      dGeom();
      dStyle();
    });
  }

  // Apply only visual style (no geometry) so style changes never move the object.
  private applyStyle(el: BaseElementManager, obj: FabricObject) {
    obj.set({
      stroke: el.strokeColor,
      // open shapes (pencil/arrow) must stay unfilled
      fill: el.type === "draw" || el.type === "arrow" ? "" : el.fillColor,
      strokeWidth: el.strokeWidth,
      opacity: el.opacity,
      ...this.getStrokeDashArray(el),
      ...this.getCornorRadius(el as RectangleElementManager)
    });

    // Diamond uses a Path — corner radius means rebuilding the path data, not rx/ry.
    if (el.type === "diamond") {
      const d = el as DiamonElementManager;
      (obj as any)._setPath(this.buildDiamondPath(el.width, el.height, d.cornorRadius), false);
    }
  }

  private getStrokeDashArray(el: BaseElementManager): object {
    if (!this.canHaveStrokeDashArray(el)) return {};

    console.log(el.strokeStyle);
    switch (el.strokeStyle) {
      case "dashed":
        return { strokeDashArray: [8, 4] };
      case "dotted":
        return { strokeDashArray: [2, 4] };
      case "solid":
      default:
        return { strokeDashArray: [] }; // ✅ empty = solid
    }
  }

  private getCornorRadius(el: RectangleElementManager) {
    if(el.type == "rectangle") {
      return {
        rx: (el.cornorRadius) ?? 0,
        ry: (el.cornorRadius) ?? 0
      }
    }
    return {}
  }

  private canHaveStrokeDashArray(el: BaseElementManager): boolean {
    if (el.type == "text") return false;
    return true;
  }

  private watchTextElement(el: TextElementManager, fabricObj: FabricObject) {
    const canvas = this.root.canvasManager.canvas;
    const textbox = fabricObj as Textbox;

    // ✅ Reaction 1 — style changes (fontSize, fontFamily, etc.)
    const styleDisposer = reaction(
        () => ({
            fontSize:    el.fontSize,
            fontFamily:  el.fontFamily,
            strokeColor: el.strokeColor,
            opacity:     el.opacity,
            textAlign: el.textAlign
        }),
        () => {
            this.applyToFabric(el, fabricObj);
            canvas?.requestRenderAll();
        }
    );

    // ✅ Reaction 2 — editing state only
    const editingDisposer = reaction(
        () => el.isEditing,
        (isEditing) => {
            if (!isEditing) return;

            textbox.set({ selectable: true, evented: true });
            canvas?.setActiveObject(textbox);

            setTimeout(() => {
                textbox.enterEditing();
                textbox.selectAll();
                canvas?.requestRenderAll();
            }, 0);

            textbox.once("editing:exited", () => {
                el.exitTextEditing(textbox.text ?? "");
                if (el.isEmpty) {
                    this.root.elementManager.removeById(el.id);
                }
                this.root.toolManager.setActiveTool("hand");
                canvas?.requestRenderAll();
            });
        },
        { fireImmediately: true }
    );

    // ✅ Combine both disposers
    this.elementDisposers.set(el.id, () => {
        styleDisposer();
        editingDisposer();
    });
}

  // Re-render the arrow whenever its own endpoints OR any bound element's geometry changes.
  // MobX tracks every observable read in the data fn, so reading the bound elements' x/y/w/h
  // makes the arrow follow them when they move/resize.
  private watchArrowElement(el: ArrowElementManager, fabricObj: FabricObject) {
  // Geometry + binding reaction
  const geometryDisposer = reaction(
    () => ({
      x1: el.x1,
      y1: el.y1,
      x2: el.x2,
      y2: el.y2,
      sId: el.startBindingId,
      eId: el.endBindingId,
      sx: el.startBindingId ? this.root.elementManager.get(el.startBindingId)?.x : null,
      sy: el.startBindingId ? this.root.elementManager.get(el.startBindingId)?.y : null,
      sw: el.startBindingId ? this.root.elementManager.get(el.startBindingId)?.width : null,
      sh: el.startBindingId ? this.root.elementManager.get(el.startBindingId)?.height : null,
      ex: el.endBindingId ? this.root.elementManager.get(el.endBindingId)?.x : null,
      ey: el.endBindingId ? this.root.elementManager.get(el.endBindingId)?.y : null,
      ew: el.endBindingId ? this.root.elementManager.get(el.endBindingId)?.width : null,
      eh: el.endBindingId ? this.root.elementManager.get(el.endBindingId)?.height : null,
    }),
    () => {
      this.applyToFabric(el, fabricObj);
      this.root.canvasManager.canvas?.requestRenderAll();
    }
  );

  // Style reaction
  const styleDisposer = reaction(
    () => ({
      stroke: el.strokeColor,
      strokeWidth: el.strokeWidth,
      opacity: el.opacity,
      ...this.getStrokeDashArray(el),
    }),
    () => {
      this.applyToFabric(el, fabricObj);
      this.root.canvasManager.canvas?.requestRenderAll();
    }
  );

  // Store both disposers
  this.elementDisposers.set(el.id, () => {
    geometryDisposer();
    styleDisposer();
  });
}

  private createFabricObject(el: BaseElementManager): FabricObject | null {
    // Interactive only when not in a drawing tool; the tool reaction in
    // CanvasManager re-toggles this for all objects whenever the tool changes.
    const common = this.commonFabricCreateOptions(el);

    let obj: FabricObject;
    switch (el.type) {
      case "rectangle":
        obj = new Rect(common);
        break;
      case "circle":
        obj = new Ellipse(common);
        break;
      case "diamond":
        const d = el as DiamonElementManager;
        obj = new Path(this.buildDiamondPath(el.width, el.height, d.cornorRadius), common);
        break;
      case "line":
        obj = new Polyline(this.linePoints(el.width, el.height), common);
        break;
      case "arrow":
        obj = new Polyline(
          this.arrowPoints(
            ...this.resolveArrowEndpoints(el as ArrowElementManager),
          ),
          { ...common, fill: "" },
        );
        break;
      case "draw":
        obj = new Path((el as DrawElementManager).pathData as any, common);
        break;
      case "text":
        obj = new Textbox((el as TextElementManager).text, common);
        break;
      default:
        return null;
    }

    this.applyToFabric(el, obj);
    return obj;
  }

  private commonFabricCreateOptions(el: BaseElementManager) {
    // Interactive only when not in a drawing tool; the tool reaction in
    // CanvasManager re-toggles this for all objects whenever the tool changes.
    const interactive = this.root.toolManager.activeTool == "hand";

    let common = {
      selectable: interactive,
      evented: interactive,
      ...this.getStrokeDashArray(el),
    };

    if (el.type == "text") {
      // originX/Y "left"/"top": Fabric's default origin is CENTER, which makes an
      // auto-growing box expand symmetrically (text drifts left while typing). Anchoring
      // to the top-left keeps el.x/el.y as the corner so growth goes rightward only.
      // splitByGrapheme:false → wrap at spaces (word wrap); lockScalingY → resize controls width, not font
      common = { ...common, ...this.commonFabricTextCreateOptions(el) };
    }
    if (el.type == "arrow") {
      common = {
        ...common,
        ...this.commonFabricArrowCreateOptions(el),
      };
    }

    if(el.type == "rectangle" || el.type == "diamond") {
      common = {
        ...common,
        ...this.commonFabricRectAndDiamondOptions(el as RectangleElementManager | DiamonElementManager)
      };
    }

    return common;
  }

  private commonFabricRectAndDiamondOptions(el: RectangleElementManager | DiamonElementManager) {
    return {
      rx: (el.cornorRadius) ?? 0,
      ry: (el.cornorRadius) ?? 0
    }
  }

  private commonFabricTextCreateOptions(el: BaseElementManager) {
    return {
      originX: "left",
      originY: "top",
      splitByGrapheme: false,
      breakWords: false,
      lockScalingY: true,
      width: 20,
      minWidth: 10,
      fontSize: el.fontSize,
      FontFamily: el.fontFamily,
      textAlign: el.textAlign
    };
  }

  private commonFabricArrowCreateOptions(el: BaseElementManager) {
    return {
      hasBorders: false,
      strokeWidth: Math.max(el.strokeWidth, 4),
      strokeLineCap: "round",
      strokeLineJoin: "round",
      perPixelTargetFind: true,
    };
  }

  beginEdit(id: string) {
    const obj = this.fabricMap.get(id);
    const canvas = this.root.canvasManager.canvas;
    if (!(obj instanceof Textbox) || !canvas) return;
    canvas.setActiveObject(obj);
    obj.enterEditing();
    obj.selectAll();
    canvas.requestRenderAll();
  }

  // private diamondPoints(width: number, height: number) {
  //   return [
  //     { x: width / 2, y: 0 },
  //     { x: width, y: height / 2 },
  //     { x: width / 2, y: height },
  //     { x: 0, y: height / 2 },
  //   ];
  // }

  // utils/diamondPath.ts (or inside FabricSyncManager)

private buildDiamondPath(width: number, height: number, radius: number = 0): string {
    const points = [
        { x: width / 2, y: 0 },          // top
        { x: width,     y: height / 2 }, // right
        { x: width / 2, y: height },     // bottom
        { x: 0,         y: height / 2 }, // left
    ];

    if (radius <= 0) {
        // Sharp — straight lines between points
        return `M ${points[0].x} ${points[0].y} ` +
               `L ${points[1].x} ${points[1].y} ` +
               `L ${points[2].x} ${points[2].y} ` +
               `L ${points[3].x} ${points[3].y} Z`;
    }

    const maxRadius = Math.min(width, height) / 4;
    const r = Math.min(radius, maxRadius);

    // For each point, get offset points toward prev and next corner
    const path: string[] = [];
    const n = points.length;

    for (let i = 0; i < n; i++) {
        const curr = points[i];
        const prev = points[(i - 1 + n) % n];
        const next = points[(i + 1) % n];

        const fromPrev = this.offsetTowards(curr, prev, r);
        const toNext   = this.offsetTowards(curr, next, r);

        if (i === 0) {
            path.push(`M ${fromPrev.x} ${fromPrev.y}`);
        } else {
            path.push(`L ${fromPrev.x} ${fromPrev.y}`);
        }
        path.push(`Q ${curr.x} ${curr.y} ${toNext.x} ${toNext.y}`);
    }

    path.push("Z");
    return path.join(" ");
}

private offsetTowards(
    from: { x: number; y: number },
    to:   { x: number; y: number },
    distance: number
) {
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    const len = Math.sqrt(dx * dx + dy * dy);
    const ratio = distance / len;
    return { x: from.x + dx * ratio, y: from.y + dy * ratio };
}

  private linePoints(
    width: number,
    height: number,
  ): { x: number; y: number }[] {
    return [
      { x: 0, y: 0 },
      { x: width, y: height },
    ];
  }

  // A single open polyline that draws the shaft plus two arrowhead barbs:
  // start → tip → barbL → tip → barbR. Points are in ABSOLUTE scene coordinates.
  private arrowPoints(
    x1: number,
    y1: number,
    x2: number,
    y2: number,
  ): { x: number; y: number }[] {
    const angle = Math.atan2(y2 - y1, x2 - x1);
    const head = 14; // barb length
    const spread = Math.PI / 7; // barb angle from the shaft
    const bx1 = x2 - head * Math.cos(angle - spread);
    const by1 = y2 - head * Math.sin(angle - spread);
    const bx2 = x2 - head * Math.cos(angle + spread);
    const by2 = y2 - head * Math.sin(angle + spread);
    return [
      { x: x1, y: y1 },
      { x: x2, y: y2 }, // shaft
      { x: bx1, y: by1 },
      { x: x2, y: y2 }, // tip → barb L → back to tip
      { x: bx2, y: by2 }, // tip → barb R
    ];
  }

  // Resolve an arrow's drawn endpoints, snapping any bound end to the bound element's edge.
  // Uses the live fabric object's geometry (origin-independent) rather than the model's x/y.
  private resolveArrowEndpoints(
    a: ArrowElementManager,
  ): [number, number, number, number] {
    let { x1, y1, x2, y2 } = a;
    const startObj = a.startBindingId
      ? this.fabricMap.get(a.startBindingId)
      : undefined;
    const endObj = a.endBindingId
      ? this.fabricMap.get(a.endBindingId)
      : undefined;
    // each end points toward the OTHER end's current position
    if (startObj) [x1, y1] = this.edgePoint(startObj, x2, y2);
    if (endObj) [x2, y2] = this.edgePoint(endObj, x1, y1);
    return [x1, y1, x2, y2];
  }

  // Point on a fabric object's bounding-box border, along the ray from its center toward (tx,ty).
  private edgePoint(
    obj: FabricObject,
    tx: number,
    ty: number,
  ): [number, number] {
    const c = obj.getCenterPoint(); // absolute (scene) center
    const hw = obj.getScaledWidth() / 2;
    const hh = obj.getScaledHeight() / 2;
    const dx = tx - c.x;
    const dy = ty - c.y;
    if ((dx === 0 && dy === 0) || hw === 0 || hh === 0) return [c.x, c.y];
    const t = Math.min(hw / Math.abs(dx), hh / Math.abs(dy)); // ray→box intersection
    return [c.x + dx * t, c.y + dy * t];
  }

  // Top-most element id under a scene point. Skips arrows (don't bind arrows to arrows)
  // and an optional excluded id (the arrow being drawn). Used by the arrow tool for binding.
  elementIdAt(x: number, y: number, excludeId?: string): string | null {
    const canvas = this.root.canvasManager.canvas;
    if (!canvas) return null;
    const point = new Point(x, y);
    const objects = canvas.getObjects();
    for (let i = objects.length - 1; i >= 0; i--) {
      const obj = objects[i];
      const id = (obj as FabricObject & { elementId?: string }).elementId;
      if (!id || id === excludeId) continue;
      const target = this.root.elementManager.get(id);
      if (!target || target.type === "arrow") continue;
      if (obj.containsPoint(point)) return id;
    }
    return null;
  }

  // Single source of truth for pushing an element model onto its fabric object.
  // Geometry is shape-aware: Polygon rebuilds points, Ellipse uses rx/ry, Rect uses width/height.
  private applyToFabric(el: BaseElementManager, obj: FabricObject) {
    obj.set({
      stroke: el.strokeColor,
      fill: el.fillColor,
      strokeWidth: el.strokeWidth,
      opacity: el.opacity,
      ...this.getStrokeDashArray(el),
      ...this.getCornorRadius(el as RectangleElementManager)
    }); 

    // Text: auto-sized, colored via `fill` (fillColor is transparent → use strokeColor).
    if (el.type === "text") {
      const t = el as TextElementManager;
      obj.set({
        text: t.text,
        fontSize: t.fontSize,
        fontFamily: t.fontFamily,
        fill: el.strokeColor || "#000000", // glyph color
        left: el.x,
        top: el.y,
        strokeWidth: 0, // default for text
        // auto-grow → fit content; fixed (after manual resize) → wrap to el.width
        ...(t.autoWidth ? {} : { width: el.width }),
        textAlign: el.textAlign
      });
      obj.setCoords();
      return;
    }

    // Arrow: absolute-coordinate polyline (shaft + head), endpoints resolved against bindings.
    if (el.type === "arrow") {
      const [x1, y1, x2, y2] = this.resolveArrowEndpoints(
        el as ArrowElementManager,
      );
      obj.set({
        points: this.arrowPoints(x1, y1, x2, y2),
        stroke: el.strokeColor,
        strokeWidth: el.strokeWidth,
        fill: "",
      });
      (obj as Polyline).setBoundingBox(true); // re-anchor to the absolute points
      obj.setCoords();
      return;
    }

    if (obj instanceof Polyline) {
      // covers Polyline (line) AND Polygon (diamond)
      const points = this.linePoints(el.width, el.height)
      obj.set({ points });
      obj.setDimensions(); // recompute bbox/pathOffset from the new points
    } else if (obj instanceof Ellipse) {
      obj.set({ rx: el.width / 2, ry: el.height / 2 });
    } else if(el.type == "diamond") {
    const d = el as DiamonElementManager;
    const pathData = this.buildDiamondPath(el.width, el.height, d.cornorRadius);
    (obj as any)._setPath(pathData, false); // parse path string + recalc bounds, no position adjust
    obj.set({ left: el.x, top: el.y });
    obj.setCoords();
    return;
    }
    else {
      obj.set({ width: el.width, height: el.height });
    }

    // handles drawing
    if (el.type === "draw") {
      obj.set({
        stroke: el.strokeColor,
        strokeWidth: el.strokeWidth,
        opacity: el.opacity,
        fill: "",
      });
      obj.setCoords();
      return;
    }

    obj.set({ left: el.x, top: el.y }); // position last (Polygon dims recalc can shift origin)
    obj.setCoords();
  }

  stop() {
    this.disposeReaction?.();
    this.disposeReaction = null;
    // tear down per-element watchers + fabric objects too (see below)
    this.elementDisposers.forEach((d) => d());
    this.elementDisposers.clear();
    this.root.canvasManager.canvas?.off(
      "object:modified",
      this.handleObjectModified,
    );
    this.root.canvasManager.canvas?.off("path:created", this.handlePathCreated);
    // this.root.canvasManager.canvas?.off("text:changed", this.handleTextChanged);
    this.fabricMap.clear();
  }
  /*
    Fabric JS Default configuration controllers 
    function is used to change fabric defaults
    */
  applyGlobalFabricDefaults() {
    // InteractiveFabricObject — controls selection handles and borders
    InteractiveFabricObject.ownDefaults = {
      ...InteractiveFabricObject.ownDefaults,
      borderColor: "#00A190",
      borderDashArray: [4, 3],
      borderScaleFactor: 1.5,
      cornerColor: "#ffffff",
      cornerStrokeColor: "#00A190",
      cornerStyle: "circle",
      cornerSize: 10,
      padding: 8,
      transparentCorners: false,
    };
  }
}
