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

  describe('with calculatorContract/vaultProxy/shareValueInAsset', () => {
    const data: AdapterRequest = {
      id,
      data: {
        endpoint: 'calcNetShareValueInAsset',
        calculatorContract: '0x7c728cd0CfA92401E01A4849a01b57EE53F5b2b9',
        vaultProxy: '0x27f23c710dd3d878fe9393d93465fed1302f2ebd',
        quoteAsset: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
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
