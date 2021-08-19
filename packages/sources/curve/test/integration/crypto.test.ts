import { AdapterRequest, Execute } from '@chainlink/types'
import { ethers, BigNumber } from 'ethers'
import { makeExecute } from '../../src/adapter'
import * as process from 'process'

const mock_bn = BigNumber.from(1234)

jest.mock('ethers', () => ({
  ...jest.requireActual('ethers'),
  ethers: {
    providers: {
      JsonRpcProvider: function() {
        return {} as ethers.providers.JsonRpcProvider
      },
    },
    Contract: function() {
      return {
        decimals: () => {
          return new Promise((resolve) => resolve(6))
        },
        get_address: () => {
          return new Promise((resolve) => resolve('0x0'))
        },
        get_best_rate: () => {
          return new Promise((resolve) => resolve(['0x0', mock_bn]))
        },
      }
    },
    utils: {
      formatUnits: (num, decimals) => num / 10 ** decimals,
    },
  },
}))

let oldEnv: NodeJS.ProcessEnv

beforeAll(() => {
  oldEnv = JSON.parse(JSON.stringify(process.env))
  process.env.RPC_URL = process.env.RPC_URL || 'http://localhost:8546/'
  process.env.API_VERBOSE = process.env.API_VERBOSE || 'true'
})

afterAll(() => {
  process.env = oldEnv
})

describe('execute', () => {
  let execute: Execute
  const id = '1'

  beforeAll(async () => {
    execute = await makeExecute()
  })

  describe('with from/to', () => {
    const data: AdapterRequest = {
      id,
      data: {
        from: 'USDC',
        to: 'USDT',
      },
    }

    it('should return success', async () => {
      const resp = await execute(data, {})
      expect(resp).toMatchSnapshot()
    })
  })

  describe('with custom params', () => {
    const data: AdapterRequest = {
      id,
      data: {
        from: '0xBC6DA0FE9aD5f3b0d58160288917AA56653660E9',
        fromDecimals: 18,
        to: '0x6c3F90f043a72FA612cbac8115EE7e52BDe6E490',
        toDecimals: 18,
        amount: 10,
      },
    }

    it('should return success', async () => {
      const resp = await execute(data, {})
      expect(resp).toMatchSnapshot()
    })
  })
})
