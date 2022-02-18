import { AdapterRequest } from '@chainlink/types'
import { server as startServer } from '../../../src'
import nock from 'nock'
import http from 'http'
import request, { SuperTest, Test } from 'supertest'
import { mockBTCUSDPrice, mockETHUSDPrice, mockSTEthUSDPrice } from '../fixtures'

import { ethers, BigNumber } from 'ethers'
import { AddressInfo } from 'net'

const mockBigNum = BigNumber.from(10).pow(18)
const mockEthBalance = BigNumber.from('600035129129882344513625')
const mockStEthBalance = BigNumber.from('610505943959151982581203')

jest.mock('ethers', () => ({
  ...jest.requireActual('ethers'),
  ethers: {
    providers: {
      JsonRpcProvider: function (_: string): ethers.provider.JsonRpcProvider {
        return {}
      },
    },
    Contract: function () {
      return {
        get_rate: (____: string) => {
          return mockBigNum
        },
        balances: (id: number): BigNumber => {
          if (id === 0) {
            return mockEthBalance
          } else {
            return mockStEthBalance
          }
        },
      }
    },
  },
}))

let oldEnv: NodeJS.ProcessEnv

describe('price-beth', () => {
  let server: http.Server
  let req: SuperTest<Test>

  beforeAll(async () => {
    oldEnv = JSON.parse(JSON.stringify(process.env))
    server = await startServer()
    req = request(`localhost:${(server.address() as AddressInfo).port}`)
    process.env.COLUMBUS_5_RPC_URL = 'fake-columbus-rpc'
    process.env.API_KEY = 'test'
    process.env.ANCHOR_VAULT_CONTRACT_ADDRESS = 'test-address'
    process.env.COINGECKO_ADAPTER_URL = 'http://localhost:5000'
    process.env.RPC_URL = 'test-rpc-url'

    if (process.env.RECORD) {
      nock.recorder.rec()
    }
  })

  afterAll((done) => {
    if (process.env.RECORD) {
      nock.recorder.play()
    }
    process.env = oldEnv
    nock.restore()
    nock.cleanAll()
    nock.enableNetConnect()
    server.close(done)
  })

  describe('successful calls', () => {
    const jobID = '1'

    it('return success when fetching the USD/BEth price', async () => {
      mockSTEthUSDPrice()
      const data: AdapterRequest = {
        id: jobID,
        data: {
          from: 'BETH',
          to: 'USD',
          source: 'coingecko',
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

    it('returns success when fetching the ETH/BEth price', async () => {
      mockSTEthUSDPrice()
      mockETHUSDPrice()
      const data: AdapterRequest = {
        id: jobID,
        data: {
          from: 'BETH',
          to: 'ETH',
          source: 'coingecko',
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

    it('returns success when fetching the BTC/BEth price', async () => {
      mockSTEthUSDPrice()
      mockBTCUSDPrice()

      const data: AdapterRequest = {
        id: jobID,
        data: {
          from: 'BETH',
          to: 'BTC',
          source: 'coingecko',
          quoteDecimals: 8,
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
