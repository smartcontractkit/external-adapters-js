import { mockCryptoSingleResponseSuccess, mockCryptoResponseSuccess } from './fixtures'
import { SuperTest, Test } from 'supertest'
import { setupExternalAdapterTest, SuiteContext } from './setup'
import { ServerInstance } from '@chainlink/external-adapter-framework'

describe('execute', () => {
  const id = '1'

  const context: SuiteContext = {
    req: null,
    server: async () => {
      process.env['RATE_LIMIT_CAPACITY_SECOND'] = '6'
      process.env['METRICS_ENABLED'] = 'false'
      const server = (await import('../../src')).server
      return server() as Promise<ServerInstance>
    },
  }

  const envVariables = {
    CACHE_ENABLED: 'false',
  }

  setupExternalAdapterTest(envVariables, context)

  describe('crypto single endpoint', () => {
    const data = {
      id,
      data: {
        base: 'ETH',
        quote: 'USD',
        endpoint: 'crypto-single',
      },
    }

    it('should return success', async () => {
      mockCryptoSingleResponseSuccess()

      const response = await (context.req as SuperTest<Test>)
        .post('/')
        .send(data)
        .set('Accept', '*/*')
        .set('Content-Type', 'application/json')
        .expect('Content-Type', /json/)
        .expect(200)
      expect(response.body).toMatchSnapshot()
    })
  })

  describe('crypto batch endpoint', () => {
    const data = {
      id,
      data: {
        base: 'ETH',
        quote: 'USD',
      },
    }

    it('should return success', async () => {
      mockCryptoResponseSuccess()

      const response = await (context.req as SuperTest<Test>)
        .post('/')
        .send(data)
        .set('Accept', '*/*')
        .set('Content-Type', 'application/json')
        .expect('Content-Type', /json/)
        .expect(200)
      expect(response.body).toMatchSnapshot()
    })
  })

  describe('crypto volume endpoint', () => {
    const data = {
      id,
      data: {
        base: 'ETH',
        quote: 'USD',
        endpoint: 'volume',
      },
    }

    it('should return success', async () => {
      mockCryptoResponseSuccess()

      const response = await (context.req as SuperTest<Test>)
        .post('/')
        .send(data)
        .set('Accept', '*/*')
        .set('Content-Type', 'application/json')
        .expect('Content-Type', /json/)
        .expect(200)
      expect(response.body).toMatchSnapshot()
    })
  })

  describe('crypto marketcap endpoint', () => {
    const data = {
      id,
      data: {
        base: 'ETH',
        quote: 'USD',
        endpoint: 'marketcap',
      },
    }

    it('should return success', async () => {
      mockCryptoResponseSuccess()

      const response = await (context.req as SuperTest<Test>)
        .post('/')
        .send(data)
        .set('Accept', '*/*')
        .set('Content-Type', 'application/json')
        .expect('Content-Type', /json/)
        .expect(200)
      expect(response.body).toMatchSnapshot()
    })
  })

  describe('dominance endpoint', () => {
    const data = {
      id,
      data: {
        market: 'BTC',
        endpoint: 'dominance',
      },
    }

    it('should return success', async () => {
      mockCryptoResponseSuccess()

      const response = await (context.req as SuperTest<Test>)
        .post('/')
        .send(data)
        .set('Accept', '*/*')
        .set('Content-Type', 'application/json')
        .expect('Content-Type', /json/)
        .expect(200)
      expect(response.body).toMatchSnapshot()
    })
  })

  describe('globalmarketcap endpoint', () => {
    const data = {
      id,
      data: {
        market: 'USD',
        endpoint: 'globalmarketcap',
      },
    }

    it('should return success', async () => {
      mockCryptoResponseSuccess()

      const response = await (context.req as SuperTest<Test>)
        .post('/')
        .send(data)
        .set('Accept', '*/*')
        .set('Content-Type', 'application/json')
        .expect('Content-Type', /json/)
        .expect(200)
      expect(response.body).toMatchSnapshot()
    })
  })

  describe('vwap endpoint', () => {
    const data = {
      id,
      data: {
        base: 'ETH',
        endpoint: 'vwap',
      },
    }

    it('should return success', async () => {
      mockCryptoResponseSuccess()

      const response = await (context.req as SuperTest<Test>)
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
