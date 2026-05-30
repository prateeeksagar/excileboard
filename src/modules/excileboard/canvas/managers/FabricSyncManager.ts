import type { RootStore } from "@/store/RootStore";
import { Ellipse, Rect, type FabricObject, Polygon, Polyline, Path } from "fabric";
import { makeAutoObservable, reaction, type IReactionDisposer } from "mobx";
import type { BaseElementManager } from "../../elements/managers/BaseElementManager";
import { DrawElementManager } from "../../elements/managers/DrawElementManager";

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
    }

    private handleObjectModified = (opt: { target?: FabricObject }) => {
        const obj = opt.target;
        if (!obj) return;
        const id = (obj as FabricObject & { elementId?: string }).elementId;
        if (!id) return;
        const el = this.root.elementManager.get(id);
        if (!el) return;

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

    private createFabricObject(el: BaseElementManager): FabricObject | null {
        // Interactive only when not in a drawing tool; the tool reaction in
        // CanvasManager re-toggles this for all objects whenever the tool changes.
        const interactive = this.root.toolManager.activeTool === "hand";
        const common = { selectable: interactive, evented: interactive };

        let obj: FabricObject;
        switch (el.type) {
        case "rectangle": obj = new Rect(common); break;
        case "circle":    obj = new Ellipse(common); break;
        case "diamond":   obj = new Polygon(this.diamondPoints(el.width, el.height), common); break;
        case "line":      obj = new Polyline(this.linePoints(el.width, el.height), common);break; 
        case "draw":      obj = new Path((el as DrawElementManager).pathData as any, common); break;
        default:          return null;
        }

        this.applyToFabric(el, obj);
        return obj;
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
        this.fabricMap.clear();
    }

}