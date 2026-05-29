import { Button } from "@/components/ui/button";
import { observer } from "mobx-react-lite";
import type { TOOL_OPTION } from "../../types/tools";
import { Diamond, Pencil, Square , Circle as CircleIcon, MousePointer2, MoveRight, Type, Minus, EraserIcon} from "lucide-react";
import { useRootStore } from "@/store/RootStore";

const tools: TOOL_OPTION[] = [
    { name: "Hand", value: "hand" , icon: <MousePointer2 />},
    { name: "Rectangle", value: "rectangle", icon: <Square /> },
    { name: "Diamond", value: "diamond", icon: <Diamond /> },
    { name: "Circle", value: "circle", icon: <CircleIcon /> },
    { name: "Arrow", value: "arrow", icon: <MoveRight />},
    { name: "Pencil", value: "pencil", icon: <Pencil /> },
    { name: "Text", value: "text", icon: <Type />},
    { name: "Line", value: "line", icon: <Minus /> },
    { name : "Eraser", value : "eraser", icon: <EraserIcon/>}

]

function Toolbar() {
    const { rootStore } = useRootStore();
    const { toolManager } = rootStore
    return (
        <div className="bg-accent p-2 flex flex-row gap-2 rounded-md">
            {tools.map(({name, value, icon}) => (
            <Button key={name} size={"icon-lg"} variant={ toolManager.activeTool == value ? "default" : "ghost"} className="hover:ring-1" onClick={() => toolManager.setActiveTool(value)}>{icon}</Button>
            ))}
        </div>
    )
}

export default observer(Toolbar)