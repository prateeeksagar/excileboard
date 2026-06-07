import { BaseElementManager, type ElementStyle } from "./BaseElementManager";
import { makeObservable, observable } from "mobx";

// An arrow is defined by two endpoints (x1,y1)→(x2,y2) in scene coordinates.
// Either end may be "bound" to another element by id; when that element moves,
// the arrow re-routes to its edge (see FabricSyncManager.watchArrowElement).
export class ArrowElementManager extends BaseElementManager {
    readonly type = "arrow" as const;

    x1: number;
    y1: number;
    x2: number;
    y2: number;

    startBindingId: string | null = null;
    endBindingId: string | null = null;

    constructor(x: number, y: number, width: number, height: number, style: ElementStyle = {}) {
        super(x, y, width, height, style);
        // start at the click point; end follows the drag
        this.x1 = x;
        this.y1 = y;
        this.x2 = x + width;
        this.y2 = y + height;
        makeObservable(this, {
            x1: observable,
            y1: observable,
            x2: observable,
            y2: observable,
            startBindingId: observable,
            endBindingId: observable,
        });
    }

    setEnd(x: number, y: number) {
        this.x2 = x;
        this.y2 = y;
    }

    setStartBinding(id: string | null) {
        this.startBindingId = id;
    }

    setEndBinding(id: string | null) {
        this.endBindingId = id;
    }

    toJSON() {
        return {
            type: this.type,
            id: this.id,
            x1: this.x1, y1: this.y1,
            x2: this.x2, y2: this.y2,
            startBindingId: this.startBindingId,
            endBindingId: this.endBindingId,
            strokeColor: this.strokeColor,
            strokeWidth: this.strokeWidth,
        };
    }
}
