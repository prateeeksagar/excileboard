import {  makeAutoObservable } from "mobx";
import type { RootStore } from "@/store/RootStore";
import type { ToolType } from "../../types/tools";
import type { ElementType } from "../../types/element";
import type { BaseElementManager } from "../../elements/managers/BaseElementManager";
import { ElementFactoryManager } from "../../elements/managers/ElementFactoryManager";
import type { TextElementManager } from "../../elements/managers/TextElementManager";
import type { ArrowElementManager } from "../../elements/managers/ArrowElementManager";

const TOOL_TO_ELEMENT: Partial<Record<ToolType, ElementType>> = {
    rectangle: "rectangle",
    circle: "circle",
    arrow: "arrow",
    diamond: "diamond",
    text: "text",
    line: "line",
    pencil: "draw"
};


export class ToolManager {
  activeTool: ToolType = "hand";
  private draft: BaseElementManager | null = null;   // element being dragged out
  private startX = 0;
  private startY = 0;
  readonly root: RootStore

  constructor(root: RootStore) {
    this.root = root;
    makeAutoObservable(this, { root: false } ,{ autoBind: true });
  }

  setActiveTool(tool: ToolType) {
    this.activeTool = tool;
  }



  onPointerDown(x:number, y:number) {

    // Eraser: delete whatever the cursor is over, and keep deleting while dragging.
    if (this.activeTool === "eraser") {
      this.root.eraserManager.startErasing();
      this.root.eraserManager.eraseAtPoint(x, y);
      return;
    }

    const elementType = TOOL_TO_ELEMENT[this.activeTool];
    if (!elementType) return;                 // hand / eraser / pencil handled elsewhere

    if (elementType === "text") {
      const el = ElementFactoryManager.create("text", x, y, 0, 0, this.root.styleManager.currentDefaults) as TextElementManager;
      this.root.elementManager.add(el);

      // ✅ Element owns editing state — NOT FabricSyncManager
      (el as TextElementManager).enterTextEditing();
      this.setActiveTool("hand");
      return;
    }

    if (elementType === "arrow") {
      this.startX = x;
      this.startY = y;
      const arrow = ElementFactoryManager.create("arrow", x, y, 0, 0, this.root.styleManager.currentDefaults) as ArrowElementManager;
      // bind the start to whatever shape is under the click (if any)
      arrow.setStartBinding(this.root.canvasManager.fabricSyncManager.elementIdAt(x, y));
      this.draft = arrow;
      this.root.elementManager.add(arrow);
      return;
    }

    this.startX = x;
    this.startY = y;
    this.draft = ElementFactoryManager.create(elementType, x, y, 0, 0, this.root.styleManager.currentDefaults);
    this.root.elementManager.add(this.draft);       // observable collection; sync layer draws it
  }

  onPointerMove(x: number, y:number) {
    console.log("pointer move")

    if (this.activeTool === "eraser") {
      this.root.eraserManager.eraseAtPoint(x, y);   // no-ops unless a drag is in progress
      return;
    }

    if (!this.draft) return;

    // Arrow: drag moves the end point (direction matters, so no min/abs bbox).
    if (this.draft.type === "arrow") {
      (this.draft as ArrowElementManager).setEnd(x, y);
      return;
    }

    this.draft.update({
      x: Math.min(x, this.startX),
      y: Math.min(y, this.startY),
      width: Math.abs(x - this.startX),
      height: Math.abs(y - this.startY),
    });
  }

  onPointerUp() {
    console.log("pointer up")

    if (this.activeTool === "eraser") {
      this.root.eraserManager.stopErasing();   // stay on the eraser tool (Excalidraw keeps it active)
      return;
    }

    if (!this.draft) return;

    // Arrow: bind the end to a shape under the tip, discard if it's just a click.
    if (this.draft.type === "arrow") {
      const a = this.draft as ArrowElementManager;
      a.setEndBinding(this.root.canvasManager.fabricSyncManager.elementIdAt(a.x2, a.y2, a.id));
      if (Math.hypot(a.x2 - a.x1, a.y2 - a.y1) < 4) {
        this.root.elementManager.remove(a);
      }
      this.draft = null;
      this.setActiveTool("hand");
      return;
    }

    // discard zero-size accidental clicks
    if (this.draft.width < 2 && this.draft.height < 2) {
      this.root.elementManager.remove(this.draft);
    }
    this.draft = null;
    this.setActiveTool("hand");   // optional: snap back to select after placing
  }

}
