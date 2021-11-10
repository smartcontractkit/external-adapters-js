import { AdapterRequest, Execute } from '@chainlink/types'
import * as adaBalance from '../../src/'
import '@cardano-ogmios/client'

jest.mock('@cardano-ogmios/client', () => {
  return {
    utxo: async () => [
      [
        {
          txId: '86a50ff8136e8b5d9f6f249a24330a5b43b657688021980f54bc887bc0cb7f4d',
          index: 0,
        },
        {
          address:
            'addr_test1qz87tn9yat3xfutzds43tnj8qw457hk3v46w4028rtnx56v89wjwnrwcvlfm2atvcnnclh3x7thwrl7pgnffaw24mgws0dga4m',
          value: {
            coins: 5000000,
            assets: {},
          },
          datum: null,
        },
      ],
    ],
  }
})

let oldEnv: NodeJS.ProcessEnv

beforeAll(() => {
  oldEnv = JSON.parse(JSON.stringify(process.env))
  process.env.WS_API_ENDPOINT = 'test-endpoint'
})

afterAll(() => {
  process.env = oldEnv
})

describe('execute', () => {
  let execute: Execute
  const id = '1'

  beforeAll(() => {
    execute = adaBalance.makeExecute()
  })

  describe('fetch wallet balance', () => {
    const data: AdapterRequest = {
      id,
      data: {
        addresses: [
          'addr_test1qz87tn9yat3xfutzds43tnj8qw457hk3v46w4028rtnx56v89wjwnrwcvlfm2atvcnnclh3x7thwrl7pgnffaw24mgws0dga4m',
        ],
      },
    }

    it('should return success', async () => {
      const resp = await execute(data, {})
      expect(resp).toMatchSnapshot()
    })
  })
})
