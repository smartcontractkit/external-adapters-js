import { AdapterRequest } from '@chainlink/ea-bootstrap'
import process from 'process'
import { server as startServer } from '../../src'
import { mockCoinmarketcapAdapter } from './fixtures'
import { setupExternalAdapterTest } from '@chainlink/ea-test-helpers'
import type { SuiteContext } from '@chainlink/ea-test-helpers'
import { SuperTest, Test } from 'supertest'

describe('execute', () => {
  const id = '1'
  const context: SuiteContext = {
    req: null,
    server: startServer,
  }

  const envVariables = {
    COINMARKETCAP_ADAPTER_URL: process.env.COINMARKETCAP_ADAPTER_URL || 'http://localhost:8081',
  }
  setupExternalAdapterTest(envVariables, context)
  describe('with to/from dates', () => {
    const data: AdapterRequest = {
      id,
      data: {
        from: 'ETH',
        to: 'USD',
        fromDate: '2021-11-01',
        toDate: '2021-11-08',
        source: 'coinmarketcap',
        interval: '1d',
      },
    }

    it('should return success', async () => {
      mockCoinmarketcapAdapter()

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

  describe('with from date and days', () => {
    const data: AdapterRequest = {
      id,
      data: {
        from: 'ETH',
        to: 'USD',
        fromDate: '2021-11-01',
        days: 7,
        source: 'coinmarketcap',
        interval: '1d',
      },
    }

    it('should return success', async () => {
      mockCoinmarketcapAdapter()

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

  describe('with to date and days', () => {
    const data: AdapterRequest = {
      id,
      data: {
        from: 'ETH',
        to: 'USD',
        toDate: '2021-11-08',
        days: 7,
        source: 'coinmarketcap',
        interval: '1d',
      },
    }

    it('should return success', async () => {
      mockCoinmarketcapAdapter()

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
