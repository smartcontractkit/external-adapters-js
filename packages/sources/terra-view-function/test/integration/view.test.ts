import { AdapterRequest } from '@chainlink/ea-bootstrap'
import process from 'process'
import { server as startServer } from '../../src'
import { mockLCDResponseSuccess } from './fixtures'
import { TInputParameters } from '../../src/endpoint/view'
import { setupExternalAdapterTest } from '@chainlink/ea-test-helpers'
import type { SuiteContext } from '@chainlink/ea-test-helpers'
import { SuperTest, Test } from 'supertest'

describe('execute', () => {
  const id = '1'
  const context: SuiteContext = {
    req: null,
    server: startServer,
  }

  const envVariables = {
    CACHE_ENABLED: 'false',
    COLUMBUS_5_RPC_URL: process.env.COLUMBUS_5_RPC_URL || 'http://localhost:1234/',
    API_VERBOSE: 'true',
  }

  setupExternalAdapterTest(envVariables, context)

  describe('with address/query', () => {
    const data: AdapterRequest<TInputParameters> = {
      id,
      data: {
        address: 'terra1dw5ex5g802vgrek3nzppwt29tfzlpa38ep97qy',
        query: { aggregator_query: { get_latest_round_data: {} } },
      },
    }

    it('should return success', async () => {
      mockLCDResponseSuccess()

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
