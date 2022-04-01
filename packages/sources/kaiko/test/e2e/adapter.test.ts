import { AdapterRequest } from '@chainlink/types'
import request, { SuperTest, Test } from 'supertest'
import * as process from 'process'
import { server as startServer } from '../../src'
import * as http from 'http'
import { AddressInfo } from 'net'

/* Since no API keys are set, all requests will error, but the error will
  confirm that the correct endpoint is being used. */

describe('execute', () => {
  const id = '1'
  let server: http.Server
  let req: SuperTest<Test>

  beforeAll(async () => {
    process.env.CACHE_ENABLED = 'false'
    process.env.API_KEY = 'fake-api-key'
    server = await startServer()
    req = request(`localhost:${(server.address() as AddressInfo).port}`)
  })

  afterAll((done) => {
    server.close(done)
  })

  describe('exchange rate api', () => {
    const data: AdapterRequest = {
      id,
      data: {
        base: 'ETH',
        quote: 'USD',
      },
    }

    it('should return success', async () => {
      const response = await req
        .post('/')
        .send(data)
        .set('Accept', '*/*')
        .set('Content-Type', 'application/json')
        .expect('Content-Type', /json/)
        .expect(200)
      expect(response.body.error.url).toBe(
        'https:/us.market-api.kaiko.io/v2/data/trades.v1/spot_exchange_rate/eth/usd',
      )
    })
  })

  describe('exchange direct rate api', () => {
    const data: AdapterRequest = {
      id,
      data: {
        base: 'LTC',
        quote: 'ETH',
      },
    }

    it('should return success', async () => {
      const response = await req
        .post('/')
        .send(data)
        .set('Accept', '*/*')
        .set('Content-Type', 'application/json')
        .expect('Content-Type', /json/)
        .expect(200)
      expect(response.body.error.url).toBe(
        'https:/us.market-api.kaiko.io/v2/data/trades.v1/spot_exchange_rate/ltc/eth',
      )
    })
  })

  describe('exchange rate api with invalid token', () => {
    const data: AdapterRequest = {
      id,
      data: {
        base: 'XXX',
        quote: 'EUR',
      },
    }

    it('should return failure', async () => {
      const response = await req
        .post('/')
        .send(data)
        .set('Accept', '*/*')
        .set('Content-Type', 'application/json')
        .expect('Content-Type', /json/)
        .expect(200)
      expect(response.body.error.url).toBe(
        'https:/us.market-api.kaiko.io/v2/data/trades.v1/spot_exchange_rate/xxx/eur',
      )
    })
  })
})
