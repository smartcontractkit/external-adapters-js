import { AdapterRequest, FastifyInstance } from '@chainlink/ea-bootstrap'
import process from 'process'
import { server as startServer } from '../../src'
import { mockAuthenticatedSuccess, mockUSCPIResponseSuccess } from './fixtures'
import { DEFAULT_BASE_URL } from '../../src/config'
import { setupExternalAdapterTest } from '@chainlink/ea-test-helpers'

describe('execute', () => {
  const context = {
    req: null,
    server: startServer,
  }

  const envVariables = {
    CACHE_ENABLED: 'false',
    API_ENDPOINT: process.env.API_ENDPOINT || DEFAULT_BASE_URL,
    API_VERBOSE: 'true',
  }

  setupExternalAdapterTest(envVariables, context)

  describe('with serie/month/year', () => {
    const data: AdapterRequest = {
      id: '1',
      data: {
        serie: 'CUSR0000SA0',
        month: 'July',
        year: '2021',
      },
    }

    it('should return success', async () => {
      mockUSCPIResponseSuccess()

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

  describe('with API key', () => {
    beforeAll(() => {
      process.env.API_KEY = 'testkey'
    })

    const data: AdapterRequest = {
      id: '1',
      data: {
        serie: 'CUSR0000SA0',
        month: 'July',
        year: '2021',
      },
    }

    it('should return success', async () => {
      mockAuthenticatedSuccess()

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
