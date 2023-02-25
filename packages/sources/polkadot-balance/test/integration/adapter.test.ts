import * as process from 'process'
import { AddressInfo } from 'net'
import { createAdapter, setEnvVariables } from './setup'
import request, { SuperTest, Test } from 'supertest'
import { expose, ServerInstance } from '@chainlink/external-adapter-framework'
import { AdapterRequestBody } from '@chainlink/external-adapter-framework/util'

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
  let fastify: ServerInstance | undefined
  let req: SuperTest<Test>
  let spy: jest.SpyInstance

  jest.setTimeout(10000)

  const addressData: AdapterRequestBody = {
    data: {
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
    },
  }

  let oldEnv: NodeJS.ProcessEnv

  beforeAll(async () => {
    oldEnv = JSON.parse(JSON.stringify(process.env))
    process.env['METRICS_ENABLED'] = 'false'
    process.env['RPC_URL'] = 'http://localhost:9091'
    const mockDate = new Date('2022-08-01T07:14:54.909Z')
    spy = jest.spyOn(Date, 'now').mockReturnValue(mockDate.getTime())

    fastify = await expose(createAdapter())
    req = request(`http://localhost:${(fastify?.server.address() as AddressInfo).port}`)
  })

  afterAll((done) => {
    spy.mockRestore()
    setEnvVariables(oldEnv)
    fastify?.close(done())
  })

  it('should return success', async () => {
    const makeRequest = () =>
      req
        .post('/')
        .send(addressData)
        .set('Accept', '*/*')
        .set('Content-Type', 'application/json')
        .expect('Content-Type', /json/)

    const response = await makeRequest()
    expect(response.body).toMatchSnapshot()
  }, 30000)
  it('should return error (empty body)', async () => {
    const makeRequest = () =>
      req
        .post('/')
        .send({})
        .set('Accept', '*/*')
        .set('Content-Type', 'application/json')
        .expect('Content-Type', /json/)

    const response = await makeRequest()
    expect(response.statusCode).toEqual(400)
  }, 30000)
  it('should return error (empty data)', async () => {
    const makeRequest = () =>
      req
        .post('/')
        .send({ data: {} })
        .set('Accept', '*/*')
        .set('Content-Type', 'application/json')
        .expect('Content-Type', /json/)

    const response = await makeRequest()
    expect(response.statusCode).toEqual(400)
  }, 30000)
})
