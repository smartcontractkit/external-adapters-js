import type { AddressInfo } from 'net'
import nock from 'nock'
import process from 'process'
import request from 'supertest'
import type { SuperTest, Test } from 'supertest'
import { server as startServer } from '../../src'
import { dnsProofTests } from './dnsProof'
import { setEnvVariables } from '@chainlink/ea-test-helpers'
import { FastifyInstance } from '@chainlink/ea-bootstrap'

let oldEnv: NodeJS.ProcessEnv

export interface SuiteContext {
  fastify: FastifyInstance | null
  req: SuperTest<Test> | null
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
  setEnvVariables(oldEnv)
  if (process.env.RECORD) {
    nock.recorder.play()
  }
  nock.restore()
  nock.cleanAll()
  nock.enableNetConnect()
})

describe('execute', () => {
  const context: SuiteContext = {
    fastify: null,
    req: null,
  }

  beforeEach(async () => {
    context.fastify = await startServer()
    context.req = request(`localhost:${(context.fastify.server.address() as AddressInfo).port}`)
  })

  afterEach((done) => {
    ;(context.fastify as FastifyInstance).close(done)
  })

  describe('dnsProof endpoint', () => dnsProofTests(context))
})
