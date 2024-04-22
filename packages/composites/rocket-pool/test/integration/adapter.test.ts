import { AdapterRequest, FastifyInstance } from '@chainlink/ea-bootstrap'
import { AddressInfo } from 'net'
import nock from 'nock'
import request, { SuperTest, Test } from 'supertest'
import { server as startServer } from '../../src'
import { mockETHSuccess, mockUSDSuccess } from './fixtures'
import { ethers } from 'ethers'

jest.mock('ethers', () => ({
  ...jest.requireActual('ethers'),
  ethers: {
    providers: {
      JsonRpcProvider: function (): ethers.providers.JsonRpcProvider {
        return {} as ethers.providers.JsonRpcProvider
      },
    },
    Contract: function () {
      return {
        getExchangeRate: () => {
          return jest.requireActual('ethers').BigNumber.from('1040000000000000000')
        },
        decimals: () => {
          return jest.requireActual('ethers').BigNumber.from(18)
        },
      }
    },
  },
}))

jest.mock('@chainlink/ea-reference-data-reader', () => ({
  ...jest.requireActual('@chainlink/ea-reference-data-reader'),
  getLatestAnswer: () => {
    return 1290
  },
}))

describe('execute', () => {
  const id = '1'
  let fastify: FastifyInstance
  let req: SuperTest<Test>
  let oldEnv: NodeJS.ProcessEnv

  beforeAll(async () => {
    oldEnv = JSON.parse(JSON.stringify(process.env))

    process.env.CACHE_ENABLED = 'false'
    process.env.ETHEREUM_RPC_URL = 'http://test.rpc'
    if (process.env.RECORD) {
      nock.recorder.rec()
    }
    fastify = await startServer()
    req = request(`localhost:${(fastify.server.address() as AddressInfo).port}`)
  })

  afterAll((done) => {
    process.env = oldEnv

    if (process.env.RECORD) {
      nock.recorder.play()
    }

    nock.restore()
    nock.cleanAll()
    nock.enableNetConnect()
    fastify.close(done)
  })

  describe('reth endpoint', () => {
    it('returns rETH/ETH exchange rate as a hex string', async () => {
      const data: AdapterRequest = { id, data: {} }
      mockETHSuccess()

      const response = await req
        .post('/')
        .send(data)
        .set('Accept', '*/*')
        .set('Content-Type', 'application/json')
        .expect('Content-Type', /json/)
        .expect(200)
      expect(response.body).toMatchSnapshot()
    })

    it('returns rETH/USD price when "quote: USD" is passed as an input param', async () => {
      const data: AdapterRequest = { id, data: { quote: 'USD' } }
      mockUSDSuccess()

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
