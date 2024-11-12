import { AdapterRequest } from '@chainlink/ea-bootstrap'
import process from 'process'
import { server as startServer } from '../../src'
import { mockEthereumResponseSuccess } from './fixtures'
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
    CACHE_ENABLED: 'false',
    RPC_URL: process.env.RPC_URL || 'http://localhost:8545',
    API_VERBOSE: true as unknown as string,
  }

  setupExternalAdapterTest(envVariables, context)

  describe('with from/to', () => {
    const data: AdapterRequest = {
      id,
      data: {
        from: 'USDC',
        to: 'USDT',
      },
    }

    it('should return success', async () => {
      mockEthereumResponseSuccess()

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

  describe('with custom params', () => {
    const data: AdapterRequest = {
      id,
      data: {
        from: '0xBC6DA0FE9aD5f3b0d58160288917AA56653660E9',
        fromDecimals: 18,
        to: '0x6c3F90f043a72FA612cbac8115EE7e52BDe6E490',
        toDecimals: 18,
        amount: 10,
      },
    }

    it('should return success', async () => {
      mockEthereumResponseSuccess()

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
