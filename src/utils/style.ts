export function getTransparentShadeClass(shade: string): string {
  return shade === "transparent" ? "checkerstyle" : "";
}

export function getTransparentShadeStyle(shade: string): React.CSSProperties {
  return shade === "transparent" ? {} : { backgroundColor: shade };
}