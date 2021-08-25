import { AdapterRequest, Execute } from '@chainlink/types'
import * as apyFinanceAdapter from "../../src/index"
import { ethers } from 'ethers'
import { mockTiingoResponse } from './fixtures'

const mockData = {
    '1': {
        symbol: 'WETH',
        balance: 100,
        decimals: 18
    },
    '2': {
        symbol: 'LINK',
        balance: 300,
        decimals: 18
    }
}

const mockRegistry = {
    chainlinkRegistryAddress: () => "mock-address",
    getAssetAllocationIds: () => ['1', '2'],
    symbolOf: (id: string) => mockData[id].symbol,
    balanceOf: (id: string) => mockData[id].balance,
    decimalsOf: (id: string) => mockData[id].decimals 
}

jest.mock("ethers", () => ({
  ...(jest.requireActual("ethers")),
  ethers: {
    providers: {
      JsonRpcProvider: function(_: string): ethers.provider.JsonRpcProvider { return {} } 
    },
    Contract: function() {
      return mockRegistry
    }
  }
}))



let oldEnv: NodeJS.ProcessEnv

beforeAll(() => {
  oldEnv = JSON.parse(JSON.stringify(process.env))
  process.env.REGISTRY_ADDRESS = process.env.REGISTRY_ADDRESS || "fake-registry-address" 
  process.env.TIINGO_DATA_PROVIDER_URL = process.env.TIINGO_DATA_PROVIDER_URL || "http://localhost:3000"
})

afterAll(() => {
  process.env = oldEnv
})

describe('execute', () => {
  let execute: Execute 
  const id = '1'

  beforeAll(async () => {
    execute = await apyFinanceAdapter.makeExecute()
  })

  describe("with request properly formatted", () => {
    mockTiingoResponse()
    const data: AdapterRequest = { 
      id,
      data: {
        "source": "tiingo"
      } 
    }

    it("should return success", async () => {
      const resp = await execute(data)
      expect(resp).toMatchSnapshot()
    })
  })
})
