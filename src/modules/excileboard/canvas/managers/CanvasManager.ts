import { Canvas, Rect, type TPointerEventInfo } from "fabric";
import { makeAutoObservable } from "mobx";
import { CanvasZoomManager } from "./CanvasZoomManager";
import { CanvasPanningManager } from "./CanvasPanningManager";
import type { RootStore } from "@/store/RootStore";

export class CanvasManager {
  canvas: Canvas | null = null;
  zoomManager: CanvasZoomManager;
  panningManager: CanvasPanningManager;
  readonly root:RootStore

  constructor(root: RootStore) {
    this.root = root;
    const getCanvas = () => this.canvas;
    this.zoomManager = new CanvasZoomManager(getCanvas);
    this.panningManager = new CanvasPanningManager(getCanvas);
    makeAutoObservable(this, { root: false });
  }

  private handleWheel = (opt: TPointerEventInfo<WheelEvent>) => {
    opt.e.preventDefault();
    opt.e.stopPropagation();
    if(opt.e.ctrlKey) {
      // pinch (trackpad) or ctrl+wheel => zoom
      this.zoomManager.onWheelZoom(opt);
    } else {
      //plain wheel / two finger scroll => pan
      this.panningManager.onWheelPan(opt);
    }
  };

  init(canvasElement: HTMLCanvasElement) {
    this.canvas?.dispose();
    this.canvas = new Canvas(canvasElement, {
      backgroundColor: "#FFFFFF",
    });
    this.canvas.on("mouse:wheel", this.handleWheel);
    this.canvas.renderAll();
  }

  dispose() {
    this.canvas?.dispose();
    this.canvas = null;
  }

  addRectangle() {
    if (!this.canvas) return;

    const rect = new Rect({
      left: 100,
      top: 100,
      width: 120,
      height: 80,
      fill: "transparent",
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
