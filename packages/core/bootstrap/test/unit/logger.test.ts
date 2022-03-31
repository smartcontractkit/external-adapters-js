import { censor } from '../../src/lib/modules'

describe('Logger', () => {
  describe('censor', () => {
    it('returns REDACTED if provided string is not a URL', () => {
      expect(censor('asdf')).toBe('[REDACTED]')
    })

    it('properly redacts sensitive params', () => {
      expect(censor('http://test.com/endpoint?cookie=asdfasdfasdf&randomParam=1234')).toBe(
        'http://test.com/endpoint?cookie=REDACTED&randomParam=1234',
      )
    })
  })
})
