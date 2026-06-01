import {  makeAutoObservable } from "mobx";
import type { RootStore } from "@/store/RootStore";
import type { ToolType } from "../../types/tools";
import type { ElementType } from "../../types/element";
import type { BaseElementManager } from "../../elements/managers/BaseElementManager";
import { ElementFactoryManager } from "../../elements/managers/ElementFactoryManager";
import type { TextElementManager } from "../../elements/managers/TextElementManager";

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
    console.log("pointer down caleed")
    const elementType = TOOL_TO_ELEMENT[this.activeTool];
    if (!elementType) return;                 // hand / eraser / pencil handled elsewhere

    if (elementType === "text") {
      const el = ElementFactoryManager.create("text", x, y, 0, 0, {});
      this.root.elementManager.add(el);

      // ✅ Element owns editing state — NOT FabricSyncManager
      (el as TextElementManager).enterTextEditing();
      this.setActiveTool("hand");
      return;
    } 
    
    this.startX = x;
    this.startY = y;
    this.draft = ElementFactoryManager.create(elementType, x, y, 0, 0, {});
    this.root.elementManager.add(this.draft);       // observable collection; sync layer draws it
  }

  onPointerMove(x: number, y:number) {
    console.log("pointer move")
    if (!this.draft) return;

    this.draft.update({
      x: Math.min(x, this.startX),
      y: Math.min(y, this.startY),
      width: Math.abs(x - this.startX),
      height: Math.abs(y - this.startY),
    });
  }

  onPointerUp() {
    console.log("pointer up")
    if (!this.draft) return;
    // discard zero-size accidental clicks
    if (this.draft.width < 2 && this.draft.height < 2) {
      this.root.elementManager.remove(this.draft);
    }
    this.draft = null;
    this.setActiveTool("hand");   // optional: snap back to select after placing
  }

}
