/** Splits picked files into those with an allowed extension and the rest. */
export function splitByExtension(
  files: File[],
  extensions: readonly string[],
): { accepted: File[]; rejected: File[] } {
  const accepted: File[] = []
  const rejected: File[] = []
  for (const file of files) {
    const name = file.name.toLowerCase()
    if (extensions.some((extension) => name.endsWith(extension))) accepted.push(file)
    else rejected.push(file)
  }
  return { accepted, rejected }
}
