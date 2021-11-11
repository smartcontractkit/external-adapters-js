import process from 'process'
import nock from 'nock'
import http from 'http'
import { server as startServer } from '../../src'
import { burnedTests } from './burned'
import { totalBurnedTests } from './total-burned'

let oldEnv: NodeJS.ProcessEnv

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
  let server: http.Server

  beforeAll(async () => {
    server = await startServer()
  })

  afterAll((done) => {
    server.close(done)
  })

  describe('total-burned endpoint', () => totalBurnedTests())
  describe('burned endpoint', () => burnedTests())
})
