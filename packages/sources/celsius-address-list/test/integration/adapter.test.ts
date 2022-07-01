import { AdapterRequest } from '@chainlink/ea-bootstrap'
import process from 'process'
import { server as startServer } from '../../src'
import { mockResponseSuccess } from './fixtures'
import { setupExternalAdapterTest } from '@chainlink/ea-test-helpers'

describe('execute', () => {
  const context = {
    req: null,
    server: startServer,
  }

  const envVariables = {
    RPC_URL: process.env.RPC_URL || 'https://test-rpc-url:8545',
  }

  setupExternalAdapterTest(envVariables, context)

  describe('wallet endpoint', () => {
    const data: AdapterRequest = {
      id: '1',
      data: {
        network: 'bitcoin',
        chainId: 'mainnet',
        contractAddress: '0x0123456789abcdef0123456789abcdef01234567',
      },
    }

    it('returns success', async () => {
      mockResponseSuccess()

      const response = await context.req
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
