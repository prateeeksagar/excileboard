import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
import { useRootStore } from "@/store/RootStore";
import { observer } from "mobx-react-lite";

const FONT_SIZES: {
  value: number;
  label: String;
  type: string
}[] = [
  { value: 20, label: "S",type: "small" },
  { value: 30, label: "M",type: "medium"},
  { value: 40, label: "L",type: "large"},
  { value: 50, label: "XL", type: "extra large", },
];

function FontSizeSelector() {
  const { rootStore } = useRootStore();
  const styleManager = rootStore.styleManager;

  const handleFontSize = (size: number) => {
    styleManager.setFontSize(size);
  };

  return (
    <div className="flex flex-col gap-2 items-start justify-start p-1">
      <span className="text-xs text-start w-full">Font Size</span>
      <div className="flex flex-row gap-2">
        <ButtonGroup>
          {FONT_SIZES.map(({ label, value,type }) => (
            <Button
              onClick={() => handleFontSize(value)}
              key={`stroke-${type}`}
              variant={
                value === styleManager.fontSize ? "default" : "outline"
              }
              size={"icon-lg"}
            >
              {label}
            </Button>
          ))}
        </ButtonGroup>
      </div>
    </div>
  );
}

export default observer(FontSizeSelector);
