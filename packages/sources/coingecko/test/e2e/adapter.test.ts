import { AddressInfo } from 'net'
import request, { SuperTest, Test } from 'supertest'
import { ServerInstance } from '@chainlink/external-adapter-framework'

/* eslint-disable max-nested-callbacks */

describe('execute', () => {
  const id = '1'
  let fastify: ServerInstance
  let req: SuperTest<Test>

  beforeAll(async () => {
    process.env['METRICS_ENABLED'] = 'false'
    process.env['RATE_LIMIT_CAPACITY_SECOND'] = '6'
    process.env['CACHE_POLLING_SLEEP_MS'] = '500'

    const { server } = await import('../../src')
    fastify = (await server()) as ServerInstance
    req = request(`localhost:${(fastify.server.address() as AddressInfo).port}`)
  })

  afterAll(async () => {
    await fastify.close()
  })

  describe('crypto api', () => {
    const data = {
      id,
      data: {
        base: 'PERP',
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
      expect(response.body.result).toBeGreaterThan(0)
    })

    const dataWithOverride = {
      id,
      data: {
        base: 'OHMV2',
        quote: 'USD',
        overrides: {
          coingecko: {
            OHMV2: 'olympus',
          },
        },
      },
    }

    it('should return success for override', async () => {
      const response = await req
        .post('/')
        .send(dataWithOverride)
        .set('Accept', '*/*')
        .set('Content-Type', 'application/json')
        .expect('Content-Type', /json/)
        .expect(200)
      expect(response.body.result).toBeGreaterThan(0)
    })
  })

  describe('volume api', () => {
    const data = {
      id,
      data: {
        endpoint: 'volume',
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
      expect(response.body.result).toBeGreaterThan(0)
    })
  })

  describe('marketcap api', () => {
    const data = {
      id,
      data: {
        endpoint: 'marketcap',
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
      expect(response.body.result).toBeGreaterThan(0)
    })
  })

  describe('globalmarketcap api', () => {
    const data = {
      id,
      data: {
        endpoint: 'globalmarketcap',
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
      expect(response.body.result).toBeGreaterThan(0)
    })
  })

  describe('dominance api', () => {
    const data = {
      id,
      data: {
        endpoint: 'dominance',
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
      expect(response.body.result).toBeGreaterThan(0)
    })
  })
})
