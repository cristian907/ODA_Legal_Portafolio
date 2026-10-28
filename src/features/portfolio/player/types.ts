/** One selectable entry of a settings submenu; `value` is the track index (-1 means "off"). */
export interface PlayerMenuOption {
  value: number
  label: string
  hint?: string
}

export const SUBTITLES_OFF = -1
