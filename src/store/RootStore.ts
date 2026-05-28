import { makeAutoObservable } from "mobx";
import { CanvasManager } from "../modules/excileboard/canvas/managers/CanvasManager";

class RootStore {
  canvasManager: CanvasManager;

  constructor() {
    this.canvasManager = new CanvasManager();
    makeAutoObservable(this);
  }
}

const rootStore = new RootStore();

export function useRootStore() {
  return { rootStore };
}
