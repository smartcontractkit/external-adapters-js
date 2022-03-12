import { Requester } from '@chainlink/ea-bootstrap'
import { assertError } from '@chainlink/ea-test-helpers'
import { AdapterRequest } from '@chainlink/types'
import { makeExecute } from '../../src/adapter'
import { execute as bethExecute } from '../../src/endpoint/price/beth'
// import { execute as blunaExecute } from '../../src/endpoint/price/bluna'
import { ethers } from 'ethers'

jest.mock('ethers', () => {
  const actualModule = jest.requireActual('ethers')
  return {
    ...actualModule,
    ethers: {
      ...actualModule.ethers,
      providers: {
        JsonRpcProvider: function () {
          return {}
        },
      },
      Contract: function () {
        return {
          get_rate: () => jest.fn(),
          get_dy: () => jest.fn(),
        }
      },
    },
  }
})

describe('execute', () => {
  beforeAll(() => {
    process.env.ETHEREUM_RPC_URL = 'fake-url'
    process.env.ANCHOR_VAULT_CONTRACT_ADDRESS = 'fake-address'
    process.env.API_KEY = 'fake-key'
  })

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('beth execute with decimal precision', async () => {
    const input: AdapterRequest = { id: '1', data: { from: 'BETH', to: 'USD' } }
    const config = {
      rpcUrl: '',
      stEthPoolContractAddress: '',
      anchorVaultContractAddress: '',
      terraBLunaHubContractAddress: '',
      feedAddresses: {},
    }

    const stEthBEthString = '1' + '0'.repeat(10)
    const stEthEthString = '1' + '0'.repeat(20)
    const usdEthString = '1' + '0'.repeat(30)

    const stEthBEth = ethers.BigNumber.from(stEthBEthString)
    const stEthEth = ethers.BigNumber.from(stEthEthString)
    const usdEth = ethers.BigNumber.from(usdEthString)

    // (USD / ETH) * (stETH / bETH) * (ETH / stETH) = USD / bETH
    const expected = '1' + '0'.repeat(20)

    //@ts-expect-error ethers.Contract must be mocked this way
    ethers.Contract = jest.fn(function () {
      return {
        get_rate: () => stEthBEth,
        get_dy: () => stEthEth,
      }
    })

    const result = await bethExecute(input, {}, config, usdEth)
    expect(result.toString()).toEqual(expected)
  })

  // describe('bluna execute', () => {

  // })

  describe('validation error', () => {
    const jobID = '1'
    const execute = makeExecute()

    const requests = [
      { name: 'empty body', testData: {} },
      { name: 'empty data', testData: { data: {} } },
      {
        name: 'empty from',
        testData: { id: jobID, data: { to: 'ETH' } },
      },
      {
        name: 'empty to',
        testData: { id: jobID, data: { from: 'ETH' } },
      },
    ]

    requests.forEach((req) => {
      it(`${req.name}`, async () => {
        try {
          await execute(req.testData as AdapterRequest, {})
        } catch (error) {
          const errorResp = Requester.errored(jobID, error)
          assertError({ expected: 400, actual: errorResp.statusCode }, errorResp, jobID)
        }
      })
    })
  })
})
