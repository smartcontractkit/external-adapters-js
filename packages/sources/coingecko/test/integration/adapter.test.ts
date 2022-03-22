import { AdapterRequest } from '@chainlink/types'
import http from 'http'
import { AddressInfo } from 'net'
import nock from 'nock'
import request, { SuperTest, Test } from 'supertest'
import { server as startServer } from '../../src'
import { mockCryptoSuccess, mockDominanceSuccess } from './fixtures'

describe('execute', () => {
  const id = '1'
  let server: http.Server
  let req: SuperTest<Test>

  beforeAll(async () => {
    process.env.CACHE_ENABLED = 'false'
    if (process.env.RECORD) {
      nock.recorder.rec()
    }
    server = await startServer()
    req = request(`localhost:${(server.address() as AddressInfo).port}`)
  })

  afterAll((done) => {
    if (process.env.RECORD) {
      nock.recorder.play()
    }

    nock.restore()
    nock.cleanAll()
    nock.enableNetConnect()
    server.close(done)
  })

  describe('crypto api', () => {
    const data: AdapterRequest = {
      id,
      data: {
        base: 'ETH',
        quote: 'USD',
      },
    }

    it('should return success', async () => {
      mockCryptoSuccess()

      const response = await req
        .post('/')
        .send(data)
        .set('Accept', '*/*')
        .set('Content-Type', 'application/json')
        .expect('Content-Type', /json/)
        .expect(200)
      expect(response.body).toMatchSnapshot()
    })

    const dataWithOverride: AdapterRequest = {
      id,
      data: {
        base: 'OHM',
        quote: 'USD',
        overrides: {
          coingecko: {
            OHM: 'olympus',
          },
        },
      },
    }

    it('should return success for override', async () => {
      mockCryptoSuccess()

      const response = await req
        .post('/')
        .send(dataWithOverride)
        .set('Accept', '*/*')
        .set('Content-Type', 'application/json')
        .expect('Content-Type', /json/)
        .expect(200)
      expect(response.body).toMatchSnapshot()
    })

    const dataWithArray: AdapterRequest = {
      id,
      data: {
        base: ['OHM', 'ETH'],
        quote: 'USD',
        overrides: {
          coingecko: {
            OHM: 'olympus',
          },
        },
      },
    }

    it('should return success for array', async () => {
      mockCryptoSuccess()

      const response = await req
        .post('/')
        .send(dataWithArray)
        .set('Accept', '*/*')
        .set('Content-Type', 'application/json')
        .expect('Content-Type', /json/)
        .expect(200)
      expect(response.body).toMatchSnapshot()
    })
  })

  describe('volume api', () => {
    const data: AdapterRequest = {
      id,
      data: {
        endpoint: 'volume',
        base: 'ETH',
        quote: 'USD',
      },
    }

    it('should return success', async () => {
      mockCryptoSuccess()

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

  describe('marketcap api', () => {
    const data: AdapterRequest = {
      id,
      data: {
        endpoint: 'marketcap',
        base: 'ETH',
        quote: 'USD',
      },
    }

    it('should return success', async () => {
      mockCryptoSuccess()

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

  describe('globalmarketcap api', () => {
    const data: AdapterRequest = {
      id,
      data: {
        endpoint: 'globalmarketcap',
        quote: 'USD',
      },
    }

    it('should return success', async () => {
      mockDominanceSuccess()

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

  describe('dominance api', () => {
    const data: AdapterRequest = {
      id,
      data: {
        endpoint: 'dominance',
        quote: 'ETH',
      },
    }

    it('should return success', async () => {
      mockDominanceSuccess()

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
