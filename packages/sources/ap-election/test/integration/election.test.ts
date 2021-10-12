import { AdapterRequest } from '@chainlink/types'
import request from 'supertest'
import process from 'process'
import nock from 'nock'
import http from 'http'
import { server as startServer } from '../../src'
import {
  mockResponseWithMultipleRaces,
  mockResponseWithNationalAndState,
  mockResponseWithNoRaces,
  mockResponseWithStateAndDistrict,
  mockStatusLevelResponse,
} from './fixtures'

let oldEnv: NodeJS.ProcessEnv

beforeAll(() => {
  oldEnv = JSON.parse(JSON.stringify(process.env))
  process.env.API_KEY = process.env.API_KEY || 'mock-key'
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

  describe('with national level response', () => {
    const data: AdapterRequest = {
      id,
      data: {
        date: '2020-11-08',
        statePostal: 'VA',
        level: 'state',
        officeID: 'P',
        raceType: 'G',
      },
    }

    mockResponseWithNationalAndState()

    it('should return success', async () => {
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

  describe('with response having both state and disrict reporting units', () => {
    const data: AdapterRequest = {
      id,
      data: {
        date: '2021-06-08',
        statePostal: 'VA',
        level: 'state',
        officeID: 'A',
        raceType: 'D',
      },
    }

    mockResponseWithStateAndDistrict()

    it('should return success', async () => {
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

  describe('with state level response', () => {
    const data: AdapterRequest = {
      id,
      data: {
        date: '2021-06-08',
        statePostal: 'VA',
        level: 'state',
        officeID: 'A',
        raceType: 'D',
      },
    }

    mockStatusLevelResponse()

    it('should return success', async () => {
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

  describe('with no races', () => {
    const data: AdapterRequest = {
      id,
      data: {
        date: '2021-06-08',
        statePostal: 'VA',
        level: 'state',
        officeID: 'A',
        raceType: 'D',
      },
    }

    mockResponseWithNoRaces()

    it('should return error', async () => {
      const response = await req
        .post('/')
        .send(data)
        .set('Accept', '*/*')
        .set('Content-Type', 'application/json')
        .expect('Content-Type', /json/)
        .expect(500)
      expect(response.body).toMatchSnapshot()
    })
  })

  describe('with multiple races', () => {
    const data: AdapterRequest = {
      id,
      data: {
        date: '2021-06-08',
        statePostal: 'VA',
        level: 'state',
        officeID: 'A',
        raceType: 'D',
      },
    }

    mockResponseWithMultipleRaces()

    it('should return error', async () => {
      const response = await req
        .post('/')
        .send(data)
        .set('Accept', '*/*')
        .set('Content-Type', 'application/json')
        .expect('Content-Type', /json/)
        .expect(500)
      expect(response.body).toMatchSnapshot()
    })
  })
})
