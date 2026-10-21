import { describe, expect, it } from 'vitest'
import { guessTrackLanguage } from './trackLanguage'

describe('guessTrackLanguage', () => {
  it.each([
    ['es.vtt', 'es', 'Español'],
    ['EN.vtt', 'en', 'English'],
    ['intro_en.vtt', 'en', 'English'],
    ['intro-fr.mp3', 'fr', 'Français'],
    ['video.pt.vtt', 'pt', 'Português'],
    ['audio spanish.m4a', 'es', 'Español'],
    ['narracion_espanol.wav', 'es', 'Español'],
    ['es-ES.vtt', 'es', 'Español'],
    ['english_track.ogg', 'en', 'English'],
  ])('guesses %s as %s', (fileName, language, label) => {
    expect(guessTrackLanguage(fileName)).toEqual({ language, label })
  })

  it('prefers the token closest to the extension', () => {
    expect(guessTrackLanguage('es_to_en.vtt')).toEqual({ language: 'en', label: 'English' })
  })

  it('returns null when no language token is present', () => {
    expect(guessTrackLanguage('narration.mp3')).toBeNull()
    expect(guessTrackLanguage('')).toBeNull()
  })

  it('does not match language codes inside longer words', () => {
    expect(guessTrackLanguage('test.vtt')).toBeNull()
  })
})
