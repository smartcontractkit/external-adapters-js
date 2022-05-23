import { AdapterRequest } from '@chainlink/types'
import request, { SuperTest, Test } from 'supertest'
import process from 'process'
import nock from 'nock'
import { server as startServer } from '../../src'
import { mockStmaticSuccess } from './fixtures'
import { AddressInfo } from 'net'

let oldEnv: NodeJS.ProcessEnv

beforeAll(() => {
  oldEnv = JSON.parse(JSON.stringify(process.env))
  process.env.POLYGON_RPC_URL = process.env.POLYGON_RPC_URL || 'https://test-rpc-url/'
  if (process.env.RECORD) nock.recorder.rec()
})

afterAll(() => {
  process.env = oldEnv
  if (process.env.RECORD) nock.recorder.play()

  nock.restore()
  nock.cleanAll()
  nock.enableNetConnect()
})

describe('execute', () => {
  let fastify: FastifyInstance
  let req: SuperTest<Test>

  beforeAll(async () => {
    fastify = await startServer()
    req = request(`localhost:${(fastify.server.address() as AddressInfo).port}`)
  })

  afterAll((done) => {
    fastify.close(done)
  })

  describe('stmatic endpoint', () => {
    const data: AdapterRequest = {
      id: '1',
      data: {},
    }

    it('should return success', async () => {
      mockStmaticSuccess()

      const response = await req
        .post('/')
        .send(data)
        .set('Accept', '*/*')
        .set('Content-Type', 'application/json')
        .expect('Content-Type', /json/)
        .expect(200)
      expect(response.body).toMatchSnapshot()
    })
  })
})
