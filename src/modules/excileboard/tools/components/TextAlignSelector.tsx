import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
import { useRootStore } from "@/store/RootStore";
import { TextAlignCenter, TextAlignEnd, TextAlignStart } from "lucide-react";
import { observer } from "mobx-react-lite";

const TEXT_ALIGN_OPTIONS: {
  value: "left" | "right" | "center";
  label: String;
  icon: React.FC<{size?: number}>
}[] = [
  { value: "left", label: "Left",icon: TextAlignStart },
  { value: "center", label: "Center",icon: TextAlignCenter},
  { value: "right", label: "Right",icon: TextAlignEnd},
]; 

function TextAlignSelector() {
  const { rootStore } = useRootStore();
  const styleManager = rootStore.styleManager;

  const handleTextAlign = (align: "left" | 'center' | "right") => {
    styleManager.setTextAlign(align);
  };

  return (
    <div className="flex flex-col gap-2 items-start justify-start p-1">
      <span className="text-xs text-start w-full">Text Align</span>
      <div className="flex flex-row gap-2">
        <ButtonGroup>
          {TEXT_ALIGN_OPTIONS.map(({ label, value,icon: Icon }) => (
            <Button
              onClick={() => handleTextAlign(value)}
              key={`stroke-${label}`}
              variant={
                value === styleManager.textAlign ? "default" : "outline"
              }
              size={"icon-lg"}
            >
              <Icon/>
            </Button>
          ))}
        </ButtonGroup>
      </div>
    </div>
  );
}

export default observer(TextAlignSelector);
