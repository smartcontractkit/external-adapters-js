import { AdapterRequest, FastifyInstance } from '@chainlink/ea-bootstrap'
import { setEnvVariables } from '@chainlink/ea-test-helpers'
import { AddressInfo } from 'net'
import * as nock from 'nock'
import * as process from 'process'
import request, { SuperTest, Test } from 'supertest'
import { server as startServer } from '../../src'

const STARKWARE_RPC_ENDPOINT = 'https://starknet-mainnet.public.blastapi.io'

jest.mock('starknet', () => {
  const originalModule = jest.requireActual('starknet')
  return {
    ...originalModule,
    RpcProvider: jest.fn().mockImplementation(() => ({
      getBlockWithTxHashes: jest.fn().mockResolvedValue({
        parent_hash: 'mock-parent-hash',
        transactions: ['tx1', 'tx2', 'tx3'],
      }),
    })),
    Account: jest.fn().mockImplementation(() => ({
      execute: jest.fn().mockRejectedValue({
        message: 'Contract not found',
      }),
    })),
    ec: originalModule.ec,
  }
})

describe('execute - starkware network', () => {
  const id = '1'
  let fastify: FastifyInstance
  let req: SuperTest<Test>
  let oldEnv: NodeJS.ProcessEnv

  beforeAll(async () => {
    oldEnv = JSON.parse(JSON.stringify(process.env))

    process.env.CACHE_ENABLED = 'false'
    process.env.STARKWARE_RPC_ENDPOINT = STARKWARE_RPC_ENDPOINT

    if (process.env.RECORD) {
      nock.recorder.rec()
    }
  })

  afterAll(() => {
    setEnvVariables(oldEnv)
    nock.restore()
    nock.cleanAll()
    nock.enableNetConnect()
    if (process.env.RECORD) {
      nock.recorder.play()
    }
  })

  beforeEach(async () => {
    fastify = await startServer()
    req = request(`localhost:${(fastify.server.address() as AddressInfo).port}`)
  })

  afterEach((done) => {
    fastify.close(done)
  })

  async function sendRequestAndExpectStatus(data: AdapterRequest, status: number) {
    const response = await req
      .post('/')
      .send(data)
      .set('Accept', '*/*')
      .set('Content-Type', 'application/json')
      .expect('Content-Type', /json/)
      .expect(200)
    expect(response.body.result).toEqual(status)
    expect(response.body).toMatchSnapshot()
  }

  describe('starkware network healthy', () => {
    it('should return success when pending block check succeeds', async () => {
      const data: AdapterRequest = {
        id,
        data: {
          network: 'starkware',
        },
      }
      await sendRequestAndExpectStatus(data, 0)
    })

    it('should return success when transaction submission returns expected error', async () => {
      const data: AdapterRequest = {
        id,
        data: {
          network: 'starkware',
          requireTxFailure: true,
        },
      }
      await sendRequestAndExpectStatus(data, 0)
    })
  })
})
