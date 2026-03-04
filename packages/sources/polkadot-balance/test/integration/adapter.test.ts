import {
  TestAdapter,
  setEnvVariables,
} from '@chainlink/external-adapter-framework/util/testing-utils'
import * as nock from 'nock'

const getBalance = async (address: string) => {
  const mockPolkdotBalanceResponse1 = {
    toJSON: () => {
      return {
        nonce: 0,
        consumers: 1,
        providers: 1,
        sufficients: 0,
        data: {
          free: 10249387394,
          reserved: 554302492653803,
          frozen: 0,
          flags: '0x80000000000000000000000000000000',
        },
      }
    },
  }

  const mockPolkdotBalanceResponse2 = {
    toJSON: () => {
      return {
        nonce: 1,
        consumers: 3,
        providers: 1,
        sufficients: 0,
        data: {
          free: 536730221406,
          reserved: '0x000000000000000000241c10a172ae51',
          frozen: 0,
          flags: '0x80000000000000000000000000000000',
        },
      }
    },
  }

  const mockPolkdotBalanceResponse3 = {
    toJSON: () => {
      return {
        nonce: 1,
        consumers: 1,
        providers: 1,
        sufficients: 0,
        data: {
          free: '0x000000000000000000259411d5308d02',
          reserved: 0,
          frozen: 0,
          flags: '0x80000000000000000000000000000000',
        },
      }
    },
  }

  const addressBalanceMap: Record<string, any> = {
    '13nogjgyJcGQduHt8RtZiKKbt7Uy6py9hv1WMDZWueEcsHdh': mockPolkdotBalanceResponse1,
    '126rjyDQEJm6V6YPDcN85hJDYraqB6hL9bFsvWLDnM8rLc3J': mockPolkdotBalanceResponse2,
    '15vJFD1Y8nButjmgjbK5x6SYU2cQnbihM4GgkR5enkwyTVLq': mockPolkdotBalanceResponse3,
  }

  return addressBalanceMap[address]
}

getBalance.multi = async (addresses: string[]) => {
  const results = await Promise.all(addresses.map((addr) => getBalance(addr)))
  return results.map((res) => res.toJSON())
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
})
