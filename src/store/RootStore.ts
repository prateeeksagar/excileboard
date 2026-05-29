import { makeAutoObservable } from "mobx";
import { CanvasManager } from "../modules/excileboard/canvas/managers/CanvasManager";
import { ToolManager } from "@/modules/excileboard/tools/managers/ToolManager";


export class RootStore {
  canvasManager: CanvasManager;
  toolManager: ToolManager;

  constructor() {
    this.canvasManager = new CanvasManager(this);
    this.toolManager = new ToolManager(this);
    makeAutoObservable(this);
  }
}

const rootStore = new RootStore();

export function useRootStore() {
  return { rootStore };
}
