import { AdapterRequest } from '@chainlink/types'
import { server as startServer } from '../../../src'
import nock from 'nock'
import http from 'http'
import request, { SuperTest, Test } from 'supertest'
import { mockBTCUSDPrice, mockETHUSDPrice, mockLunaUSDPrice } from '../fixtures'
import { AddressInfo } from 'net'

jest.mock('@chainlink/terra-view-function-adapter', () => {
  return {
    ...jest.requireActual('@chainlink/terra-view-function-adapter'),
    makeExecute: jest.fn().mockReturnValue(
      jest.fn().mockImplementation((input: AdapterRequest) => {
        const query = input.data.query
        if (query.aggregator_query && query.aggregator_query.get_latest_round_data) {
          return {
            jobRunID: '1',
            result: {
              round_id: 314711,
              answer: '262009859746',
              started_at: 1645564682,
              updated_at: 1645564682,
              answered_in_round: 314711,
            },
            statusCode: 200,
            data: {
              result: {
                round_id: 314711,
                answer: '262009859746',
                started_at: 1645564682,
                updated_at: 1645564682,
                answered_in_round: 314711,
              },
            },
          }
        } else if (query.state) {
          return {
            jobRunID: '1',
            result: {
              bluna_exchange_rate: '1.000007186099738229',
              stluna_exchange_rate: '1.016582973702789229',
              total_bond_bluna_amount: '83309307395117',
              total_bond_stluna_amount: '1789057091036',
              last_index_modification: 1646371624,
              prev_hub_balance: '239985782176',
              last_unbonded_time: 1646230817,
              last_processed_batch: 109,
              total_bond_amount: '83309307395117',
              exchange_rate: '1.000007186099738229',
            },
            statusCode: 200,
            data: {
              result: {
                bluna_exchange_rate: '1.000007186099738229',
                stluna_exchange_rate: '1.016582973702789229',
                total_bond_bluna_amount: '83309307395117',
                total_bond_stluna_amount: '1789057091036',
                last_index_modification: 1646371624,
                prev_hub_balance: '239985782176',
                last_unbonded_time: 1646230817,
                last_processed_batch: 109,
                total_bond_amount: '83309307395117',
                exchange_rate: '1.000007186099738229',
              },
            },
          }
        }
      }),
    ),
  }
})

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
  })
})
