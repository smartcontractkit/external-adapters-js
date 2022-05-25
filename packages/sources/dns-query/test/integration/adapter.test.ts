import type { AddressInfo } from 'net'
import nock from 'nock'
import process from 'process'
import request from 'supertest'
import type { SuperTest, Test } from 'supertest'
import { server as startServer } from '../../src'
import { dnsProofTests } from './dnsProof'

let oldEnv: NodeJS.ProcessEnv

export interface SuiteContext {
  fastify: FastifyInstance
  req: SuperTest<Test>
}

beforeAll(() => {
  oldEnv = JSON.parse(JSON.stringify(process.env))
  process.env.DNS_PROVIDER = 'google'
  process.env.API_VERBOSE = 'true'
  process.env.CACHE_ENABLED = 'false'
  if (process.env.RECORD) {
    nock.recorder.rec()
  }
})

afterAll(() => {
  process.env = oldEnv
  if (process.env.RECORD) {
    nock.recorder.play()
  }
  nock.restore()
  nock.cleanAll()
  nock.enableNetConnect()
})

describe('execute', () => {
  const context: SuiteContext = {
    server: null,
    req: null,
  }

  beforeEach(async () => {
    context.fastify = await startServer()
    context.req = request(`localhost:${(context.fastify.server.address() as AddressInfo).port}`)
  })

  afterEach((done) => {
    context.fastify.close(done)
  })

  describe('dnsProof endpoint', () => dnsProofTests(context))
})
