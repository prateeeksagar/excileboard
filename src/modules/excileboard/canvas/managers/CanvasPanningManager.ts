import { Point, type Canvas, type TPointerEventInfo } from "fabric";
import { makeAutoObservable } from "mobx";

export class CanvasPanningManager {
    private getCanvas: () => Canvas | null;

    constructor(getCanvas: () => Canvas | null) {
        this.getCanvas = getCanvas;
        makeAutoObservable<this, "getCanvas">(this, { getCanvas: false });
    }

    // trackapd two-finger scroll (wheel event without ctrl key) => pan
    onWheelPan(opt: TPointerEventInfo<WheelEvent> ) :void {
        const canvas = this.getCanvas()
        if(!canvas) return;

        const { deltaX, deltaY } = opt.e;
        //move the viewport opposite to the scroll direction
        canvas.relativePan(new Point(-deltaX, -deltaY));
    }
}
