import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
import { useRootStore } from "@/store/RootStore";
import { Minus } from "lucide-react";
import { observer } from "mobx-react-lite";

const STROKE_WIDTH: number[] = [2, 4, 6, 8];

function StrokeWidthSelector() {
  const { rootStore } = useRootStore();
  const styleManager = rootStore.styleManager;

  const handleStrokWidth = (width: number) => {
    styleManager.setStrokeWidth(width);
  };

  return (
    <div className="flex flex-col gap-2 items-start justify-start p-1">
      <span className="text-xs text-start w-full">Stroke width</span>
      <div className="flex flex-row gap-2">
        <ButtonGroup>
          {STROKE_WIDTH.map((val) => (
            <Button
              onClick={() => handleStrokWidth(val)}
              key={`stroke-${val}`}
              variant={val == styleManager.strokeWidth ? "default" : "outline"}
              size={"icon-lg"}
            >
              <Minus strokeWidth={val} />
            </Button>
          ))}
        </ButtonGroup>
      </div>
    </div>
  );
}

export default observer(StrokeWidthSelector);
