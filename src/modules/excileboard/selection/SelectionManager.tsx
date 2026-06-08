import { RootStore } from "@/store/RootStore";
import { makeAutoObservable } from "mobx";

export class SelectionManager {
    root: RootStore
    selectedIds: Set<string> = new Set();

    constructor(root: RootStore) {
        this.root = root;
        makeAutoObservable(this);
    }


    setSelectedIds(ids: string[]) {
        this.clearSelection();
        this.selectedIds = new Set(ids);

        const firstId = ids[0];
        if (firstId) {
            const el = this.root.elementManager.get(firstId);
            if (el) this.root.styleManager.applyFromElement(el);
        }
        console.log("selectedIds", this.selectedIds);
    }

    get selectedElements() {
        return Array.from(this.selectedIds)
            .map(id => this.root.elementManager.get(id))
            .filter(Boolean);
    }

    get hasSelection():boolean {
        return (this.selectedIds.size > 0);
    }


    clearSelection() {
        this.selectedIds.clear();
    }
}