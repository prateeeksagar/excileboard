
export type ElementType = "rectangle" | "circle" | "diamond" | "text" | "arrow" | "image" | "line" | "draw";

export type strokStyleType = "solid" | "dashed" | "dotted";

export interface BaseElement {
    id: string;
    type: ElementType;

    // shared across all shapes and elements
    x: number; y: number
    width: number; height: number; 
    strokeColor: string; angle: number;
    fillColor: string;
    strokeWidth: number;
    strokeStyle: strokStyleType;
    opacity: number;
}

