import { CensorList } from '../../src/lib/config/logging'
import { censor, censorLog } from '../../src/lib/modules/logger'
import { buildCensorList } from '../../src/lib/util'

describe('Logger', () => {
  describe('censor', () => {
    beforeAll(async () => {
      process.env['API_KEY'] = 'mock-api-key'
      buildCensorList()
    })
    it('returns REDACTED if provided string is not a URL', () => {
      expect(censor('asdf')).toBe('[REDACTED]')
    })

    it('properly redacts sensitive params', () => {
      expect(censor('http://test.com/endpoint?cookie=asdfasdfasdf&randomParam=1234')).toBe(
        'http://test.com/endpoint?cookie=REDACTED&randomParam=1234',
      )
    })

    it('properly redacts sensitive param (client)', () => {
      expect(censor('http://test.com/endpoint?client=user:secret')).toBe(
        'http://test.com/endpoint?client=REDACTED',
      )
    })
    it('properly builds censor list', () => {
      const censorList = CensorList.getAll()
      expect(censorList[0]).toEqual({ key: 'API_KEY', value: RegExp('mock\\-api\\-key', 'gi') })
    })
    it('properly redacts API_KEY (string)', () => {
      const redacted = censorLog('mock-api-key', CensorList.getAll())
      expect(redacted).toEqual('[API_KEY REDACTED]')
    })
    it('properly redacts API_KEY (string with added text)', () => {
      const redacted = censorLog('Bearer mock-api-key', CensorList.getAll())
      expect(redacted).toEqual('Bearer [API_KEY REDACTED]')
    })
    it('properly redacts API_KEY (object)', () => {
      const redacted = censorLog({ apiKey: 'mock-api-key' }, CensorList.getAll())
      expect(redacted).toEqual({ apiKey: '[API_KEY REDACTED]' })
    })
    it('properly redacts API_KEY (object with added text)', () => {
      const redacted = censorLog({ apiKey: 'Bearer mock-api-key' }, CensorList.getAll())
      expect(redacted).toEqual({ apiKey: 'Bearer [API_KEY REDACTED]' })
    })
    it('properly redacts API_KEY (multiple nested values)', () => {
      const redacted = censorLog(
        { apiKey: 'mock-api-key', config: { headers: { auth: 'mock-api-key' } } },
        CensorList.getAll(),
      )
      expect(redacted).toEqual({
        apiKey: '[API_KEY REDACTED]',
        config: { headers: { auth: '[API_KEY REDACTED]' } },
      })
    })
  })
})
