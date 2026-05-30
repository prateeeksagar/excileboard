import type { RootStore } from "@/store/RootStore";
import { makeAutoObservable } from "mobx";
import type { BaseElementManager } from "./BaseElementManager";

export class ElementManager {
  // id → model. A Map gives O(1) lookup/removal AND preserves insertion order,
  // which doubles as z-order (draw order).
  elements = new Map<string, BaseElementManager>();
  readonly root: RootStore;

  constructor(root: RootStore) {
    this.root = root;
    makeAutoObservable(this, { root: false });
  }

  add(element: BaseElementManager) {
    this.elements.set(element.id, element);
    return element;
  }

  remove(element: BaseElementManager) {
    this.elements.delete(element.id);
  }

  removeById(id: string) {
    this.elements.delete(id);
  }

  get(id: string) {
    return this.elements.get(id);
  }

  // computed — recomputes only when the map changes
  get all(): BaseElementManager[] {
    return [...this.elements.values()];
  }

  clear() {
    this.elements.clear();
  }

  // for persistence / save
//   toJSON() {
//     return this.all.map((el) => el.toJSON());
//   }
}
