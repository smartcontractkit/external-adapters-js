import type { AdapterRequest, FastifyInstance } from '@chainlink/ea-bootstrap'
import { AddressInfo } from 'net'
import { server as startServer } from '../../src/index'
import {
  mockCoingeckoConnectionFailure,
  mockCoingeckoResponseFailureRedis,
  mockCoingeckoResponseSuccess,
} from './fixtures'
import { setupExternalAdapterTest } from '@chainlink/ea-test-helpers'

describe('synth-index X coingecko', () => {
  const context = {
    req: null,
    fastify: null,
    server: startServer,
  }

  const envVariables = {
    COINGECKO_ADAPTER_URL: 'http://localhost:8081',
    CACHE_ENABLED: 'false',
  }

  setupExternalAdapterTest(envVariables, context, { fastify: true })

  describe('when making a request to coingecko for sDEFI', () => {
    const sDEFIRequest: AdapterRequest = {
      id: '1',
      data: {
        base: 'sDEFI',
        to: 'usd',
        source: 'coingecko',
      },
    }
    describe('and coingecko replies with a success', () => {
      it('should reply with success', async () => {
        mockCoingeckoResponseSuccess()

        const response = await context.req
          .post('/')
          .send(sDEFIRequest)
          .set('Accept', '*/*')
          .set('Content-Type', 'application/json')
          .expect('Content-Type', /json/)
          .expect(200)
        expect(response.body).toMatchSnapshot()
      })
    })
    describe('and coingecko replies with an intermittent failure', () => {
      it('should try 2 times then respond with a 200', async () => {
        mockCoingeckoResponseFailureRedis(1)
        mockCoingeckoResponseSuccess()

        const response = await context.req
          .post('/')
          .send(sDEFIRequest)
          .set('Accept', '*/*')
          .set('Content-Type', 'application/json')
          .expect('Content-Type', /json/)
          .expect(200)

        expect(response.body).toMatchSnapshot()
      })
    })
    describe('and coingecko replies with a failure repeatedly', () => {
      it('should try 3 times and then fail', async () => {
        mockCoingeckoConnectionFailure((context.fastify.server.address() as AddressInfo).port, 4)

        const response = await context.req
          .post('/')
          .send(sDEFIRequest)
          .set('Accept', '*/*')
          .set('Content-Type', 'application/json')
          .expect('Content-Type', /json/)
          .expect(500)

        expect(response.body).toMatchSnapshot()
      }, 20000)
    })
  })
})
