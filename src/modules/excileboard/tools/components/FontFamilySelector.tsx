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
import { Type } from "lucide-react";

const FONT_FAMILY_OPTIONS = [
  { value: "Excalifont, sans-serif",     type: "normal"    },
  { value: "'Virgil', cursive",          type: "handdrawn" },
  { value: "'Cascadia Code', monospace", type: "code"      },
] as const;

function FontFamilySelector() {
  const { rootStore } = useRootStore();
  const styleManager = rootStore.styleManager;

  const handleFontFamily = (font: string) => {
    styleManager.setFontFamily(font);
  };

  return (
<div className="flex flex-col gap-2 items-start justify-start p-1">
      <span className="text-xs text-start w-full">Font Family</span>
      <div className="flex flex-row gap-2">
        <ButtonGroup>
          {FONT_FAMILY_OPTIONS.map(({ value, type }) => (
            <Button
              key={`font-${type}`}
              onClick={() => handleFontFamily(value)}
              variant={value === styleManager.fontFamily ? "default" : "outline"}
              size="icon-lg"
              style={{ fontFamily: value }} 
              title={type}
            >
              Aa
            </Button>
          ))}
        </ButtonGroup>
      </div>
    </div>
  );
}

export default observer(FontFamilySelector);
