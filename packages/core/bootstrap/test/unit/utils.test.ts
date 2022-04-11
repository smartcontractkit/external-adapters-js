import { AdapterContext } from '@chainlink/types'
import { getEnv, buildUrlPath, buildUrl, baseEnvDefaults } from '../../src/lib/util'

describe('utils', () => {
  let oldEnv

  beforeEach(() => {
    oldEnv = process.env
  })

  afterEach(() => {
    process.env = oldEnv
  })

  describe('getEnv', () => {
    it('fetches the correct environment variable', () => {
      process.env.TEST = 'test'
      const actual = getEnv('TEST')
      expect(actual).toEqual('test')
    })

    it('ignores empty string environment variables', () => {
      process.env.TEST = ''
      const actual = getEnv('TEST')
      expect(actual).toBeUndefined()
    })

    it('prefers user-specified env vars over bootstrap base defaults', () => {
      process.env.WS_ENABLED = 'true'
      const actual = getEnv('WS_ENABLED')
      expect(baseEnvDefaults.WS_ENABLED).toEqual('false')
      expect(actual).toEqual('true')
    })

    it('prefers EA default overrides over bootstrap base defaults', () => {
      const adapterContext: AdapterContext = { envDefaultOverrides: { WS_ENABLED: 'true' } }
      const actual = getEnv('WS_ENABLED', undefined, adapterContext)
      expect(baseEnvDefaults.WS_ENABLED).toEqual('false')
      expect(actual).toEqual('true')
    })

    it('prefers user-specified env vars over EA default overrides', () => {
      process.env.WS_ENABLED = 'true'
      const adapterContext: AdapterContext = { envDefaultOverrides: { WS_ENABLED: 'false' } }
      const actual = getEnv('WS_ENABLED', undefined, adapterContext)
      expect(actual).toEqual('true')
    })

    it('defaults to bootstrap base defaults when user-specified env vars are undefined', () => {
      process.env.WS_ENABLED = ''
      const actual = getEnv('WS_ENABLED')
      expect(baseEnvDefaults.WS_ENABLED).toEqual('false')
      expect(actual).toEqual('false')
    })

    it('defaults to EA default overrides when user-specified env vars are undefined but overrides are present', () => {
      process.env.WS_ENABLED = ''
      const adapterContext: AdapterContext = { envDefaultOverrides: { WS_ENABLED: 'true' } }
      const actual = getEnv('WS_ENABLED', undefined, adapterContext)
      expect(baseEnvDefaults.WS_ENABLED).toEqual('false')
      expect(actual).toEqual('true')
    })
  })

  describe(`buildUrlPath`, () => {
    it(`builds path with valid characters`, () => {
      const actual = buildUrlPath('/from/:from/to/:to', {
        from: 'ETH',
        to: 'USD',
      })
      expect(actual).toEqual('/from/ETH/to/USD')
    })

    it(`builds path with whitelisted & non-whitelisted characters`, () => {
      const actual = buildUrlPath(
        '/from/:from/to/:to',
        {
          from: 'E:T?H',
          to: 'U%S\\D !',
        },
        ':%^ !',
      )
      expect(actual).toEqual('/from/E:T%3FH/to/U%S%5CD !')
    })

    it(`returns empty string from empty path`, () => {
      const actual = buildUrlPath('', { from: 'ETH', to: 'USD', message: 'hello_world' })
      expect(actual).toEqual('')
    })

    it(`builds path with no params`, () => {
      const actual = buildUrlPath('/from/to')
      expect(actual).toEqual('/from/to')
    })

    it(`builds path with reserved characters`, () => {
      const actual = buildUrlPath('/from/:from/to/:to', {
        from: 'ETH:USD',
        to: 'USD/?ETH=USD',
      })
      expect(actual).toEqual('/from/ETH%3AUSD/to/USD%2F%3FETH%3DUSD')
    })

    it(`builds path with unsafe characters`, () => {
      const actual = buildUrlPath('/from/:from/to/:to', {
        from: 'ETH"USD"',
        to: '{U|S|D>',
      })
      expect(actual).toEqual('/from/ETH%22USD%22/to/%7BU%7CS%7CD%3E')
      expect(decodeURI(actual)).toEqual('/from/ETH"USD"/to/{U|S|D>')
    })

    it(`builds path with non-latin characters`, () => {
      const actual = buildUrlPath('/from/:from/to/:to', {
        from: 'abcÂÃ',
        to: '你好世界',
      })
      expect(actual).toEqual('/from/abc%C3%82%C3%83/to/%E4%BD%A0%E5%A5%BD%E4%B8%96%E7%95%8C')
      expect(decodeURI(actual)).toEqual('/from/abcÂÃ/to/你好世界')
    })

    it(`builds path with ':' in string & values`, () => {
      const actual = buildUrlPath('/price/:from::to', { from: 'ETH', to: 'USD' })
      expect(actual).toEqual('/price/ETH:USD')
    })
  })

  describe(`buildUrl`, () => {
    it(`builds URL with a given base, path & params`, () => {
      const baseWsURL = 'wss://example.com:8000'
      const asset = 'BTC'
      const metrics = 'hello'
      const key = 123456

      const expected = `${baseWsURL}/timeseries-stream/asset-metrics/assets/${asset}/metrics/${metrics}/frequency/1s/api_key/${key}`
      const actual = buildUrl(
        baseWsURL,
        '/timeseries-stream/asset-metrics/assets/:assets/metrics/:metrics/frequency/:frequency/api_key/:api_key',
        {
          assets: asset,
          metrics: metrics,
          frequency: '1s',
          api_key: key,
        },
      )

      expect(actual).toEqual(expected)
    })

    it(`builds URL with a given base & path only`, () => {
      const baseWsURL = 'wss://example.com:8000'
      const expected = `${baseWsURL}/timeseries-stream/asset-metrics`
      const actual = buildUrl(baseWsURL, '/timeseries-stream/asset-metrics')

      expect(actual).toEqual(expected)
    })

    it(`builds URL with basic auth (key:secret)`, () => {
      const withApiKey = (url: string, key: string, secret: string) =>
        buildUrl(url, '/client/:client', { client: `${key}:${secret}` }, ':')
      const expected = `wss://stream.tradingeconomics.com/client/keystring:secretstring`
      const actual = withApiKey('wss://stream.tradingeconomics.com', 'keystring', 'secretstring')

      expect(actual).toEqual(expected)
    })
  })
})
