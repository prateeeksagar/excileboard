import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
import { useRootStore } from "@/store/RootStore";
import type { StrokeStyle } from "../../types/style";
import { observer } from "mobx-react-lite";
import {
  DashedLineIcon,
  DottedLineIcon,
  SolidLineIcon,
} from "@/components/icons";

const STROKE_STYLE: {
  value: StrokeStyle;
  label: String;
  icon: React.FC<{ size?: number }>;
}[] = [
  { value: "solid", label: "Solid", icon: SolidLineIcon },
  { value: "dashed", label: "Dashed", icon: DashedLineIcon },
  { value: "dotted", label: "Dotted", icon: DottedLineIcon },
];

function StrokeStyleSelector() {
  const { rootStore } = useRootStore();
  const styleManager = rootStore.styleManager;

  const handleStrokeStyle = (style: StrokeStyle) => {
    styleManager.setStrokStyle(style);
  };

  return (
    <div className="flex flex-col gap-2 items-start justify-start p-1">
      <span className="text-xs text-start w-full">Stroke style</span>
      <div className="flex flex-row gap-2">
        <ButtonGroup>
          {STROKE_STYLE.map(({ label, value, icon: Icon }) => (
            <Button
              onClick={() => handleStrokeStyle(value)}
              key={`stroke-${label}`}
              variant={
                value == styleManager.strokeStyle ? "default" : "outline"
              }
              size={"icon-sm"}
            >
              {<Icon size={10} />}
            </Button>
          ))}
        </ButtonGroup>
      </div>
    </div>
  );
}

export default observer(StrokeStyleSelector);
