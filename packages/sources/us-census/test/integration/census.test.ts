import { AdapterRequest } from '@chainlink/types'
import request from 'supertest'
import process from 'process'
import nock from 'nock'
import http from 'http'
import { server as startServer } from '../../src'
import {
  mockSuccessResponse,
  mockResponseWithInvalidLatitude,
  mockResponseWithInvalidVariable,
  mockAlternativeSuccessResponse,
  mockNewYorkStateSuccessResponse,
  mock2013SuccessResponse,
  mock2014SuccessResponse,
  mock2015SuccessResponse,
  mock2016SuccessResponse,
  mock2017SuccessResponse,
  mock2018SuccessResponse,
} from './fixtures'

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

  describe('with valid input', () => {
    const data: AdapterRequest = {
      id,
      data: {
        dataset: 'acs5_2019',
        geography: 'state',
        // total housing units and occupied housing units
        variables: ['B25001_001E', 'B25002_002E'],
        latitude: 37.774929,
        longitude: -122.419418,
      },
    }

    mockSuccessResponse()

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

  describe('with valid input 2', () => {
    const data: AdapterRequest = {
      id,
      data: {
        dataset: 'acs5_2019',
        geography: 'state',
        // means of transportation to work (car, public, walk)
        variables: ['B08101_001E', 'B08101_017E', 'B08101_025E', 'B08101_033E'],
        latitude: 37.774929,
        longitude: -122.419418,
      },
    }

    mockAlternativeSuccessResponse()

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

  describe('with alternative geography/location', () => {
    const data: AdapterRequest = {
      id,
      data: {
        dataset: 'acs5_2019',
        geography: 'tract',
        // household income in the past 12 months (2019 inflation adjusted) (B19001_001E, B19001_002E, ...)
        variables: [
          ...Array.from(Array(9).keys()).map((n) => `B19001_00${n + 1}E`),
          ...Array.from(Array(8).keys()).map((n) => `B19001_0${n + 10}E`),
        ],
        latitude: 40.73061,
        longitude: -73.935242,
      },
    }

    mockNewYorkStateSuccessResponse()

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

  describe('with valid input 2013', () => {
    const data: AdapterRequest = {
      id,
      data: {
        dataset: 'acs5_2013',
        geography: 'state',
        // means of transportation to work
        variables: ['B08101_001E'],
        latitude: 37.774929,
        longitude: -122.419418,
      },
    }

    mock2013SuccessResponse()

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

  describe('with valid input 2014', () => {
    const data: AdapterRequest = {
      id,
      data: {
        dataset: 'acs5_2014',
        geography: 'state',
        // means of transportation to work
        variables: ['B08101_001E'],
        latitude: 37.774929,
        longitude: -122.419418,
      },
    }

    mock2014SuccessResponse()

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

  describe('with valid input 2015', () => {
    const data: AdapterRequest = {
      id,
      data: {
        dataset: 'acs5_2015',
        geography: 'state',
        // means of transportation to work
        variables: ['B08101_001E'],
        latitude: 37.774929,
        longitude: -122.419418,
      },
    }

    mock2015SuccessResponse()

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

  describe('with valid input 2016', () => {
    const data: AdapterRequest = {
      id,
      data: {
        dataset: 'acs5_2016',
        geography: 'state',
        // means of transportation to work
        variables: ['B08101_001E'],
        latitude: 37.774929,
        longitude: -122.419418,
      },
    }

    mock2016SuccessResponse()

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

  describe('with valid input 2017', () => {
    const data: AdapterRequest = {
      id,
      data: {
        dataset: 'acs5_2017',
        geography: 'state',
        // means of transportation to work
        variables: ['B08101_001E'],
        latitude: 37.774929,
        longitude: -122.419418,
      },
    }

    mock2017SuccessResponse()

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

  describe('with valid input 2018', () => {
    const data: AdapterRequest = {
      id,
      data: {
        dataset: 'acs5_2018',
        geography: 'state',
        // means of transportation to work
        variables: ['B08101_001E'],
        latitude: 37.774929,
        longitude: -122.419418,
      },
    }

    mock2018SuccessResponse()

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

  // describe('with invalid geography', () => {
  //   const data: AdapterRequest = {
  //     id,
  //     data: {
  //       dataset: 'acs5_2019',
  //       geography: 'state',
  //       variables: ['B25001_001E', 'B25002_002E'],
  //       latitude: -1,
  //       longitude: -122.419418,
  //     },
  //   }

  //   mockResponseWithInvalidLatitude()

  //   it('should return error', async () => {
  //     const response = await req
  //       .post('/')
  //       .send(data)
  //       .set('Accept', '*/*')
  //       .set('Content-Type', 'application/json')
  //       .expect('Content-Type', /json/)
  //       .expect(400)
  //     expect(response.body).toMatchSnapshot()
  //   })
  // })

  // describe('with invalid variable', () => {
  //   const data: AdapterRequest = {
  //     id,
  //     data: {
  //       dataset: 'acs5_2019',
  //       geography: 'state',
  //       variables: ['SOME_INVALID_VAR'],
  //       latitude: 37.774929,
  //       longitude: -122.419418,
  //     },
  //   }

  //   mockResponseWithInvalidVariable()

  //   it('should return error', async () => {
  //     const response = await req
  //       .post('/')
  //       .send(data)
  //       .set('Accept', '*/*')
  //       .set('Content-Type', 'application/json')
  //       .expect('Content-Type', /json/)
  //       .expect(400)
  //     expect(response.body).toMatchSnapshot()
  //   })
  // })
})
