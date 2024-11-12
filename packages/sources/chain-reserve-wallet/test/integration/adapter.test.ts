import { AdapterRequest, Execute } from '@chainlink/ea-bootstrap'
import { makeExecute } from '../../src'
import { ethers } from 'ethers'
import { setEnvVariables } from '@chainlink/ea-test-helpers'

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
        walletAddresses: () => {
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
    execute = makeExecute() as Execute
  })

  afterAll(() => {
    setEnvVariables(oldEnv)
  })

  describe('when making a request to fetch the contract addresses', () => {
    const data: AdapterRequest = {
      id: '1',
      data: {
        chainId: 'testnet',
        network: 'cardano',
        contractAddress: '0xAe1932a83DeD75db2afD1E4EC6c0D4241554100A',
      },
    }

    it('is successful', async () => {
      const response = await execute(data, {})
      expect(response).toMatchSnapshot()
    })
  })
})
