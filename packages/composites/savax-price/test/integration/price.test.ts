import { AdapterRequest } from '@chainlink/types'
import request, { SuperTest, Test } from 'supertest'
import process from 'process'
import nock from 'nock'
import http from 'http'
import { server as startServer } from '../../src'
import { AddressInfo } from 'net'
import {
  mockCoinpaprikaAdapterResponseSuccess,
  mockCoinpaprikaAdapterResponseZeroValue,
} from './fixtures'
import { BigNumber } from 'ethers'

const TEST_SAVAX_CONTRACT_ADDRESS_WORKING = 'working-address'
const TEST_SAVAX_CONTRACT_ADDRESS_ERROR = 'error-address'

const mockPoolAvaxShares = BigNumber.from('1004199168782408294')
const mockErrorPoolAvaxShares = BigNumber.from('0')

jest.mock('ethers', () => {
  const originalEthersLib = jest.requireActual('ethers')
  return {
    ...originalEthersLib,
    ethers: {
      ...originalEthersLib.ethers,
      providers: {
        JsonRpcProvider: jest.fn().mockReturnValue({}),
      },
      Contract: function (address: string) {
        let pooledAvaxShares: BigNumber
        switch (address) {
          case TEST_SAVAX_CONTRACT_ADDRESS_ERROR:
            pooledAvaxShares = mockErrorPoolAvaxShares
            break
          default:
            pooledAvaxShares = mockPoolAvaxShares
        }
        return {
          getPooledAvaxByShares: jest.fn().mockReturnValue(pooledAvaxShares),
        }
      },
    },
  }
})

let oldEnv: NodeJS.ProcessEnv

beforeAll(() => {
  oldEnv = JSON.parse(JSON.stringify(process.env))
  process.env.AVALANCHE_RPC_URL = process.env.AVALANCHE_RPC_URL || 'http://localhost:1000'
  process.env.COINPAPRIKA_ADAPTER_URL =
    process.env.COINPAPRIKA_ADAPTER_URL || 'http://localhost:8081'
  process.env.API_VERBOSE = true as unknown as string
  process.env.CACHE_ENABLED = false as unknown as string
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
  let server: http.Server
  let req: SuperTest<Test>

  beforeAll(async () => {
    server = await startServer()
    req = request(`localhost:${(server.address() as AddressInfo).port}`)
  })

  afterAll((done) => {
    server.close(done)
  })

  describe('sAvax price successul responses', () => {
    mockCoinpaprikaAdapterResponseSuccess()

    beforeEach(() => {
      process.env.SAVAX_ADDRESS = TEST_SAVAX_CONTRACT_ADDRESS_WORKING
    })

    afterEach(() => {
      delete process.env.SAVAX_ADDRESS
    })

    const data: AdapterRequest = {
      id,
      data: {
        source: 'coinpaprika',
      },
    }

    it('should return the price of sAVAX correctly', async () => {
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

  describe('sAvax price error responses', () => {
    beforeEach(() => {
      process.env.SAVAX_ADDRESS = TEST_SAVAX_CONTRACT_ADDRESS_ERROR
    })

    afterEach(() => {
      delete process.env.SAVAX_ADDRESS
    })

    it('should throw an error if the AVAX price is 0', async () => {
      mockCoinpaprikaAdapterResponseZeroValue()
      const data: AdapterRequest = {
        id,
        data: {
          source: 'coinpaprika',
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

    it('should throw an error if the pooled sAVAX shares is 0', async () => {
      mockCoinpaprikaAdapterResponseSuccess()
      const data: AdapterRequest = {
        id,
        data: {
          source: 'coinpaprika',
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
})
