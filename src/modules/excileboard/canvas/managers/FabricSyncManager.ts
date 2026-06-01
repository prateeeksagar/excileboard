import type { RootStore } from "@/store/RootStore";
import { Ellipse, Rect, type FabricObject, Polygon, Polyline, Path, Textbox, FabricText, IText } from "fabric";
import { makeAutoObservable, reaction, type IReactionDisposer } from "mobx";
import type { BaseElementManager } from "../../elements/managers/BaseElementManager";
import { DrawElementManager } from "../../elements/managers/DrawElementManager";
import type { TextElementManager } from "../../elements/managers/TextElementManager";

export class FabricSyncManager {

    private disposeReaction: IReactionDisposer | null = null;
    private fabricMap = new Map<string, FabricObject>();
    private elementDisposers = new Map<string, IReactionDisposer>();
    root: RootStore;

    constructor(root: RootStore) {
        this.root = root;
        makeAutoObservable(this);
    }

    start() {
        //react to element list changes
        this.disposeReaction = reaction(
            () => Array.from(this.root.elementManager.elements.values()).map(el => el.id),
            () => this.sync(),
            {fireImmediately: true}
        )

        // write Fabric edits (move/resize/rotate) back into the element models,
        // otherwise the model goes stale and the next sync snaps the shape back.
        this.root.canvasManager.canvas?.on("object:modified", this.handleObjectModified);
        this.root.canvasManager.canvas?.on("path:created", this.handlePathCreated);
        this.root.canvasManager.canvas?.on("text:changed", this.handleTextChanged)
        // auto-grow a text box's wi dth to fit content while typing (Excalidraw-style)
    }

    private handleObjectModified = (opt: { target?: FabricObject }) => {
        console.log('handle object modified');
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
            obj.set({ width: w});
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
        const obj = opt.target as IText | undefined;
        const id = (obj as (FabricObject & { elementId?: string }) | undefined)?.elementId;
        const el = id ? this.root.elementManager.get(id) : undefined;
        if (!obj || !el || el.type !== "text") return;

        const t = el as TextElementManager;
        
        if (!t.autoWidth) return;   // user manually resized → wrap instead of grow
        console.log("after autowidth");
        // ✅ Measure natural width including trailing spaces
        const natural = this.naturalTextWidth(
            obj.text ?? "",
            obj.fontSize ?? t.fontSize,
            obj.fontFamily ?? t.fontFamily,
        );

        const newWidth = Math.max(natural, 20);  // never collapse to 0

        obj.set({ width: newWidth });
        // obj.setCoords();
        t.width = newWidth;                      // keep model in sync

        this.root.canvasManager.canvas?.requestRenderAll();
    };

    // Natural single-line width of the text (max line width for explicit \n), via a throwaway probe.
    // A sentinel "|" is appended so TRAILING spaces are measured (FabricText drops trailing
    // whitespace otherwise), then its own width is subtracted back out.
    private naturalTextWidth(text: string, fontSize: number, fontFamily: string): number {
        // ✅ Append sentinel BEFORE measuring so trailing spaces are included
        const probe    = new FabricText((text || " ") + "|", { fontSize, fontFamily });
        const sentinel = new FabricText("|", { fontSize, fontFamily });

        // Extra 8px padding so caret never sits at the edge
        return Math.ceil(probe.width - sentinel.width) + 8;
    }

    private handlePathCreated = (opt: { path?: FabricObject }) => {
        const path = opt.path as Path | undefined;
        const canvas = this.root.canvasManager.canvas;
        if (!path || !canvas) return;

        canvas.remove(path);   // sync will recreate it from the model

        const el = new DrawElementManager(path.left ?? 0, path.top ?? 0, path.width ?? 0, path.height ?? 0, {
            strokeColor: (path.stroke as string) ?? "#000000",
            strokeWidth: path.strokeWidth ?? 2,
        });
        el.pathData = path.path as unknown[];   // the captured commands (absolute coords)
        this.root.elementManager.add(el);
    };


