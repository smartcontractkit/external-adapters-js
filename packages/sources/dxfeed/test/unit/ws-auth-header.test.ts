import { LoggerFactoryProvider } from '@chainlink/external-adapter-framework/util'
import { validateWsApiEndpoint } from '../../src/config'
import { transport as stockQuotesTransport } from '../../src/transport/stock-quotes'
import { dxLinkConnectionOptions } from '../../src/transport/ws'

LoggerFactoryProvider.set()

describe('Basic Authorization handshake header (spec data_source_authentication.usage.handshake_header)', () => {
  it('builds the Authorization: Basic header from API_USERNAME and API_PASSWORD', () => {
    const options = dxLinkConnectionOptions({
      API_USERNAME: 'dxfeed-user',
      API_PASSWORD: 'dxfeed-pass',
    })

    expect(options).toEqual({
      headers: {
        Authorization: `Basic ${Buffer.from('dxfeed-user:dxfeed-pass').toString('base64')}`,
      },
    })
  })

  it('connects to WS_API_ENDPOINT verbatim with credentials on the header, never the URL', () => {
    const url = (stockQuotesTransport as any).config.url({
      adapterSettings: { WS_API_ENDPOINT: 'wss://dxlink.fake.test/dxlink-chainlink' },
    })

    expect(url).toBe('wss://dxlink.fake.test/dxlink-chainlink')
    expect(url).not.toContain('@')

    // The config-level guard rejects URL-embedded credentials at startup
    expect(validateWsApiEndpoint('wss://user:pass@dxlink.fake.test/dxlink-chainlink')).toContain(
      'credentials',
    )
  })
})
