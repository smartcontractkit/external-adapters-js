import { AdapterRequest } from '@chainlink/types'
import request, { SuperTest, Test } from 'supertest'
import process from 'process'
import nock from 'nock'
import { server as startServer } from '../../src'
import { mockRelaychainSuccess, mockParachainSuccess } from './fixtures'
import { AddressInfo } from 'net'

let oldEnv: NodeJS.ProcessEnv

beforeAll(() => {
  oldEnv = JSON.parse(JSON.stringify(process.env))
  process.env.KUSAMA_RPC_URL = process.env.KUSAMA_RPC_URL || 'https://test-rpc-url-relay'
  process.env.MOONRIVER_RPC_URL = process.env.MOONRIVER_RPC_URL || 'https://test-rpc-url-para'
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

  describe('stksm endpoint', () => {
    const data: AdapterRequest = {
      id: '1',
      data: {},
    }

    it('relaychain should return success', async () => {
      mockRelaychainSuccess()

      const response = await req
        .post('/')
        .send(data)
        .set('Accept', '*/*')
        .set('Content-Type', 'application/json')
        .expect('Content-Type', /json/)
        .expect(200)
      expect(response.body).toMatchSnapshot()
    }, 60000)

    it('parachain should return success', async () => {
      mockParachainSuccess()

      const response = await req
        .post('/')
        .send(data)
        .set('Accept', '*/*')
        .set('Content-Type', 'application/json')
        .expect('Content-Type', /json/)
        .expect(200)
      expect(response.body).toMatchSnapshot()
    }, 60000)
  })
})