    private sync() {
        const canvas = this.root.canvasManager.canvas;
        if (!canvas) return;

        const elements = Array.from(this.root.elementManager.elements.values()); // ← fix

        const currentIds = new Set(elements.map(e => e.id));

        // Remove deleted elements
        this.fabricMap.forEach((fabricObj, id) => {
                if (!currentIds.has(id)) {
                canvas.remove(fabricObj);
                this.fabricMap.delete(id);
                this.elementDisposers.get(id)?.();   // ← stop the per-element reaction
                this.elementDisposers.delete(id);
            }
        });

        // Add new elements
        elements.forEach(el => {                                                  // ← fix
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

        if(el.type == "text") {
            const textEl = el as TextElementManager;
            this.watchTextElement(textEl, fabricObj);
            return;
        }
        
        const d = reaction(
            () => ({
                x: el.x, y: el.y,
                width: el.width, height: el.height,
                strokeColor: el.strokeColor,
                fillColor: el.fillColor,
                opacity: el.opacity,
            }),
            () => {
                this.applyToFabric(el, fabricObj);
                this.root.canvasManager.canvas?.requestRenderAll();
            }
        )
        this.elementDisposers.set(el.id, d);
    }

    private watchTextElement(el: TextElementManager, fabricObj: FabricObject) {
        const canvas = this.root.canvasManager.canvas;
        const textbox = fabricObj as IText;

        const d = reaction(
            () => el.isEditing,
            (isEditing) => {
                if (!isEditing) return;

                textbox.set({ selectable: true, evented: true });
                canvas?.setActiveObject(textbox);

                // defer so the Textbox is mounted/rendered before entering edit mode
                setTimeout(() => {
                    textbox.enterEditing();
                    textbox.selectAll();          // type to replace; harmless when empty
                    canvas?.requestRenderAll();
                }, 0);

                textbox.once("editing:exited", () => {
                    el.exitTextEditing(textbox.text ?? "");
                    if (el.isEmpty) {
                        // sync() removes the fabric object AND disposes this reaction
                        this.root.elementManager.removeById(el.id);
                    }
                    this.root.toolManager.setActiveTool("hand");
                    canvas?.requestRenderAll();
                });

            },
            { fireImmediately: true }   // isEditing is already true by the time we get here
        );

        this.elementDisposers.set(el.id, d);
    }

    private createFabricObject(el: BaseElementManager): FabricObject | null {
        // Interactive only when not in a drawing tool; the tool reaction in
        // CanvasManager re-toggles this for all objects whenever the tool changes.
        const common = this.commonFabricCreateOptions(el);

        let obj: FabricObject;
        switch (el.type) {
        case "rectangle": obj = new Rect(common); break;
        case "circle":    obj = new Ellipse(common); break;
        case "diamond":   obj = new Polygon(this.diamondPoints(el.width, el.height), common); break;
        case "line":      obj = new Polyline(this.linePoints(el.width, el.height), common);break; 
        case "draw":      obj = new Path((el as DrawElementManager).pathData as any, common); break;
        case "text":      obj = new IText((el as TextElementManager).text, common);break;
        default:          return null;
        }

        this.applyToFabric(el, obj);
        return obj;
    }

    private commonFabricCreateOptions(el: BaseElementManager) {
        // Interactive only when not in a drawing tool; the tool reaction in
        // CanvasManager re-toggles this for all objects whenever the tool changes.
        const interactive = this.root.toolManager.activeTool == "hand";
        
        let common = { selectable: interactive, evented: interactive }

        if(el.type == "text") {
            // originX/Y "left"/"top": Fabric's default origin is CENTER, which makes an
            // auto-growing box expand symmetrically (text drifts left while typing). Anchoring
            // to the top-left keeps el.x/el.y as the corner so growth goes rightward only.
            // splitByGrapheme:false → wrap at spaces (word wrap); lockScalingY → resize controls width, not font
            const textCommon = { originX: "left", originY: "top", splitByGrapheme: false, breakWords: false, lockScalingY: true, width: 20, minWidth: 10 }
            common = { ...common, ...textCommon }
        }

        return common;
    }

    beginEdit(id: string) {
        const obj = this.fabricMap.get(id);
        const canvas = this.root.canvasManager.canvas;
        if (!(obj instanceof IText) || !canvas) return;
        canvas.setActiveObject(obj);
        obj.enterEditing();
        obj.selectAll();
        canvas.requestRenderAll();
    }

    private diamondPoints(width: number, height: number) {
        return [
            { x: width / 2, y: 0 },
            { x: width,     y: height / 2 },
            { x: width / 2, y: height },
            { x: 0,         y: height / 2 },
        ];
    }

    private linePoints(width: number, height: number) : {x:number, y:number}[] {
        return [
        { x: 0, y: 0 },
        { x: width, y: height },
    ];
    }

    // Single source of truth for pushing an element model onto its fabric object.
    // Geometry is shape-aware: Polygon rebuilds points, Ellipse uses rx/ry, Rect uses width/height.
    private applyToFabric(el: BaseElementManager, obj: FabricObject) {
        obj.set({
            stroke:      el.strokeColor,
            fill:        el.fillColor,
            strokeWidth: el.strokeWidth,
            opacity:     el.opacity,
        });

        // Text: auto-sized, colored via `fill` (fillColor is transparent → use strokeColor).
        if (el.type === "text") {
            const t = el as TextElementManager;
            obj.set({
                text:       t.text,
                fontSize:   t.fontSize,
                fontFamily: t.fontFamily,
                fill:       el.strokeColor || "#000000",   // glyph color
                left:       el.x,
                top:        el.y,
                // auto-grow → fit content; fixed (after manual resize) → wrap to el.width
                ...(t.autoWidth ? {} : { width: el.width }),
            });
            obj.setCoords();
            return;
        }

        if (obj instanceof Polyline) {        // covers Polyline (line) AND Polygon (diamond)
            const points = el.type === "line"
                ? this.linePoints(el.width, el.height)
                : this.diamondPoints(el.width, el.height);
            obj.set({ points });
            obj.setDimensions();              // recompute bbox/pathOffset from the new points
        } else if (obj instanceof Ellipse) {
            obj.set({ rx: el.width / 2, ry: el.height / 2 });
        } else {
            obj.set({ width: el.width, height: el.height });
        }

        // handles drawing
        if (el.type === "draw") {
            obj.set({ stroke: el.strokeColor, strokeWidth: el.strokeWidth, opacity: el.opacity, fill: "" });
            obj.setCoords();
            return;
        }

        obj.set({ left: el.x, top: el.y });   // position last (Polygon dims recalc can shift origin)
        obj.setCoords();
    }

    stop() {
        this.disposeReaction?.();
        this.disposeReaction = null;
        // tear down per-element watchers + fabric objects too (see below)
        this.elementDisposers.forEach((d) => d());
        this.elementDisposers.clear();
        this.root.canvasManager.canvas?.off("object:modified", this.handleObjectModified);
        this.root.canvasManager.canvas?.off("path:created", this.handlePathCreated);
        // this.root.canvasManager.canvas?.off("text:changed", this.handleTextChanged);
        this.fabricMap.clear();
    }

}