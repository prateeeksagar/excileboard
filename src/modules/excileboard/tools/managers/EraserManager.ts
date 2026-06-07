import type { RootStore } from "@/store/RootStore";
import { makeAutoObservable } from "mobx";
import { Point, type FabricObject } from "fabric";

export class EraserManager {
    root: RootStore;
    isErasing: boolean = false;
    erasedIds: Set<string> = new Set();   // elements already fading out (skip re-hits)

    constructor(root: RootStore) {
        this.root = root
        makeAutoObservable(this, { root: false });
    }

    startErasing() {
        this.isErasing = true;
        this.erasedIds.clear();
    }

    stopErasing() {
        this.isErasing = false;
    }

    eraseAtPoint(x: number, y: number) {
        if (!this.isErasing) return;
        const canvas = this.root.canvasManager.canvas;
        if (!canvas) return;

        const point = new Point(x, y);
        const objects = canvas.getObjects();
        // top-most first so we erase what's visually on top
        for (let i = objects.length - 1; i >= 0; i--) {
            const obj = objects[i];
            const id = (obj as FabricObject & { elementId?: string }).elementId;
            if (!id || this.erasedIds.has(id)) continue;   // skip ones already fading out
            if (obj.containsPoint(point)) {
                this.erasedIds.add(id);
                this.animateErase(obj, id);
                return;   // one element per contact point
            }
        }
    }

    // Fade the fabric object out, then drop the model (sync() removes the object + its watcher).
    private animateErase(obj: FabricObject, id: string) {
        const canvas = this.root.canvasManager.canvas;
        obj.animate(
            { opacity: 0 },
            {
                duration: 180,
                onChange: () => canvas?.requestRenderAll(),
                onComplete: () => this.root.elementManager.removeById(id),
            },
        );
    }
}
