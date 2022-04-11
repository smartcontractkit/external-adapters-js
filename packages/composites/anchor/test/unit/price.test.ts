import { Requester } from '@chainlink/ea-bootstrap'
import { assertError } from '@chainlink/ea-test-helpers'
import { AdapterRequest } from '@chainlink/types'
import { makeExecute } from '../../src/adapter'
import { execute as bethExecute } from '../../src/endpoint/price/beth'
import { execute as blunaExecute } from '../../src/endpoint/price/bluna'
import { ethers } from 'ethers'
import { callViewFunctionEA } from '../../src/utils'

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
          get_rate: jest.fn(),
          get_dy: jest.fn(),
        }
      },
    },
  }
})

jest.mock('../../src/utils', () => {
  const actualModule = jest.requireActual('../../src/utils')
  return {
    ...actualModule,
    callViewFunctionEA: jest.fn(),
  }
})

describe('execute', () => {
  beforeAll(() => {
    process.env.ETHEREUM_RPC_URL = 'fake-url'
    process.env.ANCHOR_VAULT_CONTRACT_ADDRESS = 'fake-address'
    process.env.API_KEY = 'fake-key'
    process.env.LOCALTERRA_LCD_URL = 'fake-lcd-url'
  })

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('decimal precision', () => {
    const input: AdapterRequest = { id: '1', data: { from: 'BETH', to: 'USD' } }
    const config = {
      rpcUrl: '',
      stEthPoolContractAddress: '',
      anchorVaultContractAddress: '',
      terraBLunaHubContractAddress: '',
      feedAddresses: {},
    }

    it('beth execute responds with correct precision', async () => {
      const bEthStEthString = '1' + '0'.repeat(150)
      const ethStETHString = '1' + '0'.repeat(50)
      const usdEthString = '1' + '0'.repeat(300)

      const bEthStEth = ethers.BigNumber.from(bEthStEthString)
      const ethStETH = ethers.BigNumber.from(ethStETHString)
      const usdEth = ethers.BigNumber.from(usdEthString)

      // (USD / ETH) * (ETH / stETH) / (bETH / stETH) = USD / bETH
      const expected = '1' + '0'.repeat(200) // usdEthDecimals + ethStEthDecimals - bEthStEth decimals

      //@ts-expect-error ethers.Contract must be mocked this way
      ethers.Contract = jest.fn(function () {
        return {
          get_rate: () => bEthStEth,
          get_dy: () => ethStETH,
        }
      })

      const result = await bethExecute(input, {}, config, usdEth)
      expect(result.toString()).toEqual(expected)
    })

    it('bluna execute responds with correct precision', async () => {
      const lunaBLunaString = '1' + '0'.repeat(100)
      const usdLunaString = '1' + '0'.repeat(100)

      const usdLuna = ethers.BigNumber.from(usdLunaString)

      // (LUNA / bLUNA) * (USD / LUNA) = USD / bLUNA
      const expected = '1' + '0'.repeat(200)

      //@ts-expect-error callViewFunctionEA must be mocked this way
      callViewFunctionEA.mockReturnValue({ data: { result: { exchange_rate: lunaBLunaString } } })

      const result = await blunaExecute(input, {}, config, usdLuna)
      expect(result.toString()).toEqual(expected)
    })
  })

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
