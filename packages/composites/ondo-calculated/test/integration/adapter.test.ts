import {
  TestAdapter,
  setEnvVariables,
} from '@chainlink/external-adapter-framework/util/testing-utils'
import { JsonRpcProvider } from 'ethers'
import * as nock from 'nock'
import { mockResponseSuccess } from './fixtures'

jest.mock('ethers', () => {
  const actualModule = jest.requireActual('ethers')
  return {
    ...actualModule,
    JsonRpcProvider: jest.fn().mockImplementation(() => {
      return {} as JsonRpcProvider
    }),
    Contract: jest.fn().mockImplementation(() => {
      return {
        getSValue: jest.fn().mockImplementation(() => {
          return Promise.resolve({ sValue: 2n * 10n ** 18n, paused: false })
        }),
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
    process.env.DATA_ENGINE_EA_URL = 'http://data-engine'
    process.env.ETHEREUM_RPC_URL = 'fake-url'
    process.env.BACKGROUND_EXECUTE_MS = process.env.BACKGROUND_EXECUTE_MS ?? '0'
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
    it('should return success', async () => {
      // Shift 20 minutes away so smoother is not applied
      const minute = (new Date().getMinutes() + 20) % 60

      const data = {
        registry: '0x0',
        asset: '0x0',
        regularStreamId: '0x000b5',
        extendedStreamId: '0x000b5',
        overnightStreamId: '0x000b5',
        sessionBoundaries: ['00:' + (minute < 10 ? '0' : '') + minute],
        sessionBoundariesTimeZone: 'UTC',
        decimals: 8,
      }
      mockResponseSuccess()

      const response = await testAdapter.request(data)

      expect(response.statusCode).toBe(200)
      expect(response.json()).toMatchSnapshot()
    })

    it('bad sessionBoundariesTimeZone', async () => {
      const data = {
        registry: '0x0',
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
        registry: '0x0',
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
  })
})
