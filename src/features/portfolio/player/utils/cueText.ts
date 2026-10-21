const VTT_TAG_PATTERN = /<[^>]*>/g
const VTT_ENTITY_PATTERN = /&(amp|lt|gt|nbsp|lrm|rlm);/g

const VTT_ENTITIES: Record<string, string> = {
  amp: '&',
  lt: '<',
  gt: '>',
  nbsp: ' ',
  lrm: '‎',
  rlm: '‏',
}

/** Turns raw WebVTT cue text into plain text meant to be rendered as text, never as HTML. */
export function cueToPlainText(rawText: string): string {
  return rawText
    .replace(/\r\n?/g, '\n')
    .replace(VTT_TAG_PATTERN, '')
    .replace(VTT_ENTITY_PATTERN, (_, name: string) => VTT_ENTITIES[name])
    .trim()
}
