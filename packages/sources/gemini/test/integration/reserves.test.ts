import { AdapterRequest } from '@chainlink/ea-bootstrap'
import process from 'process'
import { server as startServer } from '../../src'
import { mockGeminiResponseSuccess } from './fixtures'
import { DEFAULT_BASE_URL } from '../../src/config'
import { setupExternalAdapterTest } from '@chainlink/ea-test-helpers'

describe('execute', () => {
  const id = '1'
  const context = {
    req: null,
    server: startServer,
  }

  const envVariables = {
    CACHE_ENABLED: 'false',
    API_VERBOSE: 'true',
    API_ENDPOINT: process.env.API_ENDPOINT || DEFAULT_BASE_URL,
  }

  setupExternalAdapterTest(envVariables, context)

  describe('with token', () => {
    const data: AdapterRequest = {
      id,
      data: {
        token: 'EFIL',
      },
    }

    it('should return success', async () => {
      mockGeminiResponseSuccess()

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
