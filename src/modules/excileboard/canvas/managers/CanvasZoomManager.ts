import type { Canvas } from "fabric";
import { makeAutoObservable } from "mobx";

export class CanvasZoomManager {
    private getCanvas: () => Canvas | null;

    private minZoom: number = 0.1;
    private maxZoom: number = 5;

    zoomPercentage: number = 100;

    constructor(getCanvas: () => Canvas | null) {
        this.getCanvas = getCanvas;
        makeAutoObservable<this, "getCanvas">(this, { getCanvas: false });
    }

    getZoomPercent(): number {
        return this.zoomPercentage;
    }

    private toScale(percentage: number): number {
        return percentage / 100;
    }

    private clampPercentage(percentage: number): number {
        const min = this.minZoom * 100;
        const max = this.maxZoom * 100;
        return Math.min(max, Math.max(min, percentage));
    }

    setZoomPercent(p: number): void {
        const canvas = this.getCanvas();
        if (!canvas) return;
        this.zoomPercentage = this.clampPercentage(p);
        const scale = this.toScale(this.zoomPercentage);
        const center = canvas.getCenterPoint();
        canvas.zoomToPoint(center, scale);
    }

    zoomIn(step = 10) {
        this.setZoomPercent(this.getZoomPercent() + step);
    }

    zoomOut(step = 10) {
        this.setZoomPercent(this.getZoomPercent() - step);
    }
}
