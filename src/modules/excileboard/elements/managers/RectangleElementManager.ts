import { BaseElementManager, type ElementStyle } from "./BaseElementManager";
import { makeObservable, observable } from "mobx";

export class RectangleElementManager extends BaseElementManager {
    readonly type = "rectangle" as const;

    cornorRadius: number = 0;

    constructor(x: number, y:number, width:number, height: number, style: ElementStyle = {})  {
        super(x,y,width, height, style);
        makeObservable(this, {
            cornorRadius: observable
        })
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
            fill: this.fillColor
        }
    }
}