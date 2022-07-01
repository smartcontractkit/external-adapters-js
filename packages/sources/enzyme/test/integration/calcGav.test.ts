import { AdapterRequest } from '@chainlink/ea-bootstrap'
import { server as startServer } from '../../src'
import { mockEthereumResponseSuccess } from './fixtures'
import { ENV_ETHEREUM_RPC_URL } from '../../src/config'
import { setupExternalAdapterTest } from '@chainlink/ea-test-helpers'

const context = {
  req: null,
  server: startServer,
}

const envVariables = {
  CACHE_ENABLED: 'false',
  [ENV_ETHEREUM_RPC_URL]: process.env[ENV_ETHEREUM_RPC_URL] || 'http://localhost:8545/',
  API_VERBOSE: 'true',
}

setupExternalAdapterTest(envVariables, context)

describe('execute', () => {
  const id = '1'
  describe('with calculatorContract/vaultProxy', () => {
    const data: AdapterRequest = {
      id,
      data: {
        endpoint: 'calcGav',
        calculatorContract: '0x0b2cBB1974f17700531439E3e4AfF5e5D2AADD4A',
        vaultProxy: '0x44902e5a88371224d9ac172e391C64257B701Ade',
      },
    }

    it('should return success', async () => {
      mockEthereumResponseSuccess()

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
