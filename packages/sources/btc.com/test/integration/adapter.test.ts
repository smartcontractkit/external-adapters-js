import { AdapterRequest } from '@chainlink/ea-bootstrap'
import * as process from 'process'
import { server as startServer } from '../../src'
import { mockBalanceResponse, mockBlockResponse } from './fixtures'
import { setupExternalAdapterTest } from '@chainlink/ea-test-helpers'

describe('execute', () => {
  const context = {
    req: null,
    server: startServer,
  }

  const envVariables = {
    CACHE_ENABLED: (process.env.CACHE_ENABLED = 'false'),
  }

  setupExternalAdapterTest(envVariables, context)

  describe('balance endpoint', () => {
    const balanceRequest: AdapterRequest = {
      id: '1',
      data: {
        addresses: [
          {
            address: '3EyjZ6CtEZEKyc719NZMyWaJpJG5jsVJL1',
            coin: 'btc',
          },
        ],
        dataPath: 'addresses',
      },
    }

    it('should return success', async () => {
      mockBalanceResponse()

      const response = await context.req
        .post('/')
        .send(balanceRequest)
        .set('Accept', '*/*')
        .set('Content-Type', 'application/json')
        .expect('Content-Type', /json/)
        .expect(200)
      expect(response.body).toMatchSnapshot()
    })
  })

  describe('block endpoint', () => {
    const blockRequest: AdapterRequest = {
      id: '1',
      data: {
        endpoint: 'difficulty',
      },
    }

    it('should return success', async () => {
      mockBlockResponse()

      const response = await context.req
        .post('/')
        .send(blockRequest)
        .set('Accept', '*/*')
        .set('Content-Type', 'application/json')
        .expect('Content-Type', /json/)
        .expect(200)
      expect(response.body).toMatchSnapshot()
    })
  })
})
