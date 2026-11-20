import { wsMessageContent } from '../../src/transport/utils'

describe('transport-utils', () => {
  describe('wsMessageContent', () => {
    it('returns a lowercased base/quote pair', () => {
      const response = wsMessageContent('subscribe', 'test-api-key', 1234, 'BaSe', 'quoTE')
      expect(response.eventData.tickers[0]).toEqual('base/quote')
    })
    it('with skipSlash skips slash', () => {
      const response = wsMessageContent('subscribe', 'test-api-key', 1234, 'BaSe', 'quoTE', true)
      expect(response.eventData.tickers[0]).toEqual('basequote')
    })
  })
})
