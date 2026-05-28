import { Canvas, Rect } from "fabric";
import { makeAutoObservable } from "mobx";
import { CanvasZoomManager } from "./CanvasZoomManager";
import { CanvasPanningManager } from "./CanvasPanningManager";

export class CanvasManager {
  canvas: Canvas | null = null;
  zoomManager: CanvasZoomManager;
  panningManager: CanvasPanningManager;

  constructor() {
    const getCanvas = () => this.canvas;
    this.zoomManager = new CanvasZoomManager(getCanvas);
    this.panningManager = new CanvasPanningManager(getCanvas);
    makeAutoObservable(this);
  }

  init(canvasElement: HTMLCanvasElement) {
    this.canvas?.dispose();
    this.canvas = new Canvas(canvasElement, {
      backgroundColor: "#C4E2F5",
    });
    this.canvas.renderAll();
  }

  addRectangle() {
    if (!this.canvas) return;

    const rect = new Rect({
      left: 100,
      top: 100,
      width: 120,
      height: 80,
      fill: "#FFFFFF",
      stroke: "#2563eb",
      strokeWidth: 1,
    });

    this.canvas.add(rect);
  }

  removeSelected() {
    if (!this.canvas) return;

    const activeObject = this.canvas.getActiveObject();
    if (!activeObject) return;

    this.canvas.remove(activeObject);
  }

  clear() {
    if (!this.canvas) return;
    this.canvas.clear();
  }
}
