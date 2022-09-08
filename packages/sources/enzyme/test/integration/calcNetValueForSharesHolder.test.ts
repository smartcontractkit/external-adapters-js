import { AdapterRequest } from '@chainlink/ea-bootstrap'
import { server as startServer } from '../../src'
import { mockEthereumResponseSuccess } from './fixtures'
import { ENV_ETHEREUM_RPC_URL } from '../../src/config'
import { setupExternalAdapterTest } from '@chainlink/ea-test-helpers'
import type { SuiteContext } from '@chainlink/ea-test-helpers'
import { SuperTest, Test } from 'supertest'

const context: SuiteContext = {
  req: null,
  server: startServer,
}

const envVariables = {
  CACHE_ENABLED: 'false',
  [ENV_ETHEREUM_RPC_URL]: process.env[ENV_ETHEREUM_RPC_URL] || 'http://localhost:8545/',
  API_VERBOSE: 'true',
  CHAIN_ID: process.env['CHAIN_ID'] || '42',
}

setupExternalAdapterTest(envVariables, context)

describe('execute', () => {
  const id = '1'

  describe('with calculatorContract/vaultProxy/sharesHolder', () => {
    const data: AdapterRequest = {
      id,
      data: {
        endpoint: 'calcNetValueForSharesHolder',
        calculatorContract: '0x0b2cBB1974f17700531439E3e4AfF5e5D2AADD4A',
        vaultProxy: '0x399acf6102c466a3e4c5f94cd00fc1bfb071d3c1',
        sharesHolder: '0x31d675bd2bdfdd3e332311bef7cb6ba357a5d4e3',
      },
    }

    it('should return success', async () => {
      mockEthereumResponseSuccess()

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
