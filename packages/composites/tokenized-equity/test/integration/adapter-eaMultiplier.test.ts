import {
  TestAdapter,
  setEnvVariables,
} from '@chainlink/external-adapter-framework/util/testing-utils'
import nock from 'nock'
import { mockResponseSuccess, mockSourceAdapterResponse } from './fixtures'

describe('execute', () => {
  let spy: jest.SpyInstance
  let testAdapter: TestAdapter
  let oldEnv: NodeJS.ProcessEnv

  beforeAll(async () => {
    oldEnv = JSON.parse(JSON.stringify(process.env))
    process.env.DATA_ENGINE_ADAPTER_URL = 'http://data-engine'
    process.env.TRADING_HOURS_ADAPTER_URL = 'http://trading-hours'
    process.env.SOLANA_FUNCTIONS_ADAPTER_URL = 'http://solana-functions'
    process.env.BACKGROUND_EXECUTE_MS = process.env.BACKGROUND_EXECUTE_MS ?? '1000'
    const mockDate = new Date('2001-01-01T11:11:11.111Z')
    spy = jest.spyOn(Date, 'now').mockReturnValue(mockDate.getTime())

    mockResponseSuccess()
    mockSourceAdapterResponse()

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

  describe('ea-multiplier endpoint', () => {
    const baseRequest = {
      endpoint: 'ea-multiplier',
      params: JSON.stringify({
        endpoint: 'extension',
        stateAccountAddress: '6V4gLu7aC63e6CTEJXu71wtx5FMrZ3FQoST7UXXqgPuQ',
        extensionDataOffset: 166,
        extensionFields: [
          { extensionType: 25, name: 'multiplier', offset: 32, type: 'float64' },
          { extensionType: 25, name: 'activationDateTime', offset: 40, type: 'int64' },
          { extensionType: 25, name: 'newMultiplier', offset: 48, type: 'float64' },
        ],
      }),
      asset: '0x0',
      regularStreamId: '0x000b5',
      extendedStreamId: '0x000b6',
      overnightStreamId: '0x000b7',
      smoother: 'none',
      decimals: 8,
    }

    it('should return success', async () => {
      const response = await testAdapter.request({
        ...baseRequest,
        sourceAdapter: 'SOLANA_FUNCTIONS',
      })

      expect(response.statusCode).toBe(200)
      expect(response.json()).toMatchSnapshot()
    })

    it('should return 500 when SOURCE_ADAPTER_URL is not set for the sourceAdapter', async () => {
      const response = await testAdapter.request({
        ...baseRequest,
        sourceAdapter: 'MISSING',
      })

      expect(response.statusCode).toBe(500)
      expect(response.json()).toMatchSnapshot()
    })

    describe('missing adapter URL', () => {
      const startAdapterWithout = async (envVar: string) => {
        const envBefore = { ...process.env }
        delete process.env[envVar]
        process.env.BACKGROUND_EXECUTE_MS = '10'
        try {
          jest.resetModules()
          const { TestAdapter: FreshTestAdapter } = await import(
            '@chainlink/external-adapter-framework/util/testing-utils'
          )
          const adapter = (await import('../../src')).adapter
          adapter.rateLimiting = undefined
          return await FreshTestAdapter.startWithMockedCache(adapter, {
            testAdapter: {} as TestAdapter<never>,
          })
        } finally {
          setEnvVariables(envBefore)
        }
      }

      it('should fail to start when DATA_ENGINE_ADAPTER_URL is not set', async () => {
        await expect(startAdapterWithout('DATA_ENGINE_ADAPTER_URL')).rejects.toThrow(
          'Missing required environment variable: DATA_ENGINE_ADAPTER_URL',
        )
      })

      it('should return 500 when TRADING_HOURS_ADAPTER_URL is not set', async () => {
        const adapterWithoutTradingHours = await startAdapterWithout('TRADING_HOURS_ADAPTER_URL')
        try {
          const response = await adapterWithoutTradingHours.request({
            ...baseRequest,
            sourceAdapter: 'SOLANA_FUNCTIONS',
          })

          expect(response.statusCode).toBe(500)
          expect(response.json()).toEqual({
            error: {
              message: 'Missing required environment variable: TRADING_HOURS_ADAPTER_URL',
              name: 'AdapterError',
            },
            status: 'errored',
            statusCode: 500,
          })
        } finally {
          await adapterWithoutTradingHours.api.close()
        }
      })
    })
  })
})
