import { AdapterRequest } from '@chainlink/types'
import { server as startServer } from '../../../src'
import nock from 'nock'
import http from 'http'
import request, { SuperTest, Test } from 'supertest'
import { mockErrorFeedResponse, mockSuccessfulTerraEthFeedResp } from '../fixtures'

import { ethers, BigNumber } from 'ethers'
import '@chainlink/terra-view-function-adapter'
import { AddressInfo } from 'net'

const mockBigNum = BigNumber.from(10).pow(18)
const mockStETHETHPrice = BigNumber.from('1035144096528344468')
const mockZero = BigNumber.from('0')

const ERROR_ETH_FEED = 'error-eth-feed-address'
const ERROR_STETH_ETH_CURVE_ADDRESS = 'error-curve-address'
const ERROR_ANCHOR_VAULT_ADDRESS = 'error-anchor-vault-address'

jest.mock('@chainlink/terra-view-function-adapter', () => {
  return {
    ...jest.requireActual('@chainlink/terra-view-function-adapter'),
    makeExecute: jest.fn().mockReturnValue(
      jest.fn().mockImplementation((input: AdapterRequest) => {
        const address = input.data.address
        if (address === ERROR_ETH_FEED) {
          return mockErrorFeedResponse
        }
        return mockSuccessfulTerraEthFeedResp
      }),
    ),
  }
})

jest.mock('ethers', () => {
  const actualModule = jest.requireActual('ethers')
  return {
    ...actualModule,
    ethers: {
      ...actualModule.ethers,
      providers: {
        JsonRpcProvider: function (_: string): ethers.provider.JsonRpcProvider {
          return {}
        },
      },
      Contract: function (address: string) {
        return {
          get_rate: (____: string) => {
            return address === ERROR_ANCHOR_VAULT_ADDRESS ? mockZero : mockBigNum
          },
          get_dy: () => {
            return address === ERROR_STETH_ETH_CURVE_ADDRESS ? mockZero : mockStETHETHPrice
          },
        }
      },
    },
  }
})

let oldEnv: NodeJS.ProcessEnv

let server: http.Server
let req: SuperTest<Test>
const jobID = '1'

describe('price-beth', () => {
  beforeEach(async () => {
    oldEnv = JSON.parse(JSON.stringify(process.env))
    server = await startServer()
    req = request(`localhost:${(server.address() as AddressInfo).port}`)
    process.env.COLUMBUS_5_LCD_URL = 'fake-columbus-lcd'
    process.env.API_KEY = 'test'
    process.env.ANCHOR_VAULT_CONTRACT_ADDRESS = 'test-address'
    process.env.COINGECKO_ADAPTER_URL = 'http://localhost:5000'
    process.env.ETHEREUM_RPC_URL = 'test-rpc-url'
    process.env.CACHE_ENABLED = 'false'

    if (process.env.RECORD) {
      nock.recorder.rec()
    }
  })

  afterEach((done) => {
    process.env = oldEnv
    server.close(done)
  })

  describe('error calls', () => {
    it('should throw an error if the ETH/USD feed is down', async () => {
      process.env.ETH_TERRA_FEED_ADDRESS = ERROR_ETH_FEED
      const data: AdapterRequest = {
        id: jobID,
        data: {
          from: 'BETH',
          to: 'ETH',
        },
      }

      const response = await req
        .post('/')
        .send(data)
        .set('Accept', '*/*')
        .set('Content-Type', 'application/json')
        .expect('Content-Type', /json/)
        .expect(500)
      expect(response.body).toMatchSnapshot()
    })

    it('should throw an error if the stETH/ETH Curve pool is having issues', async () => {
      process.env.STETH_POOL_CONTRACT_ADDRESS = ERROR_STETH_ETH_CURVE_ADDRESS
      const data: AdapterRequest = {
        id: jobID,
        data: {
          from: 'BETH',
          to: 'ETH',
        },
      }

      const response = await req
        .post('/')
        .send(data)
        .set('Accept', '*/*')
        .set('Content-Type', 'application/json')
        .expect('Content-Type', /json/)
        .expect(500)
      expect(response.body).toMatchSnapshot()
    })

    it('should throw an error if the Anchor Vault contract returns 0', async () => {
      process.env.ANCHOR_VAULT_CONTRACT_ADDRESS = ERROR_ANCHOR_VAULT_ADDRESS
      const data: AdapterRequest = {
        id: jobID,
        data: {
          from: 'BETH',
          to: 'ETH',
        },
      }

      const response = await req
        .post('/')
        .send(data)
        .set('Accept', '*/*')
        .set('Content-Type', 'application/json')
        .expect('Content-Type', /json/)
        .expect(500)
      expect(response.body).toMatchSnapshot()
    })
  })

  describe('successful calls', () => {
    it('return success when fetching the USD/BEth price', async () => {
      const data: AdapterRequest = {
        id: jobID,
        data: {
          from: 'BETH',
          to: 'USD',
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
      const data: AdapterRequest = {
        id: jobID,
        data: {
          from: 'BETH',
          to: 'ETH',
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
