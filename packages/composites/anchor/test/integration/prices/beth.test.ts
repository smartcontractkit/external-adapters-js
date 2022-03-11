import { AdapterRequest, AdapterResponse } from '@chainlink/types'
import { server as startServer } from '../../../src'
import nock from 'nock'
import http from 'http'
import request, { SuperTest, Test } from 'supertest'
import {
  mockBTCUSDPrice,
  mockETHUSDPrice,
  mockSTEthUSDPrice,
  mockSuccessfulTerraEthFeedResp,
} from '../fixtures'

import { ethers, BigNumber } from 'ethers'
import '@chainlink/terra-view-function-adapter'
import { AddressInfo } from 'net'

const mockBigNum = BigNumber.from(10).pow(18)
const mockStETHETHPrice = BigNumber.from('1035144096528344468')

const WORKING_LCD_URL = 'working-lcd-url'
const ERROR_LCD_URL = 'error-lcd-url'

jest.mock('@chainlink/terra-view-function-adapter', () => {
  return {
    ...jest.requireActual('@chainlink/terra-view-function-adapter'),
    makeExecute: (config) => {
      const lcdUrls = config.lcdUrls
      let result: AdapterResponse
      switch (lcdUrls['columbus-5']) {
        case ERROR_LCD_URL:
          result = mockSuccessfulTerraEthFeedResp
          break
        default:
          result = mockSuccessfulTerraEthFeedResp
      }
      return jest.fn().mockReturnValue(result)
    },
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
      Contract: function () {
        return {
          get_rate: (____: string) => {
            return mockBigNum
          },
          get_dy: () => {
            return mockStETHETHPrice
          },
        }
      },
    },
  }
})

let oldEnv: NodeJS.ProcessEnv

describe('price-beth', () => {
  let server: http.Server
  let req: SuperTest<Test>

  beforeAll(async () => {
    oldEnv = JSON.parse(JSON.stringify(process.env))
    server = await startServer()
    req = request(`localhost:${(server.address() as AddressInfo).port}`)
    process.env.COLUMBUS_5_LCD_URL = 'fake-columbus-lcd'
    process.env.API_KEY = 'test'
    process.env.ANCHOR_VAULT_CONTRACT_ADDRESS = 'test-address'
    process.env.COINGECKO_ADAPTER_URL = 'http://localhost:5000'
    process.env.ETHEREUM_RPC_URL = 'test-rpc-url'

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
  })
})
