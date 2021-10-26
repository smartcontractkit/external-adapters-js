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

describe('Total Endpoint Test Suite', () => {
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

  describe('When endpoint is not specified', () => {
    const data: AdapterRequest = {
      id,
      data: {},
    }

    it('should return success and calculated total', async () => {
      mockGistOct2021DataResponseSuccess()

      const response = await req
        .post('/')
        .send(data)
        .set('Accept', '*/*')
        .set('Content-Type', 'application/json')
        .expect('Content-Type', /json/)
        .expect(200)
      expect(response.body.result).toEqual({ total: 462122230678539 })
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

  describe('When endpoint is "total"', () => {
    const data: AdapterRequest = {
      id,
      data: {
        endpoint: 'total',
      },
    }

    describe('When endpoint returns an empty data set', () => {
      it('should return success and total zero', async () => {
        mockGistEmptyResponseSuccess()

        const response = await req
          .post('/')
          .send(data)
          .set('Accept', '*/*')
          .set('Content-Type', 'application/json')
          .expect('Content-Type', /json/)
          .expect(200)
        expect(response.body.result).toEqual({ total: 0 })
      })
    })

    it('should return success and calculated total', async () => {
      mockGistResponseSuccess()

      const response = await req
        .post('/')
        .send(data)
        .set('Accept', '*/*')
        .set('Content-Type', 'application/json')
        .expect('Content-Type', /json/)
        .expect(200)
      expect(response.body.result).toEqual({ total: 111 })
    })

    it('should return success and calculated total', async () => {
      mockGistOct2021DataResponseSuccess()

      const response = await req
        .post('/')
        .send(data)
        .set('Accept', '*/*')
        .set('Content-Type', 'application/json')
        .expect('Content-Type', /json/)
        .expect(200)
      expect(response.body.result).toEqual({ total: 462122230678539 })
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
