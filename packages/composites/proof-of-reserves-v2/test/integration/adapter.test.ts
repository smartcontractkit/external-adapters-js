import {
  TestAdapter,
  setEnvVariables,
} from '@chainlink/external-adapter-framework/util/testing-utils'
import * as nock from 'nock'
import { mockProviderResponse } from './fixtures'

const POR_ADDRESS_LIST_URL = 'https://por.address.list'
const TOKEN_BALANCE_URL = 'https://token.balance'

describe('execute', () => {
  let spy: jest.SpyInstance
  let testAdapter: TestAdapter
  let oldEnv: NodeJS.ProcessEnv

  beforeAll(async () => {
    oldEnv = JSON.parse(JSON.stringify(process.env))
    process.env.POR_ADDRESS_LIST_URL = POR_ADDRESS_LIST_URL
    process.env.TOKEN_BALANCE_URL = TOKEN_BALANCE_URL
    process.env.BACKGROUND_EXECUTE_MS = process.env.BACKGROUND_EXECUTE_MS ?? '0'
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

  describe('reserves endpoint', () => {
    it('should return success', async () => {
      const addressListParams = { endpoint: 'addressList' }
      const balanceParams = { endpoint: 'evm' }
      const data = {
        addressLists: [
          {
            name: 'list1',
            provider: 'por-address-list',
            params: JSON.stringify(addressListParams),
            addressArrayPath: 'data.result',
          },
        ],
        balanceSources: [
          {
            name: 'source1',
            provider: 'token-balance',
            params: JSON.stringify(balanceParams),
            addressArrayPath: 'addresses',
            balancesArrayPath: 'data.wallets',
            balancePath: 'balance',
            decimalsPath: 'decimals',
          },
        ],
        components: [
          {
            name: 'component1',
            currency: 'USDC',
            addressList: 'list1',
            balanceSource: 'source1',
            conversions: [],
          },
        ],
        conversions: [],
        resultDecimals: 18,
      }

      const addressArray = [
        {
          address: '0x0123',
        },
      ]
      mockProviderResponse(POR_ADDRESS_LIST_URL, addressListParams, {
        data: {
          result: addressArray,
        },
      })
      mockProviderResponse(
        TOKEN_BALANCE_URL,
        { ...balanceParams, addresses: addressArray },
        {
          data: {
            wallets: [
              {
                balance: '123000',
                decimals: 6,
              },
            ],
          },
        },
      )
      const response = await testAdapter.request(data)
      expect(response.json()).toMatchSnapshot()
      expect(response.statusCode).toBe(200)
    })
  })
})
