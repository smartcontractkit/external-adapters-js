import {
  TestAdapter,
  setEnvVariables,
} from '@chainlink/external-adapter-framework/util/testing-utils'
import { JsonRpcProvider } from 'ethers'
import nock from 'nock'

const feedId = '0x000b0b1c31f90396e910c57ec94ed963271e4e39f15da3d92f81e273083ce4a1'

// The report is in 18 decimals and scaled by the adapter
const mockDataEngineResponse = (): nock.Scope =>
  nock('http://data-engine', {
    encodedQueryParams: true,
  })
    .post('/', {
      data: {
        endpoint: 'deutscheBoerse-v11',
        feedId,
      },
    })
    .reply(200, () => ({
      result: null,
      data: {
        mid: '250000000000000000000',
        lastSeenTimestampNs: '1700000000000000000',
        bid: '249900000000000000000',
        bidVolume: 4,
        ask: '250100000000000000000',
        askVolume: 6,
        lastTradedPrice: '250000000000000000000',
        marketStatus: 5,
        decimals: 18,
      },
      statusCode: 200,
    }))
    .persist()

const robinhoodAsset = '0x0000000000000000000000000000000000000001'
const robinhoodPausedAsset = '0x0000000000000000000000000000000000000002'
const coinbaseRegistry = '0x0000000000000000000000000000000000000003'
const xstocksAsset = '0x0000000000000000000000000000000000000004'
const ondoRegistry = '0x0000000000000000000000000000000000000005'
const xstocksUnderlying = '0x0000000000000000000000000000000000000006'

jest.mock('ethers', () => {
  const actualModule = jest.requireActual('ethers')
  return {
    ...actualModule,
    JsonRpcProvider: jest.fn().mockImplementation(() => {
      return {} as JsonRpcProvider
    }),
    Contract: jest.fn().mockImplementation((address: string) => {
      switch (address) {
        case robinhoodAsset:
          return {
            decimals: jest.fn().mockResolvedValue(18n),
            uiMultiplier: jest.fn().mockResolvedValue(2n * 10n ** 18n),
            oraclePaused: jest.fn().mockResolvedValue(false),
          }
        case robinhoodPausedAsset:
          return {
            decimals: jest.fn().mockResolvedValue(18n),
            uiMultiplier: jest.fn().mockResolvedValue(2n * 10n ** 18n),
            oraclePaused: jest.fn().mockResolvedValue(true),
          }
        case coinbaseRegistry:
          return {
            getOracleParams: jest
              .fn()
              .mockResolvedValue({ multiplier: 3n * 10n ** 18n, paused: false }),
          }
        case xstocksAsset:
          return {
            decimals: jest.fn().mockResolvedValue(18n),
            asset: jest.fn().mockResolvedValue(xstocksUnderlying),
            convertToAssets: jest.fn().mockResolvedValue(1_500_000n),
          }
        case xstocksUnderlying:
          return {
            decimals: jest.fn().mockResolvedValue(6n),
          }
        case ondoRegistry:
          return {
            getSValue: jest.fn().mockResolvedValue({ sValue: 5n * 10n ** 17n, paused: false }),
          }
        default:
          return {}
      }
    }),
  }
})

