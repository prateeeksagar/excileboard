import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { useRootStore } from "@/store/RootStore";
import { observer } from "mobx-react-lite";

const InstantColorOptions = ["#1e1e1e", "#e03131", "#2f9e44", "#1971c2", "#f08c00"];


function StrokeSelector() {
    const { rootStore } = useRootStore()
    const { styleManager, selectionManager } = rootStore

    const  handleStrokeSelection = (color: string) => {
        if(selectionManager.hasSelection) {
            styleManager.setStrokeColor(color);
        } else {
            styleManager.updateStyle("strokeColor", color);
        }
    }
    

    return(
        <div className="flex flex-col gap-1">
            <span className="text-xs ">Stroke</span>
            <div className="flex flex-row gap-2">
            <div className="flex flex-row gap-0.5">
                {InstantColorOptions.map(color => (
                    <Button key={color} size={"icon-sm"} style={{ backgroundColor: color}} className={cn(color == styleManager.strokeColor && "ring ring-primary ring-offset-1")} onClick={() => handleStrokeSelection(color)}></Button>
                ))}

            </div>
                <Separator orientation="vertical" />
                <Button size={"icon-sm"} style={{ backgroundColor: "#e03131"}}></Button>
            </div>
        </div>
    )
}

export default observer(StrokeSelector)