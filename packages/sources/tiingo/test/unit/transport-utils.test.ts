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
    it('alternates between primary and secondary in 3-attempt cycles', () => {
      const primary = 'primary'
      const secondary = 'secondary'
      const urlPath = 'path'

      // First cycle: 3 primary attempts
      expect(
        wsSelectUrl(primary, secondary, urlPath, { streamHandlerInvocationsWithNoConnection: 1 }),
      ).toEqual(`${primary}/${urlPath}`)
      expect(
        wsSelectUrl(primary, secondary, urlPath, { streamHandlerInvocationsWithNoConnection: 2 }),
      ).toEqual(`${primary}/${urlPath}`)
      expect(
        wsSelectUrl(primary, secondary, urlPath, { streamHandlerInvocationsWithNoConnection: 3 }),
      ).toEqual(`${primary}/${urlPath}`)

      // First cycle: 3 secondary attempts
      expect(
        wsSelectUrl(primary, secondary, urlPath, { streamHandlerInvocationsWithNoConnection: 4 }),
      ).toEqual(`${secondary}/${urlPath}`)
      expect(
        wsSelectUrl(primary, secondary, urlPath, { streamHandlerInvocationsWithNoConnection: 5 }),
      ).toEqual(`${secondary}/${urlPath}`)
      expect(
        wsSelectUrl(primary, secondary, urlPath, { streamHandlerInvocationsWithNoConnection: 6 }),
      ).toEqual(`${secondary}/${urlPath}`)

      // Second cycle: back to primary
      expect(
        wsSelectUrl(primary, secondary, urlPath, { streamHandlerInvocationsWithNoConnection: 7 }),
      ).toEqual(`${primary}/${urlPath}`)
    })
  })
})
