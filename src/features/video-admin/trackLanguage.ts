export interface TrackLanguageGuess {
  language: string
  label: string
}

/** Track labels use each language's own name, as viewers will see them in the player menu. */
const LANGUAGES: Record<string, string> = {
  es: 'Español',
  en: 'English',
  fr: 'Français',
  pt: 'Português',
  de: 'Deutsch',
  it: 'Italiano',
}

const LANGUAGE_ALIASES: Record<string, string> = {
  spa: 'es',
  spanish: 'es',
  espanol: 'es',
  español: 'es',
  castellano: 'es',
  eng: 'en',
  english: 'en',
  ingles: 'en',
  inglés: 'en',
  fra: 'fr',
  fre: 'fr',
  french: 'fr',
  frances: 'fr',
  francés: 'fr',
  por: 'pt',
  portuguese: 'pt',
  portugues: 'pt',
  portugués: 'pt',
  deu: 'de',
  ger: 'de',
  german: 'de',
  aleman: 'de',
  alemán: 'de',
  ita: 'it',
  italian: 'it',
  italiano: 'it',
}

function languageForToken(token: string): string | null {
  if (token in LANGUAGES) return token
  return LANGUAGE_ALIASES[token] ?? null
}

/**
 * Guesses a track's language from its file name (`es.vtt`, `intro_en.mp3`, `es-ES.vtt`).
 * Tokens closest to the extension win; returns null when nothing matches.
 */
export function guessTrackLanguage(fileName: string): TrackLanguageGuess | null {
  const baseName = fileName.toLowerCase().replace(/\.[^.]+$/, '')
  const tokens = baseName.split(/[\s._-]+/).filter(Boolean).reverse()
  for (const token of tokens) {
    const language = languageForToken(token)
    if (language) return { language, label: LANGUAGES[language] }
  }
  return null
}
