import { AdapterRequest } from '@chainlink/ea-bootstrap'
import { server as startServer } from '../../src'
import { mockDataProviderResponses } from './fixtures'
import { setupExternalAdapterTest } from '@chainlink/ea-test-helpers'

describe('execute', () => {
  const id = '1'
  const context = {
    req: null,
    server: startServer,
  }

  const envVariables = {}

  setupExternalAdapterTest(envVariables, context)

  describe('get symbol addresses', () => {
    const data: AdapterRequest = {
      id,
      data: {
        symbol: 'ETH',
      },
    }

    it('should return success', async () => {
      mockDataProviderResponses()

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
