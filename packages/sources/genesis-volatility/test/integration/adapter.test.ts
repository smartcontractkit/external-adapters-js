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
    API_KEY: process.env.API_KEY || 'fake-api-key',
  }

  setupExternalAdapterTest(envVariables, context)
  describe('adapter api', () => {
    const data: AdapterRequest = {
      id,
      data: {
        coin: 'ETH',
        days: 1,
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
