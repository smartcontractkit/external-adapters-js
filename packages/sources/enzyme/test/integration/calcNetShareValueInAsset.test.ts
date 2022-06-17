import { AdapterRequest } from '@chainlink/ea-bootstrap'
import request, { SuperTest, Test } from 'supertest'
import nock from 'nock'
import { server as startServer } from '../../src'
import { mockEthereumResponseSuccess } from './fixtures'
import { ENV_ETHEREUM_RPC_URL } from '../../src/config'
import { AddressInfo } from 'net'
import { FastifyInstance } from '@chainlink/ea-bootstrap'

let oldEnv: NodeJS.ProcessEnv

beforeAll(() => {
  oldEnv = JSON.parse(JSON.stringify(process.env))
  process.env.CACHE_ENABLED = 'false'
  process.env[ENV_ETHEREUM_RPC_URL] = process.env[ENV_ETHEREUM_RPC_URL] || 'http://localhost:8545/'
  process.env.API_VERBOSE = 'true'
  if (process.env.RECORD) {
    nock.recorder.rec()
  }
})

afterAll(() => {
  process.env = oldEnv
  if (process.env.RECORD) {
    nock.recorder.play()
  }

  nock.restore()
  nock.cleanAll()
  nock.enableNetConnect()
})

describe('execute', () => {
  const id = '1'
  let fastify: FastifyInstance
  let req: SuperTest<Test>

  beforeAll(async () => {
    fastify = await startServer()
    req = request(`localhost:${(fastify.server.address() as AddressInfo).port}`)
    process.env.CACHE_ENABLED = 'false'
  })

  afterAll((done) => {
    fastify.close(done)
  })

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
