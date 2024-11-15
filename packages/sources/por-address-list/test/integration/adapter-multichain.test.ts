import {
  TestAdapter,
  setEnvVariables,
} from '@chainlink/external-adapter-framework/util/testing-utils'
import * as nock from 'nock'
import { ethers } from 'ethers'

const mockExpectedAddresses = [
  {
    tokenSymbol: 'BTCB',
    chain: 'bnb',
    chainId: 56,
    tokenAddress: 'token1',
    vaultAddress: 'vault1',
  },
  {
    tokenSymbol: 'BTCB',
    chain: 'bnb',
    chainId: 56,
    tokenAddress: 'token1',
    vaultAddress: 'vault2',
  },
  {
    tokenSymbol: 'B2 BTC',
    chain: 'b2',
    chainId: 223,
    tokenAddress: 'token3',
    vaultAddress: 'vault3',
  },
]

const mockAddressListLength = ethers.BigNumber.from(mockExpectedAddresses.length)

jest.mock('ethers', () => {
  const actualModule = jest.requireActual('ethers')
  return {
    ...actualModule,
    ethers: {
      ...actualModule.ethers,
      providers: {
        JsonRpcProvider: function () {
          return {
            getBlockNumber: jest.fn().mockReturnValue(1000),
          }
        },
      },
      Contract: function () {
        return {
          getPoRAddressListLength: jest.fn().mockReturnValue(mockAddressListLength),
          getPoRAddressList: jest.fn().mockImplementation((startIdx, endIdx) => {
            const start = startIdx.toNumber()
            const end = endIdx.toNumber() + 1
            return mockExpectedAddresses.slice(start, end)
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
    process.env.RPC_URL = process.env.RPC_URL ?? 'http://localhost:8545'
    process.env.BSC_RPC_URL = process.env.BSC_RPC_URL ?? 'http://bsc'
    process.env.BSC_RPC_CHAIN_ID = process.env.BSC_RPC_CHAIN_ID ?? '56'
    process.env.BACKGROUND_EXECUTE_MS = '0'
    const mockDate = new Date('2001-01-01T11:11:11.111Z')
    spy = jest.spyOn(Date, 'now').mockReturnValue(mockDate.getTime())

    const adapter = (await import('./../../src')).adapter
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

  describe('multichainAddress endpoint', () => {
    it('should return success', async () => {
      const data = {
        endpoint: 'multichainAddress',
        contractAddress: 'mock-contract-address',
        contractAddressNetwork: 'BSC',
      }
      const response = await testAdapter.request(data)
      expect(response.statusCode).toBe(200)
      expect(response.json()).toMatchSnapshot()
    })
  })
})
