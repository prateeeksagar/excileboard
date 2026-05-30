import type { ElementType } from "../../types/element";
import type { BaseElementManager, ElementStyle } from "./BaseElementManager";
import { RectangleElementManager } from "./RectangleElementManager";

const REGISTRY: Partial<Record<ElementType, ElementCtor>> = {
    rectangle: RectangleElementManager
}

type ElementCtor = new (x: number, y: number, w:number, h: number, style: ElementStyle) => BaseElementManager;

export class ElementFactoryManager {
    static create(
        type: ElementType,
        x: number, y: number,
        width = 100, height = 100,
        overrideStyle: ElementStyle
    ): BaseElementManager {
        const Ctor = REGISTRY[type];
        if(!Ctor) throw new Error('unsupported type');
        return new Ctor(x,y, width, height, overrideStyle);
    }
}