export type ToolType = | "rectangle" | "diamond" | "circle" | "arrow" | "line" | "pencil" | "text" | "eraser" | "hand"

export type TOOL_OPTION = {
    name: string;
    value: ToolType
    icon: React.ReactNode
}
