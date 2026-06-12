import { makeObservable, observable } from "mobx";
import { BaseElementManager, type ElementStyle } from "./BaseElementManager"

export class TextElementManager extends BaseElementManager {
    readonly type = "text" as const;
    text: string = "";   // empty → blinking cursor on create (Excalidraw-style); removed on exit if untouched
    isEditing:boolean = false;
    autoWidth:boolean = true;

    constructor(x:number, y: number, width: number, height: number, styles: ElementStyle = {}) {
        super(x, y, width, height, styles);
        makeObservable(this, {
            text: observable,
            isEditing: observable,
            autoWidth: observable
        })
    }

    enterTextEditing():void {
        this.isEditing = true;
    }

    exitTextEditing(finalText:string):void {
        this.text = finalText.trim();
        this.isEditing = false;
    }
    setManualWidth(width: number) {
        this.width = width;
        this.autoWidth = false;   // user fixed the width → wrap from now on
    }

    get isEmpty(): boolean {
        return this.text.trim() === "";
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
            text: this.text,
            fontFamily: this.fontFamily,
            fontSize: this.fontSize,
            autoWidth: this.autoWidth
        }
    }
}