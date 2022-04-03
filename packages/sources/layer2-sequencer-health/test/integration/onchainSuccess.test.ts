import { AdapterRequest } from '@chainlink/types'
import request, { SuperTest, Test } from 'supertest'
import * as process from 'process'
import { server as startServer } from '../../src'
import * as nock from 'nock'
import * as http from 'http'
import {
  mockResponseSuccessHealth,
  mockResponseSuccessBlock,
  mockResponseFailureHealth,
  mockResponseFailureBlock,
} from './fixtures'
import { AddressInfo } from 'net'
import { ethers } from 'ethers'

jest.mock('ethers', () => {
  const originalModule = jest.requireActual('ethers')
  return {
    __esModule: true,
    ...originalModule,
    ethers: {
      ...originalModule.ethers,
      Wallet: class MockWallet extends originalModule.Wallet {
        sendTransaction(): Promise<ethers.providers.TransactionResponse> {
          return new Promise((resolve) => {
            resolve(
              new Promise((r) => {
                r({
                  from: '',
                  to: '',
                  data: '',
                  hash: '',
                  confirmations: 1,
                  nonce: 1,
                  gasLimit: originalModule.BigNumber.from(0),
                  value: originalModule.BigNumber.from(0),
                  chainId: 1,
                  wait: () =>
                    new Promise((r2) => {
                      r2({
                        from: '',
                        to: '',
                        confirmations: 1,
                        contractAddress: '',
                        transactionIndex: 1,
                        gasUsed: originalModule.BigNumber.from(0),
                        logsBloom: '',
                        blockHash: '',
                        transactionHash: '',
                        logs: [] as ethers.providers.Log[],
                        blockNumber: 1,
                        cumulativeGasUsed: originalModule.BigNumber.from(0),
                        effectiveGasPrice: originalModule.BigNumber.from(0),
                        byzantium: false,
                        type: 1,
                      })
                    }),
                })
              }),
            )
          })
        }
      },
    },
  }
})

describe('execute', () => {
  const id = '1'
  let server: http.Server
  let req: SuperTest<Test>
  let oldEnv: NodeJS.ProcessEnv

  beforeAll(async () => {
    oldEnv = JSON.parse(JSON.stringify(process.env))

    process.env.CACHE_ENABLED = 'false'

    if (process.env.RECORD) {
      nock.recorder.rec()
    }
  })

  afterAll(() => {
    process.env = oldEnv
    nock.restore()
    nock.cleanAll()
    nock.enableNetConnect()
    if (process.env.RECORD) {
      nock.recorder.play()
    }
  })

  beforeEach(async () => {
    server = await startServer()
    req = request(`localhost:${(server.address() as AddressInfo).port}`)
  })

  afterEach((done) => {
    server.close(done)
  })

  describe('arbitrum network', () => {
    const data: AdapterRequest = {
      id,
      data: {
        network: 'arbitrum',
      },
    }

    it('should return success when all methods succeed', async () => {
      mockResponseSuccessHealth()
      mockResponseSuccessBlock()

      const response = await req
        .post('/')
        .send(data)
        .set('Accept', '*/*')
        .set('Content-Type', 'application/json')
        .expect('Content-Type', /json/)
        .expect(200)
      expect(response.body.result).toEqual(0)
      expect(response.body).toMatchSnapshot()
    })

    it('should return transaction submission is successful', async () => {
      mockResponseFailureHealth()
      mockResponseFailureBlock()

      const response = await req
        .post('/')
        .send(data)
        .set('Accept', '*/*')
        .set('Content-Type', 'application/json')
        .expect('Content-Type', /json/)
        .expect(200)
      expect(response.body.result).toEqual(0)
      expect(response.body).toMatchSnapshot()
    })
  })

  describe('optimism network', () => {
    const data: AdapterRequest = {
      id,
      data: {
        network: 'optimism',
      },
    }

    it('should return success when all methods succeed', async () => {
      mockResponseSuccessHealth()
      mockResponseSuccessBlock()

      const response = await req
        .post('/')
        .send(data)
        .set('Accept', '*/*')
        .set('Content-Type', 'application/json')
        .expect('Content-Type', /json/)
        .expect(200)
      expect(response.body.result).toEqual(0)
      expect(response.body).toMatchSnapshot()
    })

    it('should return transaction submission is successful', async () => {
      mockResponseFailureHealth()
      mockResponseFailureBlock()

      const response = await req
        .post('/')
        .send(data)
        .set('Accept', '*/*')
        .set('Content-Type', 'application/json')
        .expect('Content-Type', /json/)
        .expect(200)
      expect(response.body.result).toEqual(0)
      expect(response.body).toMatchSnapshot()
    })
  })
})
