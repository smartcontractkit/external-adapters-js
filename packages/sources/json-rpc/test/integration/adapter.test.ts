import { AdapterRequest } from '@chainlink/ea-bootstrap'
import * as process from 'process'
import { server as startServer } from '../../src'
import { mockResponseSuccess } from './fixtures'
import { setupExternalAdapterTest } from '@chainlink/ea-test-helpers'

describe('execute', () => {
  const id = '1'
  const context = {
    req: null,
    server: startServer,
  }

  const envVariables = {
    RPC_URL: process.env.RPC_URL || 'http://localhost:8545',
  }

  setupExternalAdapterTest(envVariables, context)

  describe('rpc api', () => {
    const data: AdapterRequest = {
      id,
      data: {
        method: 'eth_getBalance',
        params: ['0xef9ffcfbecb6213e5903529c8457b6f61141140d', 'latest'],
      },
    }

    it('should return success', async () => {
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
