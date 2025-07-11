import querystring from 'node:querystring'
import { NetDaniaDouble } from './netdania.double'
import { config } from '../../src/config'

/**
 * Tests for "internal" behaviour of the NetDaniaDouble. I.e. stuff for which we know the right behaviour, not stuff
 * that mimics the real API.
 */
describe('Our NetDania double', () => {
  config.initialize()

  const baseUri = 'https://mockedq102948.com' // avoid predictable domains
  const path = '/StreamingServer/StreamingServer'
  const mockedApiEndpoint = baseUri + path
  const mockedPassword = 'fake-api-key'
  const mockConfig = {
    ...config.settings,
    ...{
      API_ENDPOINT: mockedApiEndpoint,
      FAILOVER_API_ENDPOINT: mockedApiEndpoint,
    },
    ...{ NETDANIA_PASSWORD: mockedPassword },
  }
  const netDaniaDouble: NetDaniaDouble = NetDaniaDouble.getInstance(mockConfig)

  it('isValidQuery validates valid queries', async () => {
    const queryString =
      'https://mockedq102948.com/StreamingServer/StreamingServer?xstream=1&v=5&dt=0&h=eyJnIjoiY2hhaW4ubGluayIsImFpIjoiTm9kZUpTQVBJdjEuNS4yIiwicHIiOjIsImF1IjoibG9jYWxob3N0OjgwODAiLCJxdXAiOjEsInAiOiJmYWtlLWFwaS1rZXkifQ..&xcmd=W3sidCI6MSwiaSI6MSwibSI6MSwicyI6IkVVUlVTRCIsInAiOiJpZGMifV0.&cb=?&ts=1751291382995'
    const decoded = querystring.decode(queryString) as Record<string, string>
    console.log('Decoded query string:', decoded)
    const isValid: boolean = netDaniaDouble['isValidQuery'](decoded)
    console.log('isValid', isValid)
    expect(isValid).toBe(true)
  })

  it('isValidXCmd validates valid plural XCMD', () => {
    expect(
      NetDaniaDouble['isValidXCMD']([
        { t: 1, i: 6, m: 1, s: 'XAUUSD', p: 'idc' },
        {
          t: 1,
          i: 7,
          m: 1,
          s: 'USDJPY',
          p: 'idc',
        },
      ]),
    ).toBe(true)
  })

  it('decodes h param base64 correctly', async () => {
    const str =
      'eyJnIjoiY2hhaW4ubGluayIsImFpIjoiTm9kZUpTQVBJdjEuNS4yIiwicHIiOjIsImF1IjoibG9jYWxob3N0OjgwODAiLCJxdXAiOjEsInAiOiJmYWtlLWFwaS1rZXkifQ..'
    const decoded = NetDaniaDouble.base64JsonDecode(str)
    console.log('Decoded h param:', decoded)
    expect(decoded).toStrictEqual({
      g: 'chain.link',
      ai: 'NodeJSAPIv1.5.2',
      pr: 2,
      au: 'localhost:8080',
      qup: 1,
      p: 'fake-api-key',
    })
  })
})
