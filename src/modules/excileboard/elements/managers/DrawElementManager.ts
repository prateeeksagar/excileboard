import { BaseElementManager, type ElementStyle } from "./BaseElementManager";
import { makeObservable, observable } from "mobx";

export class DrawElementManager extends BaseElementManager {
    readonly type = "draw" as const;
    pathData: unknown[] = []; //fabric path command array
    constructor(x: number, y:number, width:number, height: number, style: ElementStyle = {})  {
        super(x,y,width, height, style);
        makeObservable(this, { pathData : observable })
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