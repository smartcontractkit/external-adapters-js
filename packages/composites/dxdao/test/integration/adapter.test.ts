import { AdapterRequest, Execute } from '@chainlink/types'
import * as dxdaoAdapter from "../../src/index"
import { ethers } from 'ethers'

jest.mock("ethers", () => ({
  ...(jest.requireActual("ethers")),
  ethers: {
    providers: {
      JsonRpcProvider: function(_: string): ethers.provider.JsonRpcProvider { return {} } 
    },
    Contract: function() {
      return {
        balanceOf: (____: string) => {
          return {
            _hex: '0x0c3f8fe18611f5a7cb'
          }
        }
      }
    }
  }
}))

jest.mock("@chainlink/token-allocation-adapter", () => ({
  ...(jest.requireActual("@chainlink/token-allocation-adapter")),
  makeExecute: jest.fn().mockReturnValue({
    result: 2000
  })
}))

let oldEnv: NodeJS.ProcessEnv

beforeAll(() => {
  oldEnv = JSON.parse(JSON.stringify(process.env))
  process.env.RPC_URL = process.env.RPC_URL || "https://rpc.xdaichain.com/" 
})

afterAll(() => {
  process.env = oldEnv
})

describe('execute', () => {
  let execute: Execute 
  const id = '1'

  beforeAll(async () => {
    execute = await dxdaoAdapter.makeExecute()
  })

  describe("with xdaiEthUsdPriceFeedAddress", () => {
    const data: AdapterRequest = { 
      id,
      data: {
        "wethContractAddress": "0x6A023CCd1ff6F2045C3309768eAd9E68F978f6e1",
        "pairContractAddress": "0x1bDe964eCd52429004CbC5812C07C28bEC9147e9",
        "xdaiEthUsdPriceFeedAddress": "0xa767f745331D267c7751297D982b050c93985627"
      } 
    }

    it("should return success", async () => {
      const resp = await execute(data)
      expect(resp).toMatchSnapshot()
    })
  })

  describe("without xdaiEthUsdPriceFeedAddress", () => {
    const data: AdapterRequest = { 
      id,
      data: {
        "wethContractAddress": "0x6A023CCd1ff6F2045C3309768eAd9E68F978f6e1",
        "pairContractAddress": "0x1bDe964eCd52429004CbC5812C07C28bEC9147e9"
      } 
    }

    it("should return success", async () => {
      const resp = await execute(data)
      expect(resp).toMatchSnapshot()
    })
  })
})
