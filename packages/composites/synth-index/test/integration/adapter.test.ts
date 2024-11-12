import type { AdapterRequest, FastifyInstance } from '@chainlink/ea-bootstrap'
import { AddressInfo } from 'net'
import { server as startServer } from '../../src/index'
import {
  mockCoingeckoConnectionFailure,
  mockCoingeckoResponseFailureRedis,
  mockCoingeckoResponseSuccess,
} from './fixtures'
import { setupExternalAdapterTest, TestOptions } from '@chainlink/ea-test-helpers'
import type { SuiteContext } from '@chainlink/ea-test-helpers'
import { SuperTest, Test } from 'supertest'

describe('synth-index X coingecko', () => {
  const context: SuiteContext = {
    req: null,
    fastify: undefined,
    server: startServer,
  }

  const envVariables = {
    COINGECKO_ADAPTER_URL: 'http://localhost:8081',
    CACHE_ENABLED: 'false',
  }

  setupExternalAdapterTest(envVariables, context, { fastify: true } as TestOptions)

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

        const response = await (context.req as SuperTest<Test>)
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

        const response = await (context.req as SuperTest<Test>)
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
        mockCoingeckoConnectionFailure(
          ((context.fastify as FastifyInstance).server.address() as AddressInfo).port,
          4,
        )

        const response = await (context.req as SuperTest<Test>)
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
