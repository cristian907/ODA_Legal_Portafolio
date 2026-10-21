/** Horizontal center for a tooltip following the pointer without overflowing its container. */
export function clampTooltipCenter(pointerX: number, containerWidth: number, tooltipWidth: number): number {
  const halfWidth = tooltipWidth / 2
  if (tooltipWidth >= containerWidth) return containerWidth / 2
  return Math.min(containerWidth - halfWidth, Math.max(halfWidth, pointerX))
}
