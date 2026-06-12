import { Slider } from "@/components/ui/slider";
import { useRootStore } from "@/store/RootStore";
import { observer } from "mobx-react-lite";

function OpacitySelector() {
  const { rootStore } = useRootStore();
  const styleManager = rootStore.styleManager;

  const handleOpacity = (val: number[]) => {
    console.log("opa", val[0]);
    styleManager.setOpacity(val[0] / 100);
  };

  return (
    <div className="flex flex-col gap-2 items-start justify-start p-1">
      <div className="flex flex-row w-full justify-between items-center">
        <span className="text-xs text-start">Opacity</span>
        <span className="text-xs text-start">
          {Math.trunc(styleManager.opacity * 100)}
        </span>
      </div>
      <Slider
        max={100}
        step={1}
        value={[styleManager.opacity * 100]}
        onValueChange={handleOpacity}
      />
    </div>
  );
}

export default observer(OpacitySelector);
