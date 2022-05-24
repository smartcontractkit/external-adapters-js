import * as process from 'process'
import { AdapterRequest } from '@chainlink/types'
import request, { SuperTest, Test } from 'supertest'
import { server as startServer } from '../../src'
import { mockPoRindexerSuccess, mockEthBalanceSuccess } from './fixtures'
import * as nock from 'nock'
import { AddressInfo } from 'net'

beforeAll(() => {
  if (process.env.RECORD) {
    nock.recorder.rec()
  }
  process.env.ETH_BALANCE_ADAPTER_URL = 'https://eth-balance-adapter.com'
  process.env.POR_INDEXER_ADAPTER_URL = 'https://por-indexer-adapter.com'
})

afterAll(() => {
  if (process.env.RECORD) {
    nock.recorder.play()
  }

  nock.restore()
  nock.cleanAll()
  nock.enableNetConnect()
})

let oldEnv: NodeJS.ProcessEnv

beforeEach(() => {
  oldEnv = JSON.parse(JSON.stringify(process.env))
})

afterEach(() => {
  for (const envVar in oldEnv) {
    process.env[envVar] = oldEnv[envVar]
  }
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

  describe('Bitcoin list protocol', () => {
    const data: AdapterRequest = {
      id: '1',
      data: {
        protocol: 'list',
        indexer: 'por_indexer',
        addresses: [
          { address: '39e7mxbeNmRRnjfy1qkphv1TiMcztZ8VuE', chainId: 'mainnet', network: 'bitcoin' },
          {
            address: '35ULMyVnFoYaPaMxwHTRmaGdABpAThM4QR',
            chainId: 'mainnet',
            network: 'bitcoin',
          },
        ],
      },
    }

    it('should return success', async () => {
      mockPoRindexerSuccess()
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

  describe('Ethereum list protocol', () => {
    const data: AdapterRequest = {
      id: '1',
      data: {
        indexer: 'eth_balance',
        protocol: 'list',
        addresses: [
          '0x8288C280F35FB8809305906C79BD075962079DD8',
          '0x81910675DbaF69deE0fD77570BFD07f8E436386A',
        ],
        confirmations: 5,
      },
    }

    it('should return success', async () => {
      mockEthBalanceSuccess()
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
