import process from 'process'
import nock from 'nock'
import http from 'http'
import { server as startServer } from '../../src'
import { DEV_BASE_URL } from '../../src/config'
import { locationTests } from './location'
import { currentConditionsTests } from './current-conditions'
import { locationCurrentConditionsTests } from './location-current-conditions'

let oldEnv: NodeJS.ProcessEnv

beforeAll(() => {
  oldEnv = JSON.parse(JSON.stringify(process.env))
  process.env.API_KEY = 'test_api_key'
  process.env.API_VERBOSE = 'true'
  process.env.API_ENDPOINT = DEV_BASE_URL
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

  describe('location endpoint', () => locationTests())
  describe('current-conditions endpoint', () => currentConditionsTests())
  describe('location-current-conditions endpoint', () => locationCurrentConditionsTests())
})
