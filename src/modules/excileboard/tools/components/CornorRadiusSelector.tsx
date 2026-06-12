import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
import { useRootStore } from "@/store/RootStore";
import { Square, SquareRoundCorner } from "lucide-react";
import { observer } from "mobx-react-lite";

const RADIUS: {label: string, radius:number, icon:React.FC<{ size?: number }> }[] = [
    {label: "Sharp", radius: 0, icon:Square },
    { label: "round", radius: 12, icon: SquareRoundCorner }
];

function CornorRadiusSelector() {
  const { rootStore } = useRootStore();
  const styleManager = rootStore.styleManager;

  const handleCornorRadius = (radius: number) => {
    styleManager.setCornorRadius(radius);
  };

  return (
    <div className="flex flex-col gap-2 items-start justify-start p-1">
      <span className="text-xs text-start w-full">Edges</span>
      <div className="flex flex-row gap-2">
        <ButtonGroup>
          {RADIUS.map(({ label, radius, icon: Icon}) => (
            <Button
              onClick={() => handleCornorRadius(radius)}
              key={`radius-${label}`}
              variant={radius === styleManager.cornorRadius ? "default" : "outline"}
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

export default observer(CornorRadiusSelector);
