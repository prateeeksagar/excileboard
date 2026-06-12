import { ScrollArea } from "@/components/ui/scroll-area";
import { observer } from "mobx-react-lite";
import StrokeSelector from "../tools/components/StrokeSelector";
import BackgroundFillSelector from "../tools/components/BackgroundFillSelector";
import StrokWidthSelector from "../tools/components/StrokWidthSelector";
import StrokeStyleSelector from "../tools/components/StrokeStyleSelector";
import CornorRadiusSelector from "../tools/components/CornorRadiusSelector";
import OpacitySelector from "../tools/components/OpacitySelector";
import { useRootStore } from "@/store/RootStore";
import FontSizeSelector from "../tools/components/FontSizeSelector";
import FontFamilySelector from "../tools/components/FontFamilySelector";
import TextAlignSelector from "../tools/components/TextAlignSelector";

function ToolControls() {
  const { rootStore } = useRootStore();
  const sidebarAccess = rootStore.toolManager.sidebarToolControlAccess();
  return (
    <>
      {!sidebarAccess.isHandActive ? (
        <ScrollArea className="w-50 h-[80vh] rounded-md border shadow-sm p-2">
          {sidebarAccess.showStroke && <StrokeSelector />}
          {sidebarAccess.showBackground && <BackgroundFillSelector />}
          {sidebarAccess.showStrokeWidth && <StrokWidthSelector />}
          {sidebarAccess.showStrokeStyle && <StrokeStyleSelector />}
          {sidebarAccess.showEdges && <CornorRadiusSelector />}
          {sidebarAccess.showOpacity && <OpacitySelector />}
          {sidebarAccess.showFontSize && <FontSizeSelector/>}
          {sidebarAccess.showFontFamily && <FontFamilySelector/>}
          {sidebarAccess.showTextAlign && <TextAlignSelector/>}
        </ScrollArea>
      ) : null}
    </>
  );
}

export default observer(ToolControls);
