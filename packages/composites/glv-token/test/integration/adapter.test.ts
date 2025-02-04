import {
  TestAdapter,
  setEnvVariables,
} from '@chainlink/external-adapter-framework/util/testing-utils'
import * as nock from 'nock'
import {
  mockCoinmetricsEAResponseSuccess,
  mockNCFXEAResponseSuccess,
  mockTiingoEAResponseSuccess,
} from './fixtures'
import { ethers } from 'ethers'

jest.mock('ethers', () => ({
  ...jest.requireActual('ethers'),
  ethers: {
    providers: {
      JsonRpcProvider: function (): ethers.providers.JsonRpcProvider {
        return {} as ethers.providers.JsonRpcProvider
      },
    },
    Contract: function () {
      return {
        getGlvInfo: () => {
          return {
            glv: {
              glvToken: '0x528A5bac7E746C9A509A1f4F6dF58A03d44279F9',
              longToken: '0x82aF49447D8a07e3bd95BD0d56f35241523fBab1',
              shortToken: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831',
            },
            markets: ['0x70d95587d40A2caf56bd97485aB3Eec10Bee6336'],
          }
        },
        getGlvTokenPrice: (
          dataStoreContractAddr: string,
          marketAddresses: string[],
          indexTokenPrices: number[],
          longTokenPrice: number[],
          shortTokenPrice: number[],
          glvAddress: string,
          maximize: boolean,
        ) => {
          if (maximize) {
            return [
              {
                _hex: '0x0e7b25fe03f0eda42ead663c4f',
                _isBigNumber: true,
              },
              {
                _hex: '0x1023b38579fd89d222cb251e176c4826',
                _isBigNumber: true,
              },
              { _hex: '0x0dc3092ed23a446cb3fe99', _isBigNumber: true },
            ]
          }
          return [
            {
              _hex: '0x0e7a4edfc978cf077056d4bea6',
              _isBigNumber: true,
            },
            {
              _hex: '0x102445f11382dc2e29e06362a1c7a8d6',
              _isBigNumber: true,
            },
            { _hex: '0x0dc3092ed23a446cb3fe99', _isBigNumber: true },
          ]
        },
      }
    },
  },
}))

describe('execute', () => {
  let spy: jest.SpyInstance
  let testAdapter: TestAdapter
  let oldEnv: NodeJS.ProcessEnv

  beforeAll(async () => {
    oldEnv = JSON.parse(JSON.stringify(process.env))
    process.env.TIINGO_ADAPTER_URL = process.env.TIINGO_ADAPTER_URL ?? 'http://localhost:8081'
    process.env.NCFX_ADAPTER_URL = process.env.NCFX_ADAPTER_URL ?? 'http://localhost:8082'
    process.env.COINMETRICS_ADAPTER_URL =
      process.env.COINMETRICS_ADAPTER_URL ?? 'http://localhost:8083'
    process.env.ARBITRUM_RPC_URL = process.env.ARBITRUM_RPC_URL ?? 'http://localhost:3040'
    process.env.RETRY = process.env.RETRY ?? '0'
    process.env.BACKGROUND_EXECUTE_MS = '0'
    process.env.METADATA_REFRESH_INTERVAL_MS = '0'

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

  describe('price endpoint', () => {
    it('should return success', async () => {
      const data = {
        glv: '0x528A5bac7E746C9A509A1f4F6dF58A03d44279F9',
      }
      mockTiingoEAResponseSuccess('ETH')
      mockNCFXEAResponseSuccess('ETH')
      mockCoinmetricsEAResponseSuccess('ETH')
      const response = await testAdapter.request(data)
      expect(response.statusCode).toBe(200)
      expect(response.json()).toMatchSnapshot()
    })
  })
})
