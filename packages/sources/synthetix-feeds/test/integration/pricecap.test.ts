import {
  TestAdapter,
  setEnvVariables,
} from '@chainlink/external-adapter-framework/util/testing-utils'
import { ethers } from 'ethers'

export const SUSDE_USDE_ADDRESS = '0x0000000000000000000000000000000000000001'
export const USDE_USD_ADDRESS = '0x0000000000000000000000000000000000000002'

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
          decimals: jest.fn().mockImplementation(() => {
            switch (address) {
              case SUSDE_USDE_ADDRESS:
                return '18'
              case USDE_USD_ADDRESS:
                return '8'
              default:
                throw new Error('Method does not exist on this contract')
            }
          }),
          convertToAssets: jest.fn().mockImplementation(() => {
            switch (address) {
              case SUSDE_USDE_ADDRESS:
                return '1096998558350327369'
              default:
                throw new Error('Method does not exist on this contract')
            }
          }),
          latestAnswer: jest.fn().mockImplementation(() => {
            switch (address) {
              case USDE_USD_ADDRESS:
                return '199904861'
              default:
                throw new Error('Method does not exist on this contract')
            }
          }),
        }
      },
    },
  }
})

describe('synthetix feeds execute', () => {
  let spy: jest.SpyInstance
  let testAdapter: TestAdapter
  let oldEnv: NodeJS.ProcessEnv

  beforeAll(async () => {
    oldEnv = JSON.parse(JSON.stringify(process.env))
    process.env.RPC_URL = 'http://localhost:8545'
    process.env.CHAIN_ID = '1'
    process.env.BACKGROUND_EXECUTE_MS = '1000'

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
    spy.mockRestore()
  })

  describe('price endpoint', () => {
    it('sUSDe - USD success - $1 cap', async () => {
      const data = {
        base: 'sUSDe',
        quote: 'USD',
        base_address: SUSDE_USDE_ADDRESS,
        quote_address: USDE_USD_ADDRESS,
      }
      const response = await testAdapter.request(data)
      expect(response.statusCode).toBe(200)
      expect(response.json()).toMatchSnapshot()
    })
  })
})
