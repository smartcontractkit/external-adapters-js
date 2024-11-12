import { AdapterRequest, Execute } from '@chainlink/ea-bootstrap'
import * as adaBalance from '../../src/'
import '@cardano-ogmios/client'
import '../../src/endpoint/ogmios'
import { InteractionContext } from '@cardano-ogmios/client'
import 'ws'
import { setEnvVariables } from '@chainlink/ea-test-helpers'

const TEST_HTTP_ENDPOINT = 'http://test-ogmios-url.com'
const TEST_WS_ENDPOINT = 'wss://test-ogmios-url.com'

jest.mock('../../src/endpoint/ogmios', () => ({
  createInteractionContext: (): InteractionContext => {
    return {
      connection: {
        host: 'test-endpoint',
        port: 1337,
        maxPayload: 1000,
        address: {
          http: TEST_HTTP_ENDPOINT,
          webSocket: TEST_WS_ENDPOINT,
        },
        tls: false,
      },
      socket: jest.mock('ws'),
      afterEach: jest.fn(),
    }
  },
}))

jest.mock('@cardano-ogmios/client', () => {
  return {
    getServerHealth: () => ({
      lastTipUpdate: '2022-01-15T18:56:42.635812292Z',
    }),
    StateQuery: {
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
    },
  }
})

let oldEnv: NodeJS.ProcessEnv

beforeAll(() => {
  oldEnv = JSON.parse(JSON.stringify(process.env))
  process.env.WS_OGMIOS_URL = TEST_WS_ENDPOINT
  process.env.HTTP_OGMIOS_URL = TEST_HTTP_ENDPOINT
})

afterAll(() => {
  setEnvVariables(oldEnv)
})

describe('execute', () => {
  let execute: Execute
  const id = '1'

  beforeAll(() => {
    execute = adaBalance.makeExecute() as Execute
  })

  describe('fetch wallet balance', () => {
    const data: AdapterRequest = {
      id,
      data: {
        addresses: [
          {
            address:
              'addr_test1qz87tn9yat3xfutzds43tnj8qw457hk3v46w4028rtnx56v89wjwnrwcvlfm2atvcnnclh3x7thwrl7pgnffaw24mgws0dga4m',
          },
        ],
      },
    }

    it('should return success', async () => {
      const resp = await execute(data, {})
      expect(resp).toMatchSnapshot()
    })
  })
})
