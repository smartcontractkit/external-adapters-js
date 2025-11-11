import { wsMessageContent, wsSelectUrl } from '../../src/transport/utils'

jest.mock('@chainlink/external-adapter-framework/util', () => ({
  ...jest.requireActual('@chainlink/external-adapter-framework/util'),
  makeLogger: jest.fn(() => ({
    trace: jest.fn(),
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    fatal: jest.fn(),
  })),
}))

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

  describe('wsSelectUrl', () => {
    it('returns secondary when connectionAttempts is 6th in cycle, primary otherwise', () => {
      const primary = 'primary'
      const secondary = 'secondary'
      const urlPath = 'path'
      const expectPrimary = wsSelectUrl(primary, secondary, urlPath, {
        streamHandlerInvocationsWithNoConnection: 1,
      })
      expect(expectPrimary).toEqual(`${primary}/${urlPath}`)

      const expectSecondary = wsSelectUrl(primary, secondary, urlPath, {
        streamHandlerInvocationsWithNoConnection: 6,
      })
      expect(expectSecondary).toEqual(`${secondary}/${urlPath}`)
    })
  })
})
