import {
  TestAdapter,
  setEnvVariables,
} from '@chainlink/external-adapter-framework/util/testing-utils'
import { JsonRpcProvider } from 'ethers'
import * as nock from 'nock'
import { mockResponseSuccess } from './fixtures'

const validContract = '0x12345'
jest.mock('ethers', () => {
  const actualModule = jest.requireActual('ethers')
  return {
    ...actualModule,
    JsonRpcProvider: jest.fn().mockImplementation(() => {
      return {} as JsonRpcProvider
    }),
    Contract: jest.fn().mockImplementation((address: string) => {
      if (address === validContract) {
        return {
          getSValue: jest.fn().mockImplementation(() => {
            return Promise.resolve({ sValue: 2n * 10n ** 18n, paused: false })
          }),
        }
      } else {
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
    process.env.ETHEREUM_RPC_URL = 'fake-url'
    process.env.BACKGROUND_EXECUTE_MS = process.env.BACKGROUND_EXECUTE_MS ?? '1000'
    const mockDate = new Date('2001-01-01T11:11:11.111Z')
    spy = jest.spyOn(Date, 'now').mockReturnValue(mockDate.getTime())

    const adapter = (await import('./../../src')).adapter
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

  describe('price endpoint', () => {
    it('should return success - kalman', async () => {
      const data = {
        registry: validContract,
        asset: '0x0',
        regularStreamId: '0x000b5',
        extendedStreamId: '0x000b6',
        overnightStreamId: '0x000b7',
        sessionBoundaries: [],
        sessionBoundariesTimeZone: 'UTC',
        decimals: 8,
      }
      mockResponseSuccess()

      const response = await testAdapter.request(data)

      expect(response.statusCode).toBe(200)
      expect(response.json()).toMatchSnapshot()
    })

    it('should return success - ema', async () => {
      const data = {
        registry: validContract,
        asset: '0x0',
        regularStreamId: '0x000b5',
        extendedStreamId: '0x000b6',
        overnightStreamId: '0x000b7',
        sessionBoundaries: [],
        sessionBoundariesTimeZone: 'UTC',
        smoother: 'ema',
        decimals: 8,
      }
      mockResponseSuccess()

      const response = await testAdapter.request(data)

      expect(response.statusCode).toBe(200)
      expect(response.json()).toMatchSnapshot()
    })

    it('bad sessionBoundariesTimeZone', async () => {
      const data = {
        registry: validContract,
        asset: '0x0',
        regularStreamId: '0x000b5',
        extendedStreamId: '0x000b5',
        overnightStreamId: '0x000b5',
        sessionBoundaries: ['00:00'],
        sessionBoundariesTimeZone: 'random',
        decimals: 8,
      }

      const response = await testAdapter.request(data)

      expect(response.statusCode).toBe(400)
      expect(response.json()).toMatchSnapshot()
    })

    it('bad sessionBoundaries', async () => {
      const data = {
        registry: validContract,
        asset: '0x0',
        regularStreamId: '0x000b5',
        extendedStreamId: '0x000b5',
        overnightStreamId: '0x000b5',
        sessionBoundaries: ['99:88'],
        sessionBoundariesTimeZone: 'UTC',
        decimals: 8,
      }

      const response = await testAdapter.request(data)

      expect(response.statusCode).toBe(400)
      expect(response.json()).toMatchSnapshot()
    })

    it('should return failure - kalman', async () => {
      const data = {
        registry: '0x0',
        asset: '0x0',
        regularStreamId: '0x000b5',
        extendedStreamId: '0x000b6',
        overnightStreamId: '0x000b7',
        sessionBoundaries: [],
        sessionBoundariesTimeZone: 'UTC',
        decimals: 8,
      }

      const response = await testAdapter.request(data)
      expect(response.statusCode).toBe(502)
    })

    it('should return failure - ema', async () => {
      const data = {
        registry: '0x0',
        asset: '0x0',
        regularStreamId: '0x000b5',
        extendedStreamId: '0x000b6',
        overnightStreamId: '0x000b7',
        sessionBoundaries: [],
        sessionBoundariesTimeZone: 'UTC',
        smoother: 'ema',
        decimals: 8,
      }

      const response = await testAdapter.request(data)
      expect(response.statusCode).toBe(502)
    })
  })
})
