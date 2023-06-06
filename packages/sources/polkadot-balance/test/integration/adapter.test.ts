import {
  TestAdapter,
  setEnvVariables,
} from '@chainlink/external-adapter-framework/util/testing-utils'
import * as nock from 'nock'
import { Adapter } from '@chainlink/external-adapter-framework/adapter'

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
              account: function (address: string) {
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
                return new Promise((resolve) => {
                  resolve(addressBalanceMap[address])
                })
              },
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
    const mockDate = new Date('2022-08-01T07:14:54.909Z')
    spy = jest.spyOn(Date, 'now').mockReturnValue(mockDate.getTime())

    const adapter = (await import('./../../src')).adapter as unknown as Adapter
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
})
