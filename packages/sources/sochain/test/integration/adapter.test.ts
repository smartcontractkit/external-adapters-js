import { AdapterRequest } from '@chainlink/ea-bootstrap'
import { server as startServer } from '../../src'
import { mockResponseSuccess } from './fixtures'
import { setupExternalAdapterTest } from '@chainlink/ea-test-helpers'

describe('execute', () => {
  const id = '1'
  const context = {
    req: null,
    server: startServer,
  }
  const envVariables = {}
  setupExternalAdapterTest(envVariables, context)
  describe('balance api', () => {
    const data: AdapterRequest = {
      id,
      data: {
        addresses: [
          {
            address: '3D8DJLwUXFfZvE8yJRu729MZ8uLy25SuLz',
            coin: 'btc',
          },
          {
            address: '38bzm6nhQMFJe71jJw1U7CbgNrVNpkonZF',
            coin: 'btc',
          },
        ],
        dataPath: 'addresses',
        confirmations: 3,
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
