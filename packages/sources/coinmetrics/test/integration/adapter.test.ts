import process from 'process'
import nock from 'nock'
import http from 'http'
import { server as startServer } from '../../src'
import { burnedTests } from './burned'
import { totalBurnedTests } from './total-burned'
import { AddressInfo } from 'net'

let oldEnv: NodeJS.ProcessEnv

export interface SuiteContext {
  server: http.Server
}

beforeAll(() => {
  oldEnv = JSON.parse(JSON.stringify(process.env))
  process.env.API_KEY = 'test_api_key'
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

  describe('total-burned endpoint', () => totalBurnedTests(context))
  describe('burned endpoint', () => burnedTests(context))
})
