import type { RootStore } from "@/store/RootStore";
import { Ellipse, Rect, type FabricObject, Polygon } from "fabric";
import { makeAutoObservable, reaction, type IReactionDisposer } from "mobx";
import type { BaseElementManager } from "../../elements/managers/BaseElementManager";

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
            (props) => {
                fabricObj.set({
                    left:    props.x,
                    top:     props.y,
                    width:   props.width,
                    height:  props.height,
                    stroke:  props.strokeColor,
                    fill:    props.fillColor,
                    opacity: props.opacity,
                });
                fabricObj.setCoords();
                this.root.canvasManager.canvas?.renderAll()
            }
        )
        this.elementDisposers.set(el.id, d);
    }

    private createFabricObject(el: BaseElementManager): FabricObject | null {
        // Interactive only when not in a drawing tool; the tool reaction in
        // CanvasManager re-toggles this for all objects whenever the tool changes.
        const interactive = this.root.toolManager.activeTool === "hand";
        const base = {
        left:        el.x,
        top:         el.y,
        width:       el.width,
        height:      el.height,
        stroke:      el.strokeColor,
        fill:        el.fillColor,
        strokeWidth: el.strokeWidth,
        opacity:     el.opacity,
        selectable:  interactive,
        evented:     interactive,
        };

        switch (el.type) {
        case "rectangle": return new Rect({ ...base });
        case "circle":    return new Ellipse({ ...base, rx: el.width / 2, ry: el.height / 2 });
        case "diamond":   return this.createDiamond(base);
        default:          return null;
        }
    }

    private createDiamond(base: any): FabricObject {
        // Fabric doesn't have a diamond — use Polygon
        const { left, top, width, height } = base;
        const points = [
        { x: width / 2, y: 0 },
        { x: width,     y: height / 2 },
        { x: width / 2, y: height },
        { x: 0,         y: height / 2 },
        ];
        return new Polygon(points, { ...base });
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