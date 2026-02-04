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
    const primary = 'primary'
    const secondary = 'secondary'
    const urlPath = 'path'
    const params = (n: number) => ({ streamHandlerInvocationsWithNoConnection: n })

    it('defaults to alternating primary and secondary (1:1)', () => {
      expect(wsSelectUrl(primary, secondary, urlPath, params(1))).toEqual(`${primary}/${urlPath}`)
      expect(wsSelectUrl(primary, secondary, urlPath, params(2))).toEqual(`${secondary}/${urlPath}`)
      expect(wsSelectUrl(primary, secondary, urlPath, params(3))).toEqual(`${primary}/${urlPath}`)
      expect(wsSelectUrl(primary, secondary, urlPath, params(4))).toEqual(`${secondary}/${urlPath}`)
      expect(wsSelectUrl(primary, secondary, urlPath, params(5))).toEqual(`${primary}/${urlPath}`)
      expect(wsSelectUrl(primary, secondary, urlPath, params(6))).toEqual(`${secondary}/${urlPath}`)
    })

    it('uses custom primary/secondary attempts when options provided', () => {
      const options = { primaryAttempts: 3, secondaryAttempts: 3 }

      // First cycle: 3 primary attempts
      expect(wsSelectUrl(primary, secondary, urlPath, params(1), options)).toEqual(
        `${primary}/${urlPath}`,
      )
      expect(wsSelectUrl(primary, secondary, urlPath, params(2), options)).toEqual(
        `${primary}/${urlPath}`,
      )
      expect(wsSelectUrl(primary, secondary, urlPath, params(3), options)).toEqual(
        `${primary}/${urlPath}`,
      )

      // First cycle: 3 secondary attempts
      expect(wsSelectUrl(primary, secondary, urlPath, params(4), options)).toEqual(
        `${secondary}/${urlPath}`,
      )
      expect(wsSelectUrl(primary, secondary, urlPath, params(5), options)).toEqual(
        `${secondary}/${urlPath}`,
      )
      expect(wsSelectUrl(primary, secondary, urlPath, params(6), options)).toEqual(
        `${secondary}/${urlPath}`,
      )

      // Second cycle: back to primary
      expect(wsSelectUrl(primary, secondary, urlPath, params(7), options)).toEqual(
        `${primary}/${urlPath}`,
      )
    })
  })
})
