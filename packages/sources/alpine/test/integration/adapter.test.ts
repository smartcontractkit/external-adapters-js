import { AdapterRequest, Execute } from '@chainlink/types'
import { makeExecute } from '../../src'
import { ethers } from 'ethers'

jest.mock('ethers', () => ({
  ...jest.requireActual('ethers'),
  ethers: {
    providers: {
      JsonRpcProvider: function (_: string): ethers.providers.JsonRpcProvider {
        return {}
      },
    },
    Contract: function () {
      return {
        totalAssets: () => {
          return 5000
        },
        lastBlock: () => {
          return 50
        },
      }
    },
  },
}))

describe('alpine', () => {
  let execute: Execute

  beforeAll(async () => {
    execute = makeExecute()
  })

  describe('tvl', () => {
    const data: AdapterRequest = {
      id: '1',
      data: {
        vaultAddress: '0xA0F3BC193651c902C0cae9779c6E7F10761bF2Ac',
        endpoint: 'tvl',
      },
    }

    it('can get tvl', async () => {
      const response = await execute(data, {})
      expect(response).toMatchSnapshot()
    })
  })

  describe('lastblock', () => {
    const data: AdapterRequest = {
      id: '1',
      data: {
        stagingAddress: '0x8635Ec536F0125cf6B766ed67B4A37Dcb76eb508',
        endpoint: 'lastblock',
      },
    }

    it('can get blockNum', async () => {
      const response = await execute(data, {})
      expect(response).toMatchSnapshot()
    })
  })
})
