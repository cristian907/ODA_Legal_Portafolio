import { describe, expect, it } from 'vitest'
import { cueToPlainText } from './cueText'

describe('cueToPlainText', () => {
  it('keeps plain text and line breaks', () => {
    expect(cueToPlainText('Hola\nmundo')).toBe('Hola\nmundo')
  })

  it('removes VTT markup tags including voice, class and timestamp tags', () => {
    expect(cueToPlainText('<v Ana>Hola</v> <i>a</i> <c.yellow>todos</c><00:00:01.500>!')).toBe('Hola a todos!')
  })

  it('decodes the VTT character entities', () => {
    expect(cueToPlainText('a &lt; b &amp;&amp; c &gt; d&nbsp;e')).toBe('a < b && c > d e')
  })

  it('never turns escaped markup back into tags that get stripped', () => {
    expect(cueToPlainText('&lt;script&gt;alert(1)&lt;/script&gt;')).toBe('<script>alert(1)</script>')
  })

  it('normalizes CRLF and trims surrounding whitespace', () => {
    expect(cueToPlainText('  uno\r\ndos  ')).toBe('uno\ndos')
  })
})
