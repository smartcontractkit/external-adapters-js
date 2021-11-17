import { AdapterRequest } from '@chainlink/types'
import request from 'supertest'
import process from 'process'
import nock from 'nock'
import http from 'http'
import { server as startServer } from '../../src'
import { mockResponseWithInvalidLatitude, mockResponseWithInvalidVariable } from './fixtures'

let oldEnv: NodeJS.ProcessEnv

process.env.API_KEY = 'test_api_key'

beforeAll(() => {
  oldEnv = JSON.parse(JSON.stringify(process.env))
  process.env.API_VERBOSE = process.env.API_VERBOSE || 'true'
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
  const req = request('localhost:8080')
  beforeAll(async () => {
    server = await startServer()
  })
  afterAll((done) => {
    server.close(done)
  })

  describe('with invalid geography', () => {
    const data: AdapterRequest = {
      id,
      data: {
        endpoint: 'acs5_2019',
        geography: 'tract',
        variables: ['B25001_001E', 'B25002_002E'],
        latitude: -1,
        longitude: -122.419418,
      },
    }

    mockResponseWithInvalidLatitude()

    it('should return error', async () => {
      const response = await req
        .post('/')
        .send(data)
        .set('Accept', '*/*')
        .set('Content-Type', 'application/json')
        .expect('Content-Type', /json/)
        .expect(400)
      expect(response.body).toMatchSnapshot()
    })
  })

  describe('with invalid variable', () => {
    const data: AdapterRequest = {
      id,
      data: {
        endpoint: 'acs5_2019',
        geography: 'state',
        variables: ['SOME_INVALID_VAR'],
        latitude: 37.774929,
        longitude: -122.419418,
      },
    }

    mockResponseWithInvalidVariable()

    it('should return error', async () => {
      const response = await req
        .post('/')
        .send(data)
        .set('Accept', '*/*')
        .set('Content-Type', 'application/json')
        .expect('Content-Type', /json/)
        .expect(400)
      expect(response.body).toMatchSnapshot()
    })
  })
})
