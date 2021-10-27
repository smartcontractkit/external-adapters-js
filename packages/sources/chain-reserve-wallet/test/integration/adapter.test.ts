import { AdapterRequest, Execute } from '@chainlink/types'
import { makeExecute } from '../../src'
import { ethers } from 'ethers'

jest.mock('ethers', () => ({
  ...jest.requireActual('ethers'),
  ethers: {
    providers: {
      JsonRpcProvider: function (_: string): ethers.provider.JsonRpcProvider {
        return {}
      },
    },
    Contract: function () {
      return {
        walletAddresses: (____: string) => {
          return [
            'addr_test1qz87tn9yat3xfutzds43tnj8qw457hk3v46w4028rtnx56v89wjwnrwcvlfm2atvcnnclh3x7thwrl7pgnffaw24mgws0dga4m',
          ]
        },
      }
    },
  },
}))

let oldEnv: NodeJS.ProcessEnv

describe('chain-reserve-wallet', () => {
  let execute: Execute

  beforeAll(async () => {
    oldEnv = JSON.parse(JSON.stringify(process.env))
    process.env.RPC_URL = process.env.RPC_URL || 'test-endpoint'
    execute = makeExecute()
  })

  afterAll(() => {
    process.env = oldEnv
  })

  describe('when making a request to fetch the contract addresses', () => {
    const data: AdapterRequest = {
      id: '1',
      data: {
        chainID: 0,
        contractAddress: '0xAe1932a83DeD75db2afD1E4EC6c0D4241554100A',
      },
    }

    it('is successful', async () => {
      const response = await execute(data, {})
      expect(response).toMatchSnapshot()
    })
  })
})
