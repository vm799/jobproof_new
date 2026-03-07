import { describe, it, expect } from 'vitest'
import { escapeHtml } from '@/lib/sanitize'

describe('escapeHtml', () => {
  it('escapes ampersand', () => {
    expect(escapeHtml('a & b')).toBe('a &amp; b')
  })

  it('escapes less-than', () => {
    expect(escapeHtml('a < b')).toBe('a &lt; b')
  })

  it('escapes greater-than', () => {
    expect(escapeHtml('a > b')).toBe('a &gt; b')
  })

  it('escapes double quotes', () => {
    expect(escapeHtml('a "b" c')).toBe('a &quot;b&quot; c')
  })

  it('escapes single quotes', () => {
    expect(escapeHtml("a 'b' c")).toBe('a &#39;b&#39; c')
  })

  it('returns empty string for empty input', () => {
    expect(escapeHtml('')).toBe('')
  })

  it('returns string unchanged when no special chars', () => {
    expect(escapeHtml('hello world 123')).toBe('hello world 123')
  })

  it('escapes multiple special chars in one string', () => {
    expect(escapeHtml('<div class="a">&</div>')).toBe(
      '&lt;div class=&quot;a&quot;&gt;&amp;&lt;/div&gt;'
    )
  })

  it('escapes nested HTML tags', () => {
    expect(escapeHtml('<script>alert("xss")</script>')).toBe(
      '&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;'
    )
  })

  it('escapes all five chars together', () => {
    expect(escapeHtml('&<>"\'')).toBe('&amp;&lt;&gt;&quot;&#39;')
  })
})
