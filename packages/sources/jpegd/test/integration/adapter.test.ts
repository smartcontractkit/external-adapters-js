import { AdapterRequest } from '@chainlink/ea-bootstrap'
import { server as startServer } from '../../src'
import { mockPunksValueResponseSuccess, mockCollectionsValueResponseSuccess } from './fixtures'
import { setupExternalAdapterTest } from '@chainlink/ea-test-helpers'

describe('execute', () => {
  const id = '1'
  const context = {
    req: null,
    server: startServer,
  }

  const envVariables = {
    API_KEY: 'test-key',
  }

  setupExternalAdapterTest(envVariables, context)

  describe('punk valuation api', () => {
    const punkData: AdapterRequest = {
      id,
      data: {
        block: 14000000,
        endpoint: 'punks',
      },
    }

    it('should return success', async () => {
      mockPunksValueResponseSuccess()

      const response = await context.req
        .post('/')
        .send(punkData)
        .set('Accept', '*/*')
        .set('Content-Type', 'application/json')
        .expect('Content-Type', /json/)
        .expect(200)
      expect(response.body).toMatchSnapshot()
    })
  })

  describe('collections valuation api', () => {
    const collectionData: AdapterRequest = {
      id,
      data: {
        endpoint: 'collections',
        collection: 'jpeg-cards',
      },
    }

    it('should return success', async () => {
      mockCollectionsValueResponseSuccess()

      const response = await context.req
        .post('/')
        .send(collectionData)
        .set('Accept', '*/*')
        .set('Content-Type', 'application/json')
        .expect('Content-Type', /json/)
        .expect(200)
      expect(response.body).toMatchSnapshot()
    })
  })
})
