import { action, makeObservable, observable } from "mobx";
import type { BaseElement } from "../../types/element";

export class StyleManager {
    // defaults for next element
    strokeColor: string = "#000000";
    fillColor:string = "transparent";
    strokeWidth:number = 1;
    strokeStyle: "solid" | "dashed" | "dotted" = "solid";
    opacity:number = 1;
    fontSize: number = 16;
    fontFamily = "sans-serif";

    constructor() {
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

    applyFromElement(el: BaseElement) {
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