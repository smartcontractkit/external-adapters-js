import { AdapterRequest } from '@chainlink/ea-bootstrap'
import process from 'process'
import { server as startServer } from '../../src'
import { mockEthereumResponseSuccess } from './fixtures'
import { setupExternalAdapterTest } from '@chainlink/ea-test-helpers'
import type { SuiteContext, EnvVariables } from '@chainlink/ea-test-helpers'
import { SuperTest, Test } from 'supertest'

describe('execute', () => {
  const id = '1'
  const context: SuiteContext = {
    req: null,
    server: startServer,
  }

  const envVariables: EnvVariables = {
    ETHEREUM_RPC_URL: process.env.ETHEREUM_RPC_URL || 'http://localhost:8545',
    API_VERBOSE: 'true',
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
        from: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2', // USDC
        fromDecimals: 18,
        to: '0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984', // UNI
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