describe('execute', () => {
  let spy: jest.SpyInstance
  let testAdapter: TestAdapter
  let oldEnv: NodeJS.ProcessEnv

  beforeAll(async () => {
    oldEnv = JSON.parse(JSON.stringify(process.env))
    process.env.DATA_ENGINE_ADAPTER_URL = 'http://data-engine'
    process.env.TRADING_HOURS_ADAPTER_URL = 'http://trading-hours'
    process.env.ETHEREUM_RPC_URL = 'fake-eth-url'
    process.env.BASE_RPC_URL = 'fake-base-url'
    process.env.ROBINHOOD_MAINNET_RPC_URL = 'fake-robinhood-url'
    process.env.ROBINHOOD_MAINNET_CHAIN_ID = '4663'
    process.env.BACKGROUND_EXECUTE_MS = process.env.BACKGROUND_EXECUTE_MS ?? '1000'
    const mockDate = new Date('2001-01-01T11:11:11.111Z')
    spy = jest.spyOn(Date, 'now').mockReturnValue(mockDate.getTime())

    mockDataEngineResponse()

    const adapter = (await import('../../src')).adapter
    adapter.rateLimiting = undefined
    testAdapter = await TestAdapter.startWithMockedCache(adapter, {
      testAdapter: {} as TestAdapter<never>,
    })
  })

  afterAll(async () => {
    setEnvVariables(oldEnv)
    await testAdapter.api.close()
    nock.restore()
    nock.cleanAll()
    spy.mockRestore()
  })

  describe('issuer-price-247 endpoint', () => {
    const baseRequest = {
      endpoint: 'issuer-price-247',
      targetEndpoint: 'v11',
      feedId,
      resultPath: 'lastTradedPrice',
      decimals: 8,
    }

    it('should return success - robinhood', async () => {
      const response = await testAdapter.request({
        ...baseRequest,
        multiplier: { issuer: 'robinhood', asset: robinhoodAsset, network: 'robinhood-mainnet' },
      })
      expect(response.statusCode).toBe(200)
      expect(response.json()).toMatchSnapshot()
    })

    it('should return success - coinbase', async () => {
      const response = await testAdapter.request({
        ...baseRequest,
        multiplier: {
          issuer: 'coinbase',
          asset: '0xa',
          registry: coinbaseRegistry,
          network: 'base',
        },
      })
      expect(response.statusCode).toBe(200)
      expect(response.json()).toMatchSnapshot()
    })

    it('should return success - xstocks', async () => {
      const response = await testAdapter.request({
        ...baseRequest,
        multiplier: { issuer: 'xstocks', asset: xstocksAsset, network: 'ethereum' },
      })
      expect(response.statusCode).toBe(200)
      expect(response.json()).toMatchSnapshot()
    })

    it('should return success - ondo', async () => {
      const response = await testAdapter.request({
        ...baseRequest,
        multiplier: { issuer: 'ondo', asset: '0xa', registry: ondoRegistry, network: 'ethereum' },
      })
      expect(response.statusCode).toBe(200)
      expect(response.json()).toMatchSnapshot()
    })

    it('should return 503 when paused', async () => {
      const response = await testAdapter.request({
        ...baseRequest,
        multiplier: {
          issuer: 'robinhood',
          asset: robinhoodPausedAsset,
          network: 'robinhood-mainnet',
        },
      })
      expect(response.statusCode).toBe(503)
      expect(response.json()).toMatchSnapshot()
    })

    it('unsupported issuer', async () => {
      const response = await testAdapter.request({
        ...baseRequest,
        multiplier: { issuer: 'unknown', asset: '0xa', network: 'ethereum' },
      })
      expect(response.statusCode).toBe(400)
      expect(response.json()).toMatchSnapshot()
    })

    it('missing registry', async () => {
      const response = await testAdapter.request({
        ...baseRequest,
        multiplier: { issuer: 'coinbase', asset: '0xa', network: 'base' },
      })
      expect(response.statusCode).toBe(400)
      expect(response.json()).toMatchSnapshot()
    })

    it('missing network', async () => {
      const response = await testAdapter.request({
        ...baseRequest,
        multiplier: { issuer: 'robinhood', asset: robinhoodAsset },
      })
      expect(response.statusCode).toBe(400)
      expect(response.json()).toMatchSnapshot()
    })

    it('network without rpc url', async () => {
      const response = await testAdapter.request({
        ...baseRequest,
        multiplier: { issuer: 'robinhood', asset: robinhoodAsset, network: 'robinhood-testnet' },
      })
      expect(response.statusCode).toBe(400)
      expect(response.json()).toMatchSnapshot()
    })

    it('unsupported targetEndpoint', async () => {
      const response = await testAdapter.request({
        ...baseRequest,
        targetEndpoint: 'v3',
        multiplier: { issuer: 'robinhood', asset: robinhoodAsset, network: 'robinhood-mainnet' },
      })
      expect(response.statusCode).toBe(400)
      expect(response.json()).toMatchSnapshot()
    })

    it('should return raw stream price without multiplier', async () => {
      const response = await testAdapter.request(baseRequest)
      expect(response.statusCode).toBe(200)
      expect(response.json().result).toBe('25000000000')
      expect(response.json().data.multiplier).toBeUndefined()
      expect(response.json()).toMatchSnapshot()
    })
  })
})
