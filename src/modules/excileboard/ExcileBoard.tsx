import { observer } from "mobx-react-lite";
import WhiteBoard from "./canvas/components/WhiteBoard";
import ViewPortControls from "./ui/ViewPortControls";
import ToolbarMenu from "./ui/ToolbarMenu";
import ToolControls from "./ui/ToolControls";

function ExcileDraw() {
    return (
        <div className="relative w-screen h-screen overflow-hidden">
            <WhiteBoard/>
            <div className="flex flex-row gap-2 absolute bottom-4 left-10 z-10">
                <ViewPortControls/>
            </div>
            <div className="flex flex-col gap-2 absolute top-15 left-8">
                <ToolControls/>
            </div>
            <div className="flex flex-row gap-2 absolute top-8 left-1/2 -translate-x-1/2 -translate-y-1/2">
                <ToolbarMenu/>
            </div>
        </div>
    );
}

export default observer(ExcileDraw);
