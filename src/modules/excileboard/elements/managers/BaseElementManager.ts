import { makeObservable, observable, action } from "mobx";
import { nanoid } from 'nanoid'
import type { strokStyleType } from "../../types/element";

export interface ElementStyle {
  strokeColor?: string;
  fillColor?: string;
  strokeWidth?: number;
  strokeStyle?: "solid" | "dashed" | "dotted";
  opacity?: number;
  cornorRadius?: number
  
}

// Default fallbacks — if nothing passed
const DEFAULT_STYLE: Required<ElementStyle> = {
  strokeColor: "#1e1e1e",
  fillColor: "transparent",
  strokeWidth: 2,
  strokeStyle: "solid",
  opacity: 1,
  cornorRadius: 0
};

export abstract class BaseElementManager {
    readonly id: string = nanoid();
    abstract readonly type:string;

    x: number;
    y:number;
    width:number;
    height:number;
    angle:number = 0;
    strokeColor:string;
    fillColor:string;
    strokeWidth: number;
    strokeStyle: strokStyleType;
    opacity: number;
    cornorRadius: number

    constructor(
        x:number, y:number,
        width: number, height: number,
        style: ElementStyle = {}
    ) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;

        const merged = { ...DEFAULT_STYLE, ...style };
        this.strokeColor = merged.strokeColor;
        this.fillColor = merged.fillColor;
        this.strokeWidth = merged.strokeWidth;
        this.strokeStyle = merged.strokeStyle;
        this.opacity = merged.opacity;
        this.cornorRadius = merged.cornorRadius;

        makeObservable(this, {
            x: observable,
            y:observable,
            width: observable,
            height: observable,
            angle: observable,
            strokeColor: observable,
            fillColor: observable,
            strokeStyle: observable,
            strokeWidth: observable,
            opacity: observable,
            cornorRadius: observable
        });

    }

    update(props: Partial<this>) {
        Object.assign(this, props);
    }

    move(dx: number, dy: number) {
        this.x += dx;
        this.y += dy;
    }
}