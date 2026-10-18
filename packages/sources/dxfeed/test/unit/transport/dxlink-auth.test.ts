import { LoggerFactoryProvider } from '@chainlink/external-adapter-framework/util'
import { validateWsApiEndpoint } from '../../../src/config'
import { transport as priceWsTransport } from '../../../src/transport/price-ws'
import { transport as stockQuotesTransport } from '../../../src/transport/stock-quotes'
import { dxLinkConnectionOptions, dxLinkHandshakeMessages } from '../../../src/transport/ws'

// The transport modules log via the framework logger, which needs a factory set
LoggerFactoryProvider.set()

/**
 * Plan round1-transport-basic-auth proving test (spec
 * data_source_authentication.usage.handshake_header: "Authorization: Basic
 * <base64(API_USERNAME:API_PASSWORD)>" — exception basic-auth-not-oauth): the
 * framework WebSocketTransport options() hook carries the Basic header on the
 * handshake, credentials never ride the URL, and no AUTH message exists
 * anywhere in the handshake.
 */
const CREDENTIALS = { API_USERNAME: 'dxfeed-user', API_PASSWORD: 'dxfeed-pass' }
const EXPECTED_HEADER = `Basic ${Buffer.from('dxfeed-user:dxfeed-pass').toString('base64')}`

describe('Basic Authorization handshake header (spec data_source_authentication.usage.handshake_header)', () => {
  it('dxLinkConnectionOptions returns { headers: { Authorization: Basic base64(user:pass) } }', () => {
    expect(dxLinkConnectionOptions(CREDENTIALS)).toEqual({
      headers: { Authorization: EXPECTED_HEADER },
    })
  })

  it('the real transports options() hook returns exactly that header object', () => {
    for (const transport of [stockQuotesTransport, priceWsTransport]) {
      expect((transport as any).config.options({ adapterSettings: CREDENTIALS })).toEqual({
        headers: { Authorization: EXPECTED_HEADER },
      })
    }
  })

  it('connects to WS_API_ENDPOINT verbatim — credentials ride the header, never the URL', () => {
    const transportConfig = (stockQuotesTransport as any).config
    const url = transportConfig.url({
      adapterSettings: { WS_API_ENDPOINT: 'wss://dxlink.fake.test/dxlink-chainlink' },
    })

    expect(url).toBe('wss://dxlink.fake.test/dxlink-chainlink')
    expect(url).not.toContain('@')

    // The config-level guard rejects URL-embedded credentials at startup
    expect(validateWsApiEndpoint('wss://user:pass@dxlink.fake.test/dxlink-chainlink')).toContain(
      'credentials',
    )
  })

  it('the handshake sends no dxLink AUTH message — only SETUP, CHANNEL_REQUEST and FEED_SETUP', () => {
    // Exception basic-auth-not-oauth: "The dxLink AUTH message exists but is NOT used"
    expect(
      dxLinkHandshakeMessages()
        .map((message) => message.type)
        .includes('AUTH'),
    ).toBe(false)
  })
})

describe('Basic header credential guard (fail loud instead of encoding a literal "undefined:undefined")', () => {
  it('throws when API_USERNAME is unset', () => {
    expect(() => dxLinkConnectionOptions({ API_PASSWORD: 'dxfeed-pass' } as any)).toThrow(
      /API_USERNAME and API_PASSWORD/,
    )
  })

  it('throws when API_PASSWORD is unset', () => {
    expect(() => dxLinkConnectionOptions({ API_USERNAME: 'dxfeed-user' } as any)).toThrow(
      /API_USERNAME and API_PASSWORD/,
    )
  })

  it('throws when either value is blank or whitespace-only after trim', () => {
    expect(() =>
      dxLinkConnectionOptions({ API_USERNAME: '  ', API_PASSWORD: 'dxfeed-pass' } as any),
    ).toThrow(/API_USERNAME and API_PASSWORD/)
    expect(() =>
      dxLinkConnectionOptions({ API_USERNAME: 'dxfeed-user', API_PASSWORD: '' } as any),
    ).toThrow(/API_USERNAME and API_PASSWORD/)
  })

  it('still builds the exact spec header when both values are set', () => {
    expect(dxLinkConnectionOptions(CREDENTIALS)).toEqual({
      headers: { Authorization: EXPECTED_HEADER },
    })
  })
})
