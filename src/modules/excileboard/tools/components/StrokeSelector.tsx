import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { useRootStore } from "@/store/RootStore";
import { observer } from "mobx-react-lite";
import {
  Popover,
  PopoverContent,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/ui/popover";
import type { ColorPalette } from "../../types/style";
import { getTransparentShadeClass, getTransparentShadeStyle } from "@/utils/style";

const InstantColorOptions = [
  "#1e1e1e",
  "#e03131",
  "#2f9e44",
  "#1971c2",
  "#f08c00",
];

export const COLOR_PALETTE: ColorPalette = {
  transparent: ["transparent"],
  black: ["#666666", "#4d4d4d", "#333333", "#1a1a1a", "#000000"],
  white: ["#ffffff", "#f5f5f5", "#e8e8e8", "#d4d4d4", "#bfbfbf"],
  gray: ["#f5f5f5", "#d9d9d9", "#bfbfbf", "#8c8c8c", "#404040"],
  red: ["#FFE5E5", "#FFB3B3", "#FF8080", "#FF4D4D", "#FF0000"],
  pink: ["#FFE5F1", "#FFB3D9", "#FF80C0", "#FF4DA8", "#FF0090"],
  grape: ["#F3E5FF", "#D9B3FF", "#BF80FF", "#A64DFF", "#8000FF"],
  violet: ["#EDE5FF", "#C9B3FF", "#A480FF", "#804DFF", "#5B00FF"],
  indigo: ["#E5E8FF", "#B3BAFF", "#808CFF", "#4D5EFF", "#0019FF"],
  blue: ["#E5F0FF", "#B3D4FF", "#80B8FF", "#4D9BFF", "#0066FF"],
  cyan: ["#E5FAFF", "#B3F0FF", "#80E6FF", "#4DDBFF", "#00CCFF"],
  teal: ["#E5FFF8", "#B3FFE8", "#80FFD9", "#4DFFC9", "#00FFB3"],
  green: ["#E5FFE5", "#B3FFB3", "#80FF80", "#4DFF4D", "#00CC00"],
  lime: ["#F2FFE5", "#D9FFB3", "#BFFF80", "#A6FF4D", "#80FF00"],
  yellow: ["#FFFDE5", "#FFF7B3", "#FFF180", "#FFEB4D", "#FFE000"],
  orange: ["#FFF3E5", "#FFD9B3", "#FFBF80", "#FFA64D", "#FF8000"],
};

function StrokeSelector() {
  const { rootStore } = useRootStore();
  const { styleManager } = rootStore;

  const handleStrokeSelection = (color: string) => {
      styleManager.setStrokeColor(color);
  };

  return (
    <div className="flex flex-col gap-2 items-start justify-start p-1">
      <span className="text-xs text-start w-full">Stroke</span>
      <div className="flex flex-row gap-2">
        <div className="flex flex-row gap-0.5">
          {InstantColorOptions.map((color) => (
            <Button
              key={color}
              size={"icon-sm"}
              style={getTransparentShadeStyle(color)}
            className={cn(
                color == styleManager.strokeColor &&
                "ring ring-primary ring-offset-1",
                getTransparentShadeClass(color),
            )}
              onClick={() => handleStrokeSelection(color)}
            ></Button>
          ))}
        </div>
        <Separator orientation="vertical" />

        <Popover>
          <PopoverTrigger asChild>
            <Button
              size={"icon-sm"}
              style={getTransparentShadeStyle(styleManager.strokeColor)}
              className={cn(getTransparentShadeClass(styleManager.strokeColor))}
            ></Button>
          </PopoverTrigger>
          <PopoverContent
            align="start"
            side="right"
            sideOffset={25}
            className="w-full"
          >
            <PopoverHeader>
              <PopoverTitle>Colors</PopoverTitle>
              <div className="grid grid-cols-1 gap-1 w-fit">
                {Object.entries(COLOR_PALETTE).map(([name, shades]) => (
                  <div key={name} className="grid grid-flow-col gap-1">
                    {shades.map((shade, index) => (
                      <Button
                        key={`${shade}-${index}`}
                        size={"icon-sm"}
                        style={getTransparentShadeStyle(shade)}
                        className={cn(
                          shade == styleManager.strokeColor &&
                            "ring ring-primary ring-offset-1",
                          getTransparentShadeClass(shade),
                        )}
                        onClick={() => handleStrokeSelection(shade)}
                      ></Button>
                    ))}
                  </div>
                ))}
              </div>
            </PopoverHeader>
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
}

export default observer(StrokeSelector);
