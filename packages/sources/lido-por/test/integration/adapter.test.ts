import {
  TestAdapter,
  setEnvVariables,
} from '@chainlink/external-adapter-framework/util/testing-utils'
import { ethers } from 'ethers'
import * as nock from 'nock'
import { mockResponseSuccess, mockResponseFailure } from './fixtures'

jest.mock('ethers', () => {
  const actualModule = jest.requireActual('ethers')
  return {
    ...actualModule,
    ethers: {
      ...actualModule.ethers,
      providers: {
        JsonRpcProvider: function (): ethers.providers.JsonRpcProvider {
          return {} as ethers.providers.JsonRpcProvider
        },
      },
      Contract: function (address: string) {
        return {
          getBufferedEther: jest.fn().mockImplementation(() => {
            return '500'
          }),
          getWithdrawalCredentials: jest.fn().mockImplementation(() => {
            if (address == 'valid') {
              return '1'
            } else if (address == 'invalid') {
              return '2'
            }
            throw new Error('Method does not exist on this contract')
          }),
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
    process.env.RPC_URL = 'http://localhost:8545'
    process.env.CHAIN_ID = '1'
    process.env.ETHEREUM_CL_INDEXER_URL = 'http://ETHEREUM_CL_INDEXER_URL'
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

  describe('reserve endpoint', () => {
    it('should return success', async () => {
      const data = {
        lidoContract: 'valid',
      }
      mockResponseSuccess()
      const response = await testAdapter.request(data)
      expect(response.statusCode).toBe(200)
      expect(response.json()).toMatchSnapshot()
    })

    it('should return ripcord', async () => {
      const data = {
        lidoContract: 'invalid',
      }
      mockResponseFailure()
      const response = await testAdapter.request(data)
      expect(response.statusCode).toBe(502)
      expect(response.json()).toMatchSnapshot()
    })
  })
})
