import * as process from 'process'
import { AddressInfo } from 'net'
import { createAdapter, setEnvVariables } from './setup'
import request, { SuperTest, Test } from 'supertest'
import { expose, ServerInstance } from '@chainlink/external-adapter-framework'
import { addressData, mockEthers, mockGetEthBalances, mockGetValidatorStates } from './fixture'

describe('Balance Endpoint', () => {
  let fastify: ServerInstance | undefined
  let req: SuperTest<Test>
  let spy: jest.SpyInstance

  jest.setTimeout(10000)

  mockEthers()
  mockGetValidatorStates()
  mockGetEthBalances()

  let oldEnv: NodeJS.ProcessEnv

  beforeAll(async () => {
    oldEnv = JSON.parse(JSON.stringify(process.env))
    process.env['METRICS_ENABLED'] = 'false'
    process.env['ETHEREUM_RPC_URL'] = 'http://localhost:9091'
    process.env['BEACON_RPC_URL'] = 'http://localhost:9092'
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
  // it('should return error (empty body)', async () => {
  //   const makeRequest = () =>
  //     req
  //       .post('/')
  //       .send({})
  //       .set('Accept', '*/*')
  //       .set('Content-Type', 'application/json')
  //       .expect('Content-Type', /json/)

  //   const response = await makeRequest()
  //   expect(response.statusCode).toEqual(400)
  // }, 30000)
  // it('should return error (empty data)', async () => {
  //   const makeRequest = () =>
  //     req
  //       .post('/')
  //       .send({ data: {} })
  //       .set('Accept', '*/*')
  //       .set('Content-Type', 'application/json')
  //       .expect('Content-Type', /json/)

  //   const response = await makeRequest()
  //   expect(response.statusCode).toEqual(400)
  // }, 30000)
})
