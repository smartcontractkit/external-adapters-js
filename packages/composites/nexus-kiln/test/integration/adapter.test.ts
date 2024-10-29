import {
  TestAdapter,
  setEnvVariables,
} from '@chainlink/external-adapter-framework/util/testing-utils'
import { ethers } from 'ethers'
import * as nock from 'nock'
import { mockGraphQL, mockEthBalance } from './fixtures'

jest.mock('ethers', () => {
  const actualModule = jest.requireActual('ethers')
  return {
    ...actualModule,
    ethers: {
      ...actualModule.ethers,
      providers: {
        JsonRpcProvider: function (): ethers.JsonRpcProvider {
          return {} as ethers.JsonRpcProvider
        },
      },
      Contract: function () {
        return {
          getELFeeRecipient: jest.fn().mockImplementation(() => {
            return 'A'
          }),
          getCLFeeRecipient: jest.fn().mockImplementation(() => {
            return 'B'
          }),
          getGlobalFee: jest.fn().mockImplementation(() => {
            return '500'
          }),
          calcNavInAsset: {
            staticCall: jest.fn().mockImplementation(() => {
              return '100'
            }),
          },
        }
      },
    },
  }
})

describe('execute', () => {
  let spy: jest.SpyInstance
  let testAdapter: TestAdapter
  let oldEnv: NodeJS.ProcessEnv

  beforeAll(async () => {
    oldEnv = JSON.parse(JSON.stringify(process.env))
    process.env.ETH_BALANCE_ADAPTER_URL = 'http://fake-eth-balance-adapter-url'
    process.env.ETHEREUM_RPC_URL = 'fake-ethereum-rpc-url'
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

  describe('calcNetShareValueInAsset endpoint', () => {
    it('should return success', async () => {
      const data = {
        calculatorContract: '1',
        quoteAsset: '2',
        nexusVaultContract: '3',
        kilnStakingContract: '4',
      }
      mockGraphQL()
      mockEthBalance()

      const response = await testAdapter.request(data)
      expect(response.statusCode).toBe(200)
      expect(response.json()).toMatchSnapshot()
    })
  })
})
