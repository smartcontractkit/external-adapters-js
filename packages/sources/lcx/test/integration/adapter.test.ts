import { AdapterRequest } from '@chainlink/ea-bootstrap'
import * as process from 'process'
import { server as startServer } from '../../src'
import { mockRateResponseSuccess } from './fixtures'
import { setupExternalAdapterTest } from '@chainlink/ea-test-helpers'

describe('execute', () => {
  const id = '1'
  const context = {
    req: null,
    server: startServer,
  }

  const envVariables = {
    API_KEY: process.env.API_KEY || 'fake-api-key',
  }

  setupExternalAdapterTest(envVariables, context)

  describe('rate api', () => {
    const data: AdapterRequest = {
      id,
      data: {
        base: 'BTC',
        quote: 'USD',
      },
    }

    it('should return success', async () => {
      mockRateResponseSuccess()

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
