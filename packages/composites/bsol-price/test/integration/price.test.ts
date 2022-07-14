import { AdapterRequest } from '@chainlink/ea-bootstrap'
import { server as startServer } from '../../src'
import '@solana/web3.js'
import { mockSolanaViewFunctionResponse, mockTokenAllocationResponse } from './fixtures'
import { setupExternalAdapterTest } from '@chainlink/ea-test-helpers'
import '@chainlink/solana-view-function-adapter'
import '@chainlink/token-allocation-adapter'
import type { SuiteContext, EnvVariables } from '@chainlink/ea-test-helpers'
import { SuperTest, Test } from 'supertest'

jest.mock('@chainlink/solana-view-function-adapter', () => ({
  ...jest.requireActual('@chainlink/solana-view-function-adapter'),
  makeExecute: jest.fn().mockReturnValue(() => mockSolanaViewFunctionResponse),
}))

jest.mock('@chainlink/token-allocation-adapter', () => ({
  ...jest.requireActual('@chainlink/token-allocation-adapter'),
  makeExecute: jest.fn().mockReturnValue(() => mockTokenAllocationResponse),
}))

const SOLIDO_ADDRESS = 'EMtjYGwPnXdtqK5SGL8CWGv4wgdBQN79UPoy53x9bBTJ'
const STSOL_ADDRESS = 'BSGfVnE6q6KemspkugEERU8x7WbQwSKwvHT1cZZ4ACVN'
const BSOL_ADDRESS = '3FMBoeddUhtqxepzkrxPrMUV3CL4bZM5QmMoLJfEpirz'
const SOLIDO_CONTRACT_VERSION = '0'

describe('accounts', () => {
  const context: SuiteContext = {
    req: null,
    server: startServer,
  }

  const envVariables: EnvVariables = {
    RPC_URL: 'https://api.devnet.solana.com',
    SOLIDO_ADDRESS: SOLIDO_ADDRESS,
    STSOL_ADDRESS: STSOL_ADDRESS,
    BSOL_ADDRESS: BSOL_ADDRESS,
    SOLIDO_CONTRACT_VERSION: SOLIDO_CONTRACT_VERSION,
  }

  setupExternalAdapterTest(envVariables, context as SuiteContext)

  describe('successful calls', () => {
    const jobID = '1'

    it('return success when fetching the account information', async () => {
      const data: AdapterRequest = {
        id: jobID,
        data: {
          source: 'tiingo',
        },
      }
      if (!context.req) return
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
