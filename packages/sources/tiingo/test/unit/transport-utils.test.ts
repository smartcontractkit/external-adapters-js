import { wsMessageContent, wsSelectUrl } from '../../src/transport/utils'

jest.mock('../../src/config', () => ({
  config: {
    settings: {
      WS_URL_PRIMARY_ATTEMPTS: 1,
      WS_URL_SECONDARY_ATTEMPTS: 1,
    },
  },
}))

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

    it('alternates primary and secondary from config (1:1 when both are 1)', () => {
      expect(wsSelectUrl(primary, secondary, urlPath, params(1))).toEqual(`${primary}/${urlPath}`)
      expect(wsSelectUrl(primary, secondary, urlPath, params(2))).toEqual(`${secondary}/${urlPath}`)
      expect(wsSelectUrl(primary, secondary, urlPath, params(3))).toEqual(`${primary}/${urlPath}`)
      expect(wsSelectUrl(primary, secondary, urlPath, params(4))).toEqual(`${secondary}/${urlPath}`)
      expect(wsSelectUrl(primary, secondary, urlPath, params(5))).toEqual(`${primary}/${urlPath}`)
      expect(wsSelectUrl(primary, secondary, urlPath, params(6))).toEqual(`${secondary}/${urlPath}`)
    })
  })
})
