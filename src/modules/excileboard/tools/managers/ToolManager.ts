import {  makeAutoObservable } from "mobx";
import type { RootStore } from "@/store/RootStore";
import type { ToolType } from "../../types/tools";
import type { ElementType } from "../../types/element";
import type { BaseElementManager } from "../../elements/managers/BaseElementManager";
import { ElementFactoryManager } from "../../elements/managers/ElementFactoryManager";

const TOOL_TO_ELEMENT: Partial<Record<ToolType, ElementType>> = {
    rectangle: "rectangle",
    circle: "circle",
    arrow: "arrow",
    diamond: "diamond",
    text: "text"
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
    const elementType = TOOL_TO_ELEMENT[this.activeTool];
    if (!elementType) return;                 // hand / eraser / pencil handled elsewhere

    this.startX = x;
    this.startY = y;
    this.draft = ElementFactoryManager.create(elementType, x, y, 0, 0, {});
    this.root.elementManager.add(this.draft);       // observable collection; sync layer draws it
  }

  onPointerMove(x: number, y:number) {

    if (!this.draft) return;

    this.draft.update({
      x: Math.min(x, this.startX),
      y: Math.min(y, this.startY),
      width: Math.abs(x - this.startX),
      height: Math.abs(y - this.startY),
    });
  }

  onPointerUp() {
    if (!this.draft) return;
    // discard zero-size accidental clicks
    if (this.draft.width < 2 && this.draft.height < 2) {
      this.root.elementManager.remove(this.draft);
    }
    this.draft = null;
    this.setActiveTool("hand");   // optional: snap back to select after placing
  }

}
