import type { Canvas } from "fabric";
import { makeAutoObservable } from "mobx";

export class CanvasPanningManager {
    private getCanvas: () => Canvas | null;

    constructor(getCanvas: () => Canvas | null) {
        this.getCanvas = getCanvas;
        // makeAutoObservable<this, "getCanvas">(this, { getCanvas: false });
    }
}
