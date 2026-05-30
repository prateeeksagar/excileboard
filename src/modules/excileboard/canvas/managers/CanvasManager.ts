import { Canvas, PencilBrush, Rect, type TPointerEventInfo } from "fabric";
import { makeAutoObservable, reaction } from "mobx";
import { CanvasZoomManager } from "./CanvasZoomManager";
import { CanvasPanningManager } from "./CanvasPanningManager";
import type { RootStore } from "@/store/RootStore";
import { FabricSyncManager } from "./FabricSyncManager";

export class CanvasManager {
  canvas: Canvas | null = null;
  zoomManager: CanvasZoomManager;
  panningManager: CanvasPanningManager;
  fabricSyncManager: FabricSyncManager;
  readonly root:RootStore

  constructor(root: RootStore) {
    this.root = root;
    const getCanvas = () => this.canvas;
    this.zoomManager = new CanvasZoomManager(getCanvas);
    this.panningManager = new CanvasPanningManager(getCanvas);
    this.fabricSyncManager = new FabricSyncManager(this.root)
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
    this.canvas.on("mouse:down", (opt) => {
      const p = this.canvas!.getScenePoint(opt.e);
      this.root.toolManager.onPointerDown(p.x, p.y)
    });
    this.canvas.on("mouse:up", () => {
      this.root.toolManager.onPointerUp();
    })
    this.canvas.on("mouse:move", (opt) => {
      const p = this.canvas!.getScenePoint(opt.e);
      this.root.toolManager.onPointerMove(p.x, p.y)
    })
    this.canvas.renderAll();

    reaction(
      () => this.root.toolManager.activeTool,
      (tool) => {
        if (!this.canvas) return;
          const pencil = tool == "pencil";
          const drawing = tool !== "hand"; // "hand" = your select/idle tool
          
          this.canvas.isDrawingMode = pencil;
          if(pencil) {
            const brush = new PencilBrush(this.canvas);
            brush.color = '#000000'; // todo:later from stylemanager
            brush.width = 2;
            this.canvas.freeDrawingBrush = brush;
          }
          
          this.canvas.selection = !drawing;
          this.canvas.defaultCursor = drawing ? "crosshair" : "default";
          this.canvas.forEachObject((o) => {
            o.selectable = !drawing;
            o.evented = !drawing;
          });
          this.canvas.requestRenderAll();
      },
      { fireImmediately: true }
    )

    this.fabricSyncManager.start();
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
