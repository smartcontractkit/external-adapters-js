import { AdapterRequest } from '@chainlink/ea-bootstrap'
import { SuperTest, Test } from 'supertest'
import { server as startServer } from '../../src'
import { mockBalanceSuccess } from './fixtures'
import { setupExternalAdapterTest, SuiteContext } from '@chainlink/ea-test-helpers/dist'
import process from 'process'

describe('execute', () => {
  const id = '1'
  const context: SuiteContext = {
    req: null,
    server: startServer,
  }

  const envVariables = {
    CACHE_ENABLED: 'false',
    ETHEREUM_RPC_URL: process.env.ETHEREUM_RPC_URL || 'http://localhost:3500',
  }

  setupExternalAdapterTest(envVariables, context)

  describe('balance api', () => {
    const data: AdapterRequest = {
      id,
      data: {
        result: [
          {
            address:
              '0x8bdb63ea991f42129d6defa8d3cc5926108232c89824ad50d57f49a0310de73e81e491eae6587bd1465fa5fd8e4dee21',
          },
          {
            address:
              '0xb672b5976879c6423ad484ba4fa0e76069684eed8e2a8081f6730907f3618d43828d1b399d2fd22d7961824594f73462',
          },
        ],
      },
    }

    it('should return success', async () => {
      mockBalanceSuccess()

      const response = await (context.req as SuperTest<Test>)
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
