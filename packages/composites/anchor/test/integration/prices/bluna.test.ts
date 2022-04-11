import { AdapterRequest } from '@chainlink/types'
import { server as startServer } from '../../../src'
import nock from 'nock'
import http from 'http'
import request, { SuperTest, Test } from 'supertest'
import { AddressInfo } from 'net'
import {
  mockErrorAnchorHubContractResp,
  mockErrorFeedResponse,
  mockSuccessfulAnchorHubContractAddress,
  mockSuccessfulLunaFeedResp,
} from '../fixtures'

const ERROR_LUNA_FEED = 'error-luna-feed-address'
const FAILED_LUNA_FEED = 'failed-luna-feed-address'
const ERROR_TERRA_BLUNA_HUB_CONTRACT_ADDRESS = 'error-terra-bluna-hub-contract-address'
const FAILED_TERRA_BLUNA_HUB_CONTRACT_ADDRESS = 'failed-terra-bluna-hub-contract-address'

jest.mock('@chainlink/terra-view-function-adapter', () => {
  return {
    ...jest.requireActual('@chainlink/terra-view-function-adapter'),
    makeExecute: jest.fn().mockReturnValue(
      jest.fn().mockImplementation((input: AdapterRequest) => {
        const { address, query } = input.data
        if (query === 'latest_round_data') {
          switch (address) {
            case ERROR_LUNA_FEED:
              return mockErrorFeedResponse
            case FAILED_LUNA_FEED:
              throw new Error('Call to Terra bLUNA/USD feed reverted')
            default:
              return mockSuccessfulLunaFeedResp
          }
        } else if (query.state) {
          switch (address) {
            case ERROR_TERRA_BLUNA_HUB_CONTRACT_ADDRESS:
              return mockErrorAnchorHubContractResp
            case FAILED_TERRA_BLUNA_HUB_CONTRACT_ADDRESS:
              throw new Error('Call to Terra bLuna HUB contract reverted')
            default:
              return mockSuccessfulAnchorHubContractAddress
          }
        }
      }),
    ),
  }
})

const jobID = '1'
let oldEnv: NodeJS.ProcessEnv

describe('price-bluna', () => {
  let server: http.Server
  let req: SuperTest<Test>

  beforeEach(async () => {
    oldEnv = JSON.parse(JSON.stringify(process.env))
    server = await startServer()
    req = request(`localhost:${(server.address() as AddressInfo).port}`)
    process.env.COLUMBUS_5_LCD_URL = 'fake-columbus-lcd'
    process.env.COINGECKO_ADAPTER_URL = 'http://localhost:5000'
    process.env.ETHEREUM_RPC_URL = 'test-rpc-url'
    process.env.ANCHOR_VAULT_CONTRACT_ADDRESS = 'fake-anchor-vault'

    if (process.env.RECORD) {
      nock.recorder.rec()
    }
  })

  afterEach((done) => {
    if (process.env.RECORD) {
      nock.recorder.play()
    }
    process.env = oldEnv
    nock.restore()
    nock.cleanAll()
    nock.enableNetConnect()
    server.close(done)
  })

  describe('error calls', () => {
    it('should throw an error if the LUNA/USD feed returns 0', async () => {
      process.env.LUNA_TERRA_FEED_ADDRESS = ERROR_LUNA_FEED
      const data: AdapterRequest = {
        id: jobID,
        data: {
          from: 'BLuna',
          to: 'USD',
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

    it('should throw an error if call to the LUNA/USD feed reverts', async () => {
      process.env.LUNA_TERRA_FEED_ADDRESS = FAILED_LUNA_FEED
      const data: AdapterRequest = {
        id: jobID,
        data: {
          from: 'BLuna',
          to: 'USD',
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

    it('should throw an error if the Anchor bLUNA Hub contract returns 0', async () => {
      process.env.TERRA_BLUNA_HUB_CONTRACT_ADDRESS = ERROR_TERRA_BLUNA_HUB_CONTRACT_ADDRESS

      const data: AdapterRequest = {
        id: jobID,
        data: {
          from: 'BLuna',
          to: 'USD',
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

    it('should throw an error if the call to the Anchor bLUNA Hub reverts', async () => {
      process.env.TERRA_BLUNA_HUB_CONTRACT_ADDRESS = FAILED_TERRA_BLUNA_HUB_CONTRACT_ADDRESS

      const data: AdapterRequest = {
        id: jobID,
        data: {
          from: 'BLuna',
          to: 'USD',
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
    const jobID = '1'

    it('return success when fetching the USD/BLuna price', async () => {
      const data: AdapterRequest = {
        id: jobID,
        data: {
          from: 'BLuna',
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

    it('returns success when fetching the ETH/BLuna price', async () => {
      const data: AdapterRequest = {
        id: jobID,
        data: {
          from: 'BLuna',
          to: 'ETH',
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
