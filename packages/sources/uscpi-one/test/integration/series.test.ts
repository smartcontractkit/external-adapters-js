import { AdapterRequest } from '@chainlink/types'
import request, { SuperTest, Test } from 'supertest'
import process from 'process'
import nock from 'nock'
import http from 'http'
import { server as startServer } from '../../src'
import { mockAuthenticatedSuccess, mockUSCPIResponseSuccess } from './fixtures'
import { DEFAULT_BASE_URL } from '../../src/config'
import { AddressInfo } from 'net'

let oldEnv: NodeJS.ProcessEnv

beforeAll(() => {
  oldEnv = JSON.parse(JSON.stringify(process.env))
  process.env.CACHE_ENABLED = 'false'
  process.env.API_ENDPOINT = process.env.API_ENDPOINT || DEFAULT_BASE_URL
  process.env.API_VERBOSE = 'true'
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
  const id = '1'
  let server: http.Server
  let req: SuperTest<Test>

  beforeAll(async () => {
    server = await startServer()
    req = request(`localhost:${(server.address() as AddressInfo).port}`)
    process.env.CACHE_ENABLED = 'false'
  })

  afterAll((done) => {
    server.close(done)
  })

  describe('with serie/month/year', () => {
    const data: AdapterRequest = {
      id: '1',
      data: {
        serie: 'CUSR0000SA0',
        month: 'July',
        year: '2021',
      },
    }

    it('should return success', async () => {
      mockUSCPIResponseSuccess()

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

  describe('with API key', () => {
    let oldEnvTest: NodeJS.ProcessEnv

    beforeAll(() => {
      oldEnvTest = JSON.parse(JSON.stringify(process.env))
      process.env.API_KEY = 'testkey'
    })

    afterAll(() => {
      process.env = oldEnvTest
    })

    const data: AdapterRequest = {
      id: '1',
      data: {
        serie: 'CUSR0000SA0',
        month: 'July',
        year: '2021',
      },
    }

    it('should return success', async () => {
      mockAuthenticatedSuccess()

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
