import request, { SuperTest, Test } from 'supertest'
import * as process from 'process'
import { server as startServer } from '../../src/index'
import nock from 'nock'
import * as http from 'http'
import { AddressInfo } from 'net'
import { mockContractCallResponseSuccess } from './fixtures'

describe('LIDO', () => {
  process.env.RPC_URL = 'http://localhost:8545'
  mockContractCallResponseSuccess()

  let server: http.Server
  let req: SuperTest<Test>

  beforeAll(async () => {
    process.env.CACHE_ENABLED = 'false'
    if (process.env.RECORD) {
      nock.recorder.rec()
    }
    server = await startServer()
    req = request(`localhost:${(server.address() as AddressInfo).port}`)
  })

  it('fetches the amount of stETH for 1 wstETH', async () => {
    const response = await req
      .post('/')
      .send({})
      .set('Accept', '*/*')
      .set('Content-Type', 'application/json')
      .expect('Content-Type', /json/)
      .expect(200)
    expect(response.body).toMatchSnapshot()
  })

  afterAll((done) => {
    if (process.env.RECORD) {
      nock.recorder.play()
    }

    server.close(done)
    nock.restore()
    nock.cleanAll()
    nock.enableNetConnect()
  })
})
