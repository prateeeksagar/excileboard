import {  makeAutoObservable } from "mobx";
import type { RootStore } from "@/store/RootStore";
import type { ToolType } from "../../types/tools";


export class ToolManager {
  activeTool: ToolType = "hand";
  readonly root: RootStore

  constructor(root: RootStore) {
    this.root = root;
    makeAutoObservable(this, { root: false });
  }

  setActiveTool(tool: ToolType) {
    this.activeTool = tool;
  }

  // example of sibling communication via the hub:
  commitRectangle() {
    this.root.canvasManager.addRectangle();
  }
}
