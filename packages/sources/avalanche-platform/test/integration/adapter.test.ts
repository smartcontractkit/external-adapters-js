import { AdapterRequest } from '@chainlink/ea-bootstrap'
import { SuperTest, Test } from 'supertest'
import { server as startServer } from '../../src'
import { mockBalanceSuccess } from './fixtures'
import { setupExternalAdapterTest, SuiteContext } from '@chainlink/ea-test-helpers'

describe('execute', () => {
  const id = '1'
  const context: SuiteContext = {
    req: null,
    server: startServer,
  }

  const envVariables = {
    METRICS_ENABLED: 'false',
    CACHE_ENABLED: 'false',
    P_CHAIN_RPC_URL: 'http://localhost:3500/ext/bc/P',
  }

  setupExternalAdapterTest(envVariables, context)

  describe('balance api', () => {
    it('(stakeAmount) should return success', async () => {
      const data: AdapterRequest = {
        id,
        data: {
          result: [
            {
              address: 'P-fuji1vd9sddlllrlk9fvj9lhntpw8t00lmvtnqkl2jt',
              network: 'avalanche-fuji',
            },
          ],
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
