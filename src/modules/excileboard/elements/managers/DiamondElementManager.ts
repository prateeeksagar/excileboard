import { makeObservable } from "mobx";
import { BaseElementManager, type ElementStyle } from "./BaseElementManager";

export class DiamonElementManager extends BaseElementManager {

    readonly type = "diamond" as const;

    constructor(x:number, y:number, width:number, height: number, style: ElementStyle = {}){
        super(x, y, width, height, style);
        makeObservable(this);
    }

    toJSON() {
        return {
            type: this.type,
            id: this.id,
            x: this.x,
            y: this.y,
            width: this.width,
            height: this.height,
            strokeColor: this.strokeColor,
            fill: this.fillColor,
            cornorRadius: this.cornorRadius
        }
    }

}