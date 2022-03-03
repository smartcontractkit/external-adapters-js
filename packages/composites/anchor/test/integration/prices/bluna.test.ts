import { AdapterRequest, AdapterResponse } from '@chainlink/ea-bootstrap'
import { server as startServer } from '../../../src'
import nock from 'nock'
import http from 'http'
import request, { SuperTest, Test } from 'supertest'
import * as view from '@chainlink/terra-view-function-adapter'
import { mockBTCUSDPrice, mockETHUSDPrice, mockLunaUSDPrice } from '../fixtures'
import { AddressInfo } from 'net'

jest.mock('@chainlink/terra-view-function-adapter', () => ({
  ...jest.requireActual('@chainlink/terra-view-function-adapter'),
  makeExecute: () => async (): Promise<AdapterResponse> => {
    return {
      jobRunID: '1',
      result: {
        exchange_rate: '1.000007185645452839',
        total_bond_amount: '68005109008479',
        last_index_modification: 1638489529,
        prev_hub_balance: '371215777066',
        actual_unbonded_amount: '0',
        last_unbonded_time: 1638437701,
        last_processed_batch: 79,
      },
      statusCode: 200,
      data: {
        result: {
          exchange_rate: '1.000007185645452839',
          total_bond_amount: '68005109008479',
          last_index_modification: 1638489529,
          prev_hub_balance: '371215777066',
          actual_unbonded_amount: '0',
          last_unbonded_time: 1638437701,
          last_processed_batch: 79,
        },
      },
      metricsMeta: {
        feedId:
          '{"jobID":"1","data":{"address":"terra1mtwph2juhj0rvjz7dy92gvl6xvukaxu8rfv8ts","query":{"state":{}}}}',
      },
    }
  },
}))

let oldEnv: NodeJS.ProcessEnv

describe('price-bluna', () => {
  let server: http.Server
  let req: SuperTest<Test>

  beforeAll(async () => {
    oldEnv = JSON.parse(JSON.stringify(process.env))
    server = await startServer()
    req = request(`localhost:${(server.address() as AddressInfo).port}`)
    process.env.COLUMBUS_5_RPC_URL = 'fake-columbus-rpc'
    process.env.COINGECKO_ADAPTER_URL = 'http://localhost:5000'
    process.env.RPC_URL = 'test-rpc-url'
    process.env.ANCHOR_VAULT_CONTRACT_ADDRESS = 'fake-anchor-vault'

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

    it('return success when fetching the USD/BLuna price', async () => {
      mockLunaUSDPrice()
      const data: AdapterRequest = {
        id: jobID,
        data: {
          from: 'BLuna',
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

    it('returns success when fetching the ETH/BLuna price', async () => {
      mockLunaUSDPrice()
      mockETHUSDPrice()
      const data: AdapterRequest = {
        id: jobID,
        data: {
          from: 'BLuna',
          to: 'ETH',
          source: 'coingecko',
          terraBLunaContractAddress: 'terra1mtwph2juhj0rvjz7dy92gvl6xvukaxu8rfv8ts',
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

    it('returns success when fetching the BTC/BLuna price', async () => {
      mockLunaUSDPrice()
      mockBTCUSDPrice()
      const data: AdapterRequest = {
        id: jobID,
        data: {
          from: 'BLuna',
          to: 'BTC',
          source: 'coingecko',
          terraBLunaContractAddress: 'terra1mtwph2juhj0rvjz7dy92gvl6xvukaxu8rfv8ts',
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
