import http from 'http'
import nock from 'nock'
import process from 'process'
import { server as startServer } from '../../src'
import { dnsProofTests } from './dnsProof'
let oldEnv: NodeJS.ProcessEnv

export interface SuiteContext {
  server: http.Server
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
  }

  beforeAll(async () => {
    context.server = await startServer()
  })

  afterAll((done) => {
    context.server.close(done)
  })

  describe('dnsProof endpoint', () => dnsProofTests(context))
})
