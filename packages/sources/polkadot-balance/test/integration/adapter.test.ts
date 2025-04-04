import { sleep } from '@chainlink/external-adapter-framework/util'
import {
  TestAdapter,
  setEnvVariables,
} from '@chainlink/external-adapter-framework/util/testing-utils'
import * as nock from 'nock'

let delayResponse = false
const resolvers: (() => void)[] = []

const getBalance = async (address: string) => {
  const mockPolkdotBalanceResponse1 = {
    toJSON: () => {
      return {
        nonce: 0,
        consumers: 2,
        providers: 1,
        sufficients: 0,
        data: {
          free: '0x0000000000000000002737faef46c49e',
          reserved: 0,
          miscFrozen: '0x0000000000000000002737faef46c49e',
          feeFrozen: '0x0000000000000000002737faef46c49e',
        },
      }
    },
  }

  const mockPolkdotBalanceResponse2 = {
    toJSON: () => {
      return {
        nonce: 0,
        consumers: 2,
        providers: 1,
        sufficients: 0,
        data: {
          free: '0x0000000000000000002738e81252d2de',
          reserved: 0,
          miscFrozen: '0x0000000000000000002738e81252d2de',
          feeFrozen: '0x0000000000000000002738e81252d2de',
        },
      }
    },
  }

  const mockPolkdotBalanceResponse3 = {
    toJSON: () => {
      return {
        nonce: 0,
        consumers: 2,
        providers: 1,
        sufficients: 0,
        data: {
          free: '0x0000000000000000001397870f4b226f',
          reserved: 0,
          miscFrozen: '0x000000000000000000135158a141e105',
          feeFrozen: '0x000000000000000000135158a141e105',
        },
      }
    },
  }

  const addressBalanceMap: Record<string, any> = {
    '13nogjgyJcGQduHt8RtZiKKbt7Uy6py9hv1WMDZWueEcsHdh': mockPolkdotBalanceResponse1,
    '126rjyDQEJm6V6YPDcN85hJDYraqB6hL9bFsvWLDnM8rLc3J': mockPolkdotBalanceResponse2,
    '15vJFD1Y8nButjmgjbK5x6SYU2cQnbihM4GgkR5enkwyTVLq': mockPolkdotBalanceResponse3,
  }

  const delayedAddressBalanceMap: Record<string, any> = {
    '100000000000000000000000000000000000000000000001': mockPolkdotBalanceResponse1,
    '100000000000000000000000000000000000000000000002': mockPolkdotBalanceResponse2,
    '100000000000000000000000000000000000000000000003': mockPolkdotBalanceResponse3,
    '100000000000000000000000000000000000000000000004': mockPolkdotBalanceResponse1,
    '100000000000000000000000000000000000000000000005': mockPolkdotBalanceResponse2,
  }

  if (address in delayedAddressBalanceMap) {
    const response = delayedAddressBalanceMap[address]
    if (delayResponse) {
      return new Promise((resolve) => {
        resolvers.push(() => {
          resolve(response)
        })
      })
    }
    return response
  }

  return addressBalanceMap[address]
}

jest.mock('@polkadot/api', () => {
  return {
    WsProvider: jest.fn().mockImplementation(() => {
      return {}
    }),
    ApiPromise: {
      create: function () {
        return {
          query: {
            system: {
              account: getBalance,
            },
          },
        }
      },
    },
  }
})

describe('Balance Endpoint', () => {
  let spy: jest.SpyInstance
  let testAdapter: TestAdapter
  let oldEnv: NodeJS.ProcessEnv

  beforeAll(async () => {
    oldEnv = JSON.parse(JSON.stringify(process.env))
    process.env['RPC_URL'] = 'http://localhost:9091'
    process.env['BACKGROUND_EXECUTE_MS'] = '0'
    process.env['BATCH_SIZE'] = '2'
    const mockDate = new Date('2022-08-01T07:14:54.909Z')
    spy = jest.spyOn(Date, 'now').mockReturnValue(mockDate.getTime())

    const adapter = (await import('./../../src')).adapter
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

  it('should return success', async () => {
    const data = {
      addresses: [
        {
          address: '13nogjgyJcGQduHt8RtZiKKbt7Uy6py9hv1WMDZWueEcsHdh',
        },
        {
          address: '126rjyDQEJm6V6YPDcN85hJDYraqB6hL9bFsvWLDnM8rLc3J',
        },
        {
          address: '15vJFD1Y8nButjmgjbK5x6SYU2cQnbihM4GgkR5enkwyTVLq',
        },
      ],
    }
    const response = await testAdapter.request(data)
    expect(response.statusCode).toBe(200)
    expect(response.json()).toMatchSnapshot()
  })

  it('should return error (empty data)', async () => {
    const response = await testAdapter.request({})
    expect(response.statusCode).toEqual(400)
  })

  it('should return error (empty addresses)', async () => {
    const response = await testAdapter.request({ addresses: [] })
    expect(response.statusCode).toEqual(400)
    expect(response.json()).toMatchSnapshot()
  })

  it('should wait for the first group to finish before sending more requests', async () => {
    delayResponse = true

    const data = {
      addresses: [
        {
          address: '100000000000000000000000000000000000000000000001',
        },
        {
          address: '100000000000000000000000000000000000000000000002',
        },
        {
          address: '100000000000000000000000000000000000000000000003',
        },
        {
          address: '100000000000000000000000000000000000000000000004',
        },
        {
          address: '100000000000000000000000000000000000000000000005',
        },
      ],
    }

    expect(resolvers.length).toBe(0)
    const responsePromise = testAdapter.request(data)

    await sleep(50)
    expect(resolvers.length).toBe(2)

    resolvers[0]()
    resolvers[1]()

    await sleep(50)
    expect(resolvers.length).toBe(4)

    resolvers[2]()
    resolvers[3]()

    await sleep(50)
    expect(resolvers.length).toBe(5)

    // Because BACKGROUND_EXECUTE_MS is set to 0, the background handler will
    // immediately try to fetch the balance for addresses 1 and 2 again once
    // it gets the response for address 5 and if that doesn't get a response,
    // the test framework won't exit. So we disable delayResponse before
    // resolving the last request.
    delayResponse = false

    resolvers[4]()

    const response = await responsePromise
    expect(response.statusCode).toBe(200)
    expect(response.json()).toMatchSnapshot()

    delayResponse = false
    expect(resolvers.length).toBe(5)
  })
})
