import { AdapterRequest, Execute } from '@chainlink/ea-bootstrap'
import * as dxdaoAdapter from '../../src/index'
import { ethers, BigNumber } from 'ethers'

const mockBigNum = BigNumber.from(2000)

jest.mock('ethers', () => ({
  ...jest.requireActual('ethers'),
  ethers: {
    providers: {
      JsonRpcProvider: function (): ethers.providers.JsonRpcProvider {
        return {} as ethers.providers.JsonRpcBatchProvider
      },
    },
    Contract: function () {
      return {
        balanceOf: () => {
          return mockBigNum
        },
      }
    },
  },
}))

jest.mock('@chainlink/token-allocation-adapter', () => ({
  ...jest.requireActual('@chainlink/token-allocation-adapter'),
  makeExecute: jest.fn().mockReturnValue(() => ({
    jobRunID: '1',
    providerStatusCode: 200,
    data: {
      sources: [],
      payload: {
        WETH: {
          quote: {
            USD: {
              price: '2000',
            },
          },
        },
      },
      result: 2000,
    },
    result: 2000,
    statusCode: 200,
  })),
}))

let oldEnv: NodeJS.ProcessEnv

beforeAll(() => {
  oldEnv = JSON.parse(JSON.stringify(process.env))
  process.env.CACHE_ENABLED = 'false'
  process.env.XDAI_RPC_URL = process.env.XDAI_RPC_URL || 'https://rpc.xdaichain.com/'
  process.env.WETH_CONTRACT_ADDRESS =
    process.env.WETH_CONTRACT_ADDRESS || '0x6A023CCd1ff6F2045C3309768eAd9E68F978f6e1'
})

afterAll(() => {
  process.env = oldEnv
})

describe('execute', () => {
  let execute: Execute
  const id = '1'

  beforeAll(async () => {
    execute = (await dxdaoAdapter.makeExecute()) as Execute
  })

  describe('with source and pair contract addresses correctly provided', () => {
    const data: AdapterRequest = {
      id,
      data: {
        pairContractAddress: '0x1bDe964eCd52429004CbC5812C07C28bEC9147e9',
        source: 'tiingo',
      },
    }

    it('should return success', async () => {
      const resp = await execute(data, {})
      expect(resp).toMatchSnapshot()
    })
  })
})
