import { AdapterRequest } from '@chainlink/types'
import request from 'supertest'
import process from 'process'
import nock from 'nock'
import http from 'http'
import { server as startServer } from '../../src'
import {
  mockGistEmptyResponseSuccess,
  mockGistResponseSuccess,
  mockGistOct2021DataResponseSuccess,
  mockGistResponseFailure,
} from './fixtures'

let oldEnv: NodeJS.ProcessEnv

beforeAll(() => {
  oldEnv = JSON.parse(JSON.stringify(process.env))
  process.env.CACHE_ENABLED = 'false'
  process.env.RPC_URL = process.env.RPC_URL || 'http://localhost:8545'
  process.env.API_VERBOSE = true
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

describe('High/Low Endpoint Test Suite', () => {
  const id = '1'
  let server: http.Server
  const req = request('localhost:8080')
  beforeAll(async () => {
    server = await startServer()
    process.env.CACHE_ENABLED = 'false'
  })
  afterAll((done) => {
    server.close(done)
  })

  afterEach(() => {
    nock.cleanAll()
  })

  describe('When endpoint is "highlow"', () => {
    const data: AdapterRequest = {
      id,
      data: {
        endpoint: 'highlow',
      },
    }

    describe('When endpoint returns an empty data set', () => {
      it('should return success and empty result', async () => {
        mockGistEmptyResponseSuccess()

        const response = await req
          .post('/')
          .send(data)
          .set('Accept', '*/*')
          .set('Content-Type', 'application/json')
          .expect('Content-Type', /json/)
          .expect(200)
        expect(response.body.result).toEqual({})
      })
    })

    it('should return success and high and low address', async () => {
      mockGistResponseSuccess()

      const response = await req
        .post('/')
        .send(data)
        .set('Accept', '*/*')
        .set('Content-Type', 'application/json')
        .expect('Content-Type', /json/)
        .expect(200)
      expect(response.body.result).toEqual({
        highestBalanceAddress: 'a',
        lowestBalanceAddress: 'c',
      })
    })

    it('should return success and high and low address', async () => {
      mockGistOct2021DataResponseSuccess()

      const response = await req
        .post('/')
        .send(data)
        .set('Accept', '*/*')
        .set('Content-Type', 'application/json')
        .expect('Content-Type', /json/)
        .expect(200)
      expect(response.body.result).toEqual({
        highestBalanceAddress: '1MejgD79BrWdMzFVuF9JxRC1sXury17LUp',
        lowestBalanceAddress: '15XPFnJAjPiyTi59BexgHpQBMsA9xzjNn9',
      })
    })

    describe('When the API returns an error', () => {
      it('should return a 500 error', async () => {
        mockGistResponseFailure()

        await req
          .post('/')
          .send(data)
          .set('Accept', '*/*')
          .set('Content-Type', 'application/json')
          .expect('Content-Type', /json/)
          .expect(500)
      })
    })
  })
})
