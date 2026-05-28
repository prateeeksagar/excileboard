import { observer } from "mobx-react-lite";
import { Button } from "../../components/ui/button";
import { useRootStore } from "../../store/RootStore";
import WhiteBoard from "./canvas/components/WhiteBoard";
import ViewPortControls from "./ui/ViewPortControls";

function ExcileDraw() {
    const { rootStore } = useRootStore();
    const { canvasManager } = rootStore;
    return (
        <div className="relative w-screen h-screen overflow-hidden">
            <WhiteBoard/>
            <div className="flex flex-row gap-2 absolute bottom-4 left-10 z-10">
                <Button onClick={() => canvasManager.addRectangle()}>
                    Add Rectangle
                </Button>
                <ViewPortControls/>
            </div>
        </div>
    );
}

export default observer(ExcileDraw);
