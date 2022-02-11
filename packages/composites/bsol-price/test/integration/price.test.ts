import { AdapterRequest } from '@chainlink/types'
import { server as startServer } from '../../src'
import '@solana/web3.js'
import { mockSolanaViewFunctionResponse, mockTokenAllocationResponse } from './fixtures'
import http from 'http'
import request, { SuperTest, Test } from 'supertest'
import { AddressInfo } from 'net'
import '@chainlink/solana-view-function-adapter'
import '@chainlink/token-allocation-adapter'

jest.mock('@chainlink/solana-view-function-adapter', () => ({
  ...jest.requireActual('@chainlink/solana-view-function-adapter'),
  makeExecute: jest.fn().mockReturnValue(() => mockSolanaViewFunctionResponse),
}))

jest.mock('@chainlink/token-allocation-adapter', () => ({
  ...jest.requireActual('@chainlink/token-allocation-adapter'),
  makeExecute: jest.fn().mockReturnValue(() => mockTokenAllocationResponse),
}))

let oldEnv: NodeJS.ProcessEnv

describe('accounts', () => {
  let server: http.Server
  let req: SuperTest<Test>

  const SOLIDO_ADDRESS = 'EMtjYGwPnXdtqK5SGL8CWGv4wgdBQN79UPoy53x9bBTJ'
  const STSOL_ADDRESS = 'BSGfVnE6q6KemspkugEERU8x7WbQwSKwvHT1cZZ4ACVN'
  const BSOL_ADDRESS = '3FMBoeddUhtqxepzkrxPrMUV3CL4bZM5QmMoLJfEpirz'
  const SOLIDO_CONTRACT_VERSION = '0'

  beforeEach(async () => {
    oldEnv = JSON.parse(JSON.stringify(process.env))
    server = await startServer()
    req = request(`localhost:${(server.address() as AddressInfo).port}`)
    process.env.RPC_URL = 'https://api.devnet.solana.com'
    process.env.SOLIDO_ADDRESS = SOLIDO_ADDRESS
    process.env.STSOL_ADDRESS = STSOL_ADDRESS
    process.env.BSOL_ADDRESS = BSOL_ADDRESS
    process.env.SOLIDO_CONTRACT_VERSION = SOLIDO_CONTRACT_VERSION
  })

  afterAll((done) => {
    process.env = oldEnv
    server.close(done)
  })

  describe('successful calls', () => {
    const jobID = '1'

    it('return success when fetching the account information', async () => {
      const data: AdapterRequest = {
        id: jobID,
        data: {
          source: 'tiingo',
        },
      }
      const response = await req
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
