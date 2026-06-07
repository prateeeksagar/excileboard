import { makeAutoObservable } from "mobx";
import { CanvasManager } from "../modules/excileboard/canvas/managers/CanvasManager";
import { ToolManager } from "@/modules/excileboard/tools/managers/ToolManager";
import { StyleManager } from "@/modules/excileboard/tools/managers/StyleManager";
import { ElementManager } from "@/modules/excileboard/elements/managers/ElementManager";
import { EraserManager } from "@/modules/excileboard/tools/managers/EraserManager";


export class RootStore {
  canvasManager: CanvasManager;
  toolManager: ToolManager;
  styleManager: StyleManager;
  elementManager: ElementManager;
  eraserManager: EraserManager;

  constructor() {
    this.canvasManager = new CanvasManager(this);
    this.toolManager = new ToolManager(this);
    this.elementManager = new ElementManager(this);
    this.styleManager = new StyleManager()
    this.eraserManager = new EraserManager(this);
    makeAutoObservable(this);
  }
}

const rootStore = new RootStore();

export function useRootStore() {
  return { rootStore };
}
