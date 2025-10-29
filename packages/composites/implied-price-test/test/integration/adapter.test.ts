import {
  TestAdapter,
  setEnvVariables,
} from '@chainlink/external-adapter-framework/util/testing-utils'
import * as nock from 'nock'
import { mockDPResponseError, mockDPResponseSuccess } from './fixtures'

describe('execute', () => {
  let spy: jest.SpyInstance
  let testAdapter: TestAdapter
  let oldEnv: NodeJS.ProcessEnv

  beforeAll(async () => {
    oldEnv = JSON.parse(JSON.stringify(process.env))
    process.env.BACKGROUND_EXECUTE_MS = process.env.BACKGROUND_EXECUTE_MS ?? '0'
    process.env.RETRY = process.env.RETRY ?? '0'
    process.env.TIINGO_ADAPTER_URL =
      process.env.TIINGO_ADAPTER_URL ?? 'http://localhost:8080/tiingo'
    process.env.NCFX_ADAPTER_URL = process.env.NCFX_ADAPTER_URL ?? 'http://localhost:8080/ncfx'
    process.env.ELWOOD_ADAPTER_URL =
      process.env.ELWOOD_ADAPTER_URL ?? 'http://localhost:8080/elwood'
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

  describe('computePrice endpoint', () => {
    it('should return error for missing source', async () => {
      const data = {
        operand1Sources: ['ncfx', 'elwood', 'coinpaprika'],
        operand1MinAnswers: 3,
        operand1Input: JSON.stringify({
          from: 'LINK',
          to: 'USD',
          overrides: {
            coingecko: {
              LINK: 'chainlink',
            },
          },
        }),
        operand2Sources: ['tiingo'],
        operand2Input: JSON.stringify({
          from: 'ETH',
          to: 'USD',
          overrides: {
            coingecko: {
              ETH: 'ethereum',
            },
          },
        }),
        operation: 'multiply',
      }
      mockDPResponseSuccess('tiingo', 10)
      mockDPResponseSuccess('ncfx', 20)
      mockDPResponseSuccess('elwood', 5)
      const response = await testAdapter.request(data)
      expect(response.statusCode).toBe(500)
      expect(response.json()).toMatchSnapshot()
    })

    it('should return error for minimum number of operand 1 sources', async () => {
      const data = {
        operand1Sources: ['ncfx', 'elwood'],
        operand1Input: JSON.stringify({
          from: 'LINK',
          to: 'USD',
          overrides: {
            coingecko: {
              LINK: 'chainlink',
            },
          },
        }),
        operand1MinAnswers: 2,
        operand2Sources: ['tiingo'],
        operand2Input: JSON.stringify({
          from: 'ETH',
          to: 'USD',
          overrides: {
            coingecko: {
              ETH: 'ethereum',
            },
          },
        }),
        operation: 'divide',
      }
      nock.cleanAll()
      mockDPResponseSuccess('tiingo', 10)
      mockDPResponseSuccess('ncfx', 20)
      mockDPResponseError('elwood')
      const response = await testAdapter.request(data)
      expect(response.statusCode).toBe(502)
      expect(response.json()).toMatchSnapshot()
    })

    it('should return error for minimum number of operand 2 sources', async () => {
      const data = {
        operand1Sources: ['ncfx'],
        operand1Input: JSON.stringify({
          from: 'LINK',
          to: 'USD',
          overrides: {
            coingecko: {
              LINK: 'chainlink',
            },
          },
        }),
        operand1MinAnswers: 1,
        operand2Sources: ['tiingo', 'elwood'],
        operand2Input: JSON.stringify({
          from: 'ETH',
          to: 'USD',
          overrides: {
            coingecko: {
              ETH: 'ethereum',
            },
          },
        }),
        operand2MinAnswers: 2,
        operation: 'multiply',
      }
      mockDPResponseSuccess('tiingo', 10)
      mockDPResponseSuccess('ncfx', 20)
      mockDPResponseError('elwood')
      const response = await testAdapter.request(data)
      expect(response.statusCode).toBe(502)
      expect(response.json()).toMatchSnapshot()
    })

    it('should return success for legacy divisions', async () => {
      const data = {
        dividendSources: ['ncfx'],
        dividendInput: JSON.stringify({
          from: 'LINK',
          to: 'USD',
          overrides: {
            coingecko: {
              LINK: 'chainlink',
            },
          },
        }),
        divisorSources: ['tiingo', 'elwood'],
        divisorInput: JSON.stringify({
          from: 'ETH',
          to: 'USD',
          overrides: {
            coingecko: {
              ETH: 'ethereum',
            },
          },
        }),
      }
      mockDPResponseSuccess('tiingo', 10)
      mockDPResponseSuccess('ncfx', 20)
      mockDPResponseSuccess('elwood', 5)
      const response = await testAdapter.request(data)
      expect(response.statusCode).toBe(200)
      expect(response.json()).toMatchSnapshot()
    })

    it('should return success for partial source success', async () => {
      const data = {
        dividendSources: ['ncfx', 'tiingo'],
        dividendInput: JSON.stringify({
          from: 'LINK',
          to: 'USD',
          overrides: {
            coingecko: {
              LINK: 'chainlink',
            },
          },
        }),
        divisorSources: ['tiingo', 'elwood'],
        divisorInput: JSON.stringify({
          from: 'ETH',
          to: 'USD',
          overrides: {
            coingecko: {
              ETH: 'ethereum',
            },
          },
        }),
      }
      mockDPResponseError('tiingo')
      mockDPResponseSuccess('ncfx', 20)
      mockDPResponseSuccess('elwood', 5)
      const response = await testAdapter.request(data)
      expect(response.statusCode).toBe(200)
      expect(response.json()).toMatchSnapshot()
    })

    it('should return success for multiply', async () => {
      const data = {
        operand1Sources: ['ncfx', 'elwood'],
        operand1MinAnswers: 1,
        operand1Input: JSON.stringify({
          from: 'LINK',
          to: 'USD',
          overrides: {
            coingecko: {
              LINK: 'chainlink',
            },
          },
        }),
        operand2Sources: ['tiingo'],
        operand2MinAnswers: 1,
        operand2Input: JSON.stringify({
          from: 'ETH',
          to: 'USD',
          overrides: {
            coingecko: {
              ETH: 'ethereum',
            },
          },
        }),
        operation: 'multiply',
      }
      mockDPResponseSuccess('tiingo', 10)
      mockDPResponseSuccess('ncfx', 20)
      mockDPResponseSuccess('elwood', 5)
      const response = await testAdapter.request(data)
      expect(response.statusCode).toBe(200)
      expect(response.json()).toMatchSnapshot()
    })

    it('should return success for divide', async () => {
      const data = {
        operand1Sources: ['ncfx', 'elwood'],
        operand1Input: JSON.stringify({
          from: 'LINK',
          to: 'USD',
          overrides: {
            coingecko: {
              LINK: 'chainlink',
            },
          },
        }),
        operand2Sources: ['tiingo'],
        operand2Input: JSON.stringify({
          from: 'ETH',
          to: 'USD',
          overrides: {
            coingecko: {
              ETH: 'ethereum',
            },
          },
        }),
        operation: 'divide',
      }
      mockDPResponseSuccess('tiingo', 10)
      mockDPResponseSuccess('ncfx', 20)
      mockDPResponseSuccess('elwood', 5)
      const response = await testAdapter.request(data)
      expect(response.statusCode).toBe(200)
      expect(response.json()).toMatchSnapshot()
    })
  })
})
