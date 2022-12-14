import { AdapterRequest } from '@chainlink/ea-bootstrap'
import { SuperTest, Test } from 'supertest'
import { server as startServer } from '../../src'
import { mockBalanceSuccess } from './fixtures'
import { setupExternalAdapterTest, SuiteContext } from '@chainlink/ea-test-helpers'
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
    it('(stakeAmount) should return success', async () => {
      const data: AdapterRequest = {
        id,
        data: {
          result: [
            {
              address: 'NodeID-4gPY8c21HFsLjRm3nCUS3KA8WZsEsqEKC',
            },
            {
              address: 'NodeID-F823qVX3w3sVb6EWKnTFvfhnmTCCX91gX',
            },
          ],
          field: 'stakeAmount',
        },
      }

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

    it('(potentialReward) should return success', async () => {
      const data: AdapterRequest = {
        id,
        data: {
          result: [
            {
              address: 'NodeID-4gPY8c21HFsLjRm3nCUS3KA8WZsEsqEKC',
            },
            {
              address: 'NodeID-F823qVX3w3sVb6EWKnTFvfhnmTCCX91gX',
            },
          ],
          field: 'potentialReward',
        },
      }

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
