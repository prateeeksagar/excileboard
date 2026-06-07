export function getCircleEraserCursor(size: number = 20): string {
  const half = size / 2;
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg"
         width="${size}" height="${size}"
         viewBox="0 0 ${size} ${size}">
      <circle
        cx="${half}"
        cy="${half}"
        r="${half - 2}"
        fill="rgba(255,255,255,0.8)"
        stroke="#000000"
        stroke-width="1.5"
        stroke-dasharray="3,2"
      />
    </svg>
  `;

  const encoded = encodeURIComponent(svg);
  // ✅ Hotspot at center of circle
  return `url("data:image/svg+xml,${encoded}") ${half} ${half}, crosshair`;
}