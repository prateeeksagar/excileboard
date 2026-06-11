import { ScrollArea } from "@/components/ui/scroll-area";
import { observer } from "mobx-react-lite";
import StrokeSelector from "../tools/components/StrokeSelector";
import BackgroundFillSelector from "../tools/components/BackgroundFillSelector";
import StrokWidthSelector from "../tools/components/StrokWidthSelector";
import StrokeStyleSelector from "../tools/components/StrokeStyleSelector";

function ToolControls() {
    return (
        <ScrollArea className="w-50 h-[80vh] rounded-md border shadow-sm p-2">
           <StrokeSelector/>
           <BackgroundFillSelector/>
           <StrokWidthSelector/>
           <StrokeStyleSelector/>
        </ScrollArea>
    )
}

export default observer(ToolControls)