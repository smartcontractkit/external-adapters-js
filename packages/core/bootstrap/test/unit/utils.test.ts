import { AdapterContext } from '@chainlink/types'
import { FastifyRequest } from 'fastify'
import {
  getEnv,
  buildUrlPath,
  buildUrl,
  baseEnvDefaults,
  getRandomRequiredEnv,
  toObjectWithNumbers,
  getRequiredEnv,
  RequiredEnvError,
  formatArray,
  groupBy,
  isDebugLogLevel,
  permutator,
  deepType,
  getURL,
  getRequiredEnvWithFallback,
  registerUnhandledRejectionHandler,
  getClientIp,
} from '../../src/lib/util'

describe('utils', () => {
  let oldEnv

  beforeEach(() => {
    oldEnv = JSON.parse(JSON.stringify(process.env))
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

  describe('getRandomRequiredEnv', () => {
    it('returns item from list env var at random', () => {
      const varName = 'RANDOM_TEST_ENV_VAR'
      process.env[varName] = 'one,two,three'
      jest
        .spyOn(global.Math, 'random')
        .mockReturnValueOnce(0.1)
        .mockReturnValueOnce(0.5)
        .mockReturnValueOnce(0.7)

      expect(getRandomRequiredEnv(varName)).toBe('one')
      expect(getRandomRequiredEnv(varName)).toBe('two')
      expect(getRandomRequiredEnv(varName)).toBe('three')

      jest.restoreAllMocks()
    })
  })

  describe('toObjectWithNumbers', () => {
    it('replaces number strings with numbers', () => {
      const input = {
        a: 'test',
        b: '2',
        c: 3,
        d: ['a', 'b'],
      }
      const expected = {
        a: 'test',
        b: 2,
        c: 3,
        d: ['a', 'b'],
      }

      expect(toObjectWithNumbers(input)).toEqual(expected)
    })
  })

  describe('getRequiredEnv', () => {
    it('throws error if required env var not present', () => {
      expect(() => getRequiredEnv('asdfasdfasdf')).toThrow(RequiredEnvError)
    })
  })

  describe('formatArray', () => {
    it('wraps single string input in array', () => {
      expect(formatArray('test')).toEqual(['test'])
    })

    it('leaves input array as is', () => {
      expect(formatArray(['asd', 'qwe'])).toEqual(['asd', 'qwe'])
    })
  })

  describe('groupBy', () => {
    it('takes list of items and returns map with grouped array values', () => {
      const input = [
        {
          a: 'one',
          b: 'two',
        },
        {
          a: 'one',
          c: 'asd',
        },
        {
          a: 'two',
          b: 'two',
        },
        {
          a: 'three',
          c: 'one',
          d: 'asd',
        },
        {
          a: 'two',
          b: 'three',
        },
      ]

      const expected = new Map()
      expected.set('one', [input[0], input[1]])
      expected.set('two', [input[2], input[4]])
      expected.set('three', [input[3]])

      expect(groupBy(input, (i) => i.a)).toEqual(expected)
    })
  })

  describe('isDebugLogLevel', () => {
    it('parses log level var', () => {
      process.env.LOG_LEVEL = 'debug'
      expect(isDebugLogLevel()).toBe(true)
      process.env.LOG_LEVEL = 'warn'
      expect(isDebugLogLevel()).toBe(false)
    })
  })

  describe('permutator', () => {
    it('calculates all permutations, returns array of arrays', () => {
      const input = ['1', '2', '3']
      const expected = [
        ['1'],
        ['2'],
        ['3'],
        ['1', '2'],
        ['1', '3'],
        ['2', '1'],
        ['2', '3'],
        ['3', '1'],
        ['3', '2'],
        ['1', '2', '3'],
        ['1', '3', '2'],
        ['2', '1', '3'],
        ['2', '3', '1'],
        ['3', '1', '2'],
        ['3', '2', '1'],
      ]

      expect(permutator(input)).toEqual(expected)
    })

    it('calculates all permutations, returns array of strings', () => {
      const input = ['1', '2', '3']
      const expected = [
        '1',
        '2',
        '3',
        '1,2',
        '1,3',
        '2,1',
        '2,3',
        '3,1',
        '3,2',
        '1,2,3',
        '1,3,2',
        '2,1,3',
        '2,3,1',
        '3,1,2',
        '3,2,1',
      ]

      expect(permutator(input, ',')).toEqual(expected)
    })

    it('returns empty array when input is empty array', () => {
      expect(permutator([])).toEqual([])
    })
  })

  describe('deepType', () => {
    it('returns expected types', () => {
      expect(deepType('asd')).toBe('string')
      expect(deepType(123)).toBe('number')
      expect(deepType([])).toBe('array')
      expect(deepType(null)).toBe('null')
      expect(deepType(null, true)).toBe('[object Null]')
      expect(deepType(new Map())).toBe('object')
      expect(deepType(new Map(), true)).toBe('[object Map]')
      expect(deepType(() => 123)).toBe('function')
      expect(
        deepType(function* () {
          yield 123
        }),
      ).toBe('function')
    })
  })

  describe('getURL', () => {
    it('gets adapter url from env vars using new format', () => {
      process.env.COINGECKO_ADAPTER_URL = 'http://coincecko-ea.test:1234'
      expect(getURL('COINGECKO')).toBe('http://coincecko-ea.test:1234')
      expect(getURL('COINGECKO', true)).toBe('http://coincecko-ea.test:1234')
    })
    it('gets adapter url from env vars using legacy format', () => {
      process.env.COINGECKO_DATA_PROVIDER_URL = 'http://coincecko-ea.test:2345'
      expect(getURL('COINGECKO')).toBe('http://coincecko-ea.test:2345')
    })
  })

  describe('getRequiredEnvWithFallback', () => {
    it('returns primary env var', () => {
      process.env.TEST_VAR = 'zxcvbnm'
      process.env.FALLBACK1 = 'fallback1'
      expect(getRequiredEnvWithFallback('TEST_VAR', ['FALLBACK1', 'FALLBACK2'])).toBe('zxcvbnm')
    })
    it('returns fallback env var', () => {
      process.env.FALLBACK2 = 'fallback2'
      expect(getRequiredEnvWithFallback('TEST_VAR', ['FALLBACK1', 'FALLBACK2'])).toBe('fallback2')
    })
    it('throws error when neither primary nor fallbacks are present', () => {
      expect(() => getRequiredEnvWithFallback('TEST_VAR', ['FALLBACK1', 'FALLBACK2'])).toThrow(
        RequiredEnvError,
      )
    })
  })

  describe('registerUnhandledRejectionHandler', () => {
    it('successfully ignores unhandled rejections', async () => {
      const failing = () => process.emit('unhandledRejection' as 'disconnect')

      registerUnhandledRejectionHandler()
      registerUnhandledRejectionHandler() // Test calling it twice will warn but continue

      expect(failing).not.toThrow()
    })
  })

  describe(`clientIp`, () => {
    it(`getClientIp retrieves ip address`, () => {
      const ip = '1.2.3.4'
      const values = [{ ip }, { ips: [ip] }, { ips: ['5.6.7.8', 'a.b.c.d', ip] }]
      values.forEach((val) => expect(getClientIp(val as FastifyRequest)).toEqual(ip))
    })

    it(`getClientIp returns 'unknown'`, () => {
      const values = [{}, { ip: null }, { ips: [] }]
      values.forEach((val) => expect(getClientIp(val as FastifyRequest)).toEqual('unknown'))
    })
  })
})
