import {
  TestAdapter,
  setEnvVariables,
} from '@chainlink/external-adapter-framework/util/testing-utils'
import * as nock from 'nock'
import { mockResponseSuccess } from './fixtures'

jest.mock('ethers', () => {
  const actualModule = jest.requireActual('ethers')
  return {
    JsonRpcProvider: jest.fn(),
    Contract: function (address: string) {
      if (address == 'registry') {
        return {
          getParametersForAsset: jest.fn().mockImplementation(() => {
            return {
              maxExpectedApy: '25',
              upperBoundTolerance: '50',
              lowerBoundTolerance: '50',
              maxDiscount: '25',
              isUpperBoundEnabled: true,
              isLowerBoundEnabled: true,
            }
          }),
          getOracle: jest.fn().mockImplementation(() => {
            return 'proxy'
          }),
          getLookbackData: jest.fn().mockImplementation(() => {
            return {
              answer: '1000',
              updatedAt: 86400 / 2,
            }
          }),
        }
      } else if (address == 'proxy') {
        return {
          decimals: jest.fn().mockImplementation(() => {
            return '3'
          }),
          aggregator: jest.fn().mockImplementation(() => {
            return 'aggregator'
          }),
        }
      } else if (address == 'aggregator') {
        return {
          decimals: jest.fn().mockImplementation(() => {
            return '3'
          }),
          latestRoundData: jest.fn().mockImplementation(() => {
            return {
              answer: '1000',
              updatedAt: 86400 / 2,
            }
          }),
        }
      } else {
        throw new Error(`${address} not mocked`)
      }
    },
    parseUnits: actualModule.parseUnits,
  }
})

describe('execute', () => {
  let spy: jest.SpyInstance
  let testAdapter: TestAdapter
  let oldEnv: NodeJS.ProcessEnv

  beforeAll(async () => {
    oldEnv = JSON.parse(JSON.stringify(process.env))

    process.env.ETHEREUM_RPC_URL = 'fake-rpc-url'
    process.env.EA_EA_URL = 'http://fake-ea-url'
    process.env.BACKGROUND_EXECUTE_MS = process.env.BACKGROUND_EXECUTE_MS ?? '0'

    spy = jest.spyOn(Date, 'now').mockReturnValue(86400000)

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

  describe('nav endpoint', () => {
    it('should return success', async () => {
      const data = {
        source: 'ea',
        sourceInput: '{"param":"1"}',
        asset: '0x0',
        registry: 'registry',
      }
      mockResponseSuccess()
      const response = await testAdapter.request(data)
      expect(response.statusCode).toBe(200)
      expect(response.json()).toMatchSnapshot()
    })
  })
})
