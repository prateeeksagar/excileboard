import { makeObservable, observable } from "mobx";
import type { RootStore } from "@/store/RootStore";
import type { BaseElementManager } from "../../elements/managers/BaseElementManager";
import type { StrokeStyle } from "../../types/style";

export class StyleManager {
    // defaults for next element
    strokeColor: string = "#1e1e1e";
    fillColor:string = "transparent";
    strokeWidth:number = 2;
    strokeStyle: StrokeStyle = "solid";
    opacity:number = 1;
    fontSize: number = 16;
    fontFamily = "sans-serif";
    root: RootStore

    constructor(root: RootStore) {
        this.root = root;
        makeObservable(this, {
            strokeColor: observable,
            fillColor: observable,
            strokeWidth: observable,
            strokeStyle: observable,
            opacity: observable,
            fontFamily: observable,
            fontSize: observable
        });
    }

    applyFromElement(el: BaseElementManager) {
        if(!el) return
        // when user selects an element then sync with existing element
        this.strokeColor = el.strokeColor;
        this.fillColor = el.fillColor;
        this.strokeWidth = el.strokeWidth;
        this.strokeStyle = el.strokeStyle
        this.opacity = el.opacity;
    }

    updateStyle<K extends keyof this>(key: K, value: this[K]) {
        // When user changes a property in sidebar
        this[key] = value;
    }

    setStrokeColor(color: string) {
        this.strokeColor = color;
        this.updateSelected({ strokeColor: color })
    }

    setFillColor(color: string) {
        this.fillColor = color;
        this.updateSelected({ fillColor: color });
    }

    setStrokeWidth(width: number) {
        this.strokeWidth = width;
        this.updateSelected({ strokeWidth : width });
    }

    setStrokStyle(style: StrokeStyle) {
        this.strokeStyle = style;
        this.updateSelected({ strokeStyle: style })
    }

    private updateSelected(updates: Partial<BaseElementManager>) {
        this.root.selectionManager.selectedIds.forEach(id => {
        this.root.elementManager.get(id)?.update(updates);
        });
    }

    get currentDefaults() {
        return {
        strokeColor: this.strokeColor,
        fillColor: this.fillColor,
        strokeWidth: this.strokeWidth,
        strokeStyle: this.strokeStyle,
        opacity: this.opacity,
        };
    }
}