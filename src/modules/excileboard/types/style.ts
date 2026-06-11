export type ColorShades = string[];

export type ColorName =
  | "black"
  | "white"
  | "gray"
  | "red"
  | "pink"
  | "grape"
  | "violet"
  | "indigo"
  | "blue"
  | "cyan"
  | "teal"
  | "green"
  | "lime"
  | "yellow"
  | "orange"
  | "transparent";

export type ColorPalette = Record<ColorName, ColorShades>

export type StrokeStyle = "solid" | "dashed" | "dotted";
