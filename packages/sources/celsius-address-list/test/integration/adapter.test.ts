import { AdapterRequest } from '@chainlink/ea-bootstrap'
import process from 'process'
import { server as startServer } from '../../src'
import { mockResponseSuccess } from './fixtures'
import { setupExternalAdapterTest } from '@chainlink/ea-test-helpers'
import type { SuiteContext } from '@chainlink/ea-test-helpers'
import { SuperTest, Test } from 'supertest'

describe('execute', () => {
  const context: SuiteContext = {
    req: null,
    server: startServer,
  }

  const envVariables = {
    RPC_URL: process.env.RPC_URL || 'https://test-rpc-url:8545',
    CHAIN_ID: process.env['CHAIN_ID'] || '42',
  }

  setupExternalAdapterTest(envVariables, context)

  describe('wallet endpoint', () => {
    const data: AdapterRequest = {
      id: '1',
      data: {
        endpoint: 'wallet',
        network: 'bitcoin',
        chainId: 'mainnet',
        contractAddress: '0x0123456789abcdef0123456789abcdef01234567',
      },
    }

    it('returns success', async () => {
      mockResponseSuccess()

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
