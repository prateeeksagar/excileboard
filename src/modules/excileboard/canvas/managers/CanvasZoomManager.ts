import type { Canvas, TPointerEventInfo } from "fabric";
import { Point} from 'fabric';
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

    private toPercentage(scale: number): number {
        return scale * 100;
    }

    private clampPercentage(percentage: number): number {
        const min = this.minZoom * 100;
        const max = this.maxZoom * 100;
        return Math.min(max, Math.max(min, percentage));
    }

    // ui based zoom set function
    setZoomPercent(p: number): void {
        const canvas = this.getCanvas();
        if (!canvas) return;
        this.zoomPercentage = this.clampPercentage(p);
        const scale = this.toScale(this.zoomPercentage);
        const center = canvas.getCenterPoint();
        canvas.zoomToPoint(center, scale);
    }

    private toFabricPoint(p: { x: number; y: number }) {
        return new Point(p.x, p.y);
    }

    //gesture based zoom function
    setGestureZoom(scale: number, point: {x: number; y: number }):void {
        const canvas = this.getCanvas();
        if(!canvas) return;

        const clamped = this.gestureClamp(scale);
        const canvasPoint = this.toFabricPoint(point);

        canvas.zoomToPoint(canvasPoint, clamped);
        this.zoomPercentage = this.clampPercentage(this.toPercentage(clamped));
    }

    onWheelZoom(opt: TPointerEventInfo<WheelEvent>) {
        const canvas = this.getCanvas();
        if (!canvas) return;

        const { e } = opt;

        // TODO: once CanvasPanningManager is implemented, route plain wheel
        // (no ctrlKey) to panning and reserve ctrl/pinch for zoom.
        let zoom = canvas.getZoom();
        zoom *= 0.99 ** e.deltaY;

        // viewportPoint is in canvas-pixel space, which is what zoomToPoint expects.
        const point = opt.viewportPoint ?? canvas.getViewportPoint(e);
        this.setGestureZoom(zoom, { x: point.x, y: point.y });
    }

    private gestureClamp(scale: number) {
        return Math.min(
        this.maxZoom,
        Math.max(this.minZoom, scale)
        );
    }

    zoomIn(step = 10) {
        this.setZoomPercent(this.getZoomPercent() + step);
    }

    zoomOut(step = 10) {
        this.setZoomPercent(this.getZoomPercent() - step);
    }
}
