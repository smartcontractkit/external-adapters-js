import { AdapterRequest, FastifyInstance } from '@chainlink/ea-bootstrap'
import request, { SuperTest, Test } from 'supertest'
import * as process from 'process'
import { server as startServer } from '../../src'
import * as nock from 'nock'
import {
  mockResponseSuccessHealth,
  mockResponseSuccessBlock,
  mockResponseFailureHealth,
  mockResponseFailureBlock,
} from './fixtures'
import { AddressInfo } from 'net'
import { ethers } from 'ethers'
import { setEnvVariables } from '@chainlink/ea-test-helpers'

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
  let fastify: FastifyInstance
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
    setEnvVariables(oldEnv)
    nock.restore()
    nock.cleanAll()
    nock.enableNetConnect()
    if (process.env.RECORD) {
      nock.recorder.play()
    }
  })

  beforeEach(async () => {
    fastify = await startServer()
    req = request(`localhost:${(fastify.server.address() as AddressInfo).port}`)
  })

  afterEach((done) => {
    fastify.close(done)
  })

  async function sendRequestAndExpectStatus(data: AdapterRequest, status: number) {
    const response = await req
      .post('/')
      .send(data)
      .set('Accept', '*/*')
      .set('Content-Type', 'application/json')
      .expect('Content-Type', /json/)
      .expect(200)
    expect(response.body.result).toEqual(status)
    expect(response.body).toMatchSnapshot()
  }

  describe('arbitrum network', () => {
    it('should return success when all methods succeed', async () => {
      mockResponseSuccessBlock()

      const data: AdapterRequest = {
        id,
        data: {
          network: 'arbitrum',
        },
      }
      await sendRequestAndExpectStatus(data, 0)
    })

    it('should return transaction submission is successful', async () => {
      mockResponseFailureBlock()

      const data: AdapterRequest = {
        id,
        data: {
          network: 'arbitrum',
          requireTxFailure: true,
        },
      }

      await sendRequestAndExpectStatus(data, 0)
    })

    it('should return failure if tx not required even if it would be successful', async () => {
      mockResponseFailureBlock()

      const data: AdapterRequest = {
        id,
        data: {
          network: 'arbitrum',
          requireTxFailure: false,
        },
      }

      await sendRequestAndExpectStatus(data, 1)
    })
  })

  describe('optimism network', () => {
    it('should return success when all methods succeed', async () => {
      mockResponseSuccessHealth()
      mockResponseSuccessBlock()

      const data: AdapterRequest = {
        id,
        data: {
          network: 'optimism',
        },
      }

      await sendRequestAndExpectStatus(data, 0)
    })

    it('should return transaction submission is successful', async () => {
      mockResponseFailureHealth()
      mockResponseFailureBlock()

      const data: AdapterRequest = {
        id,
        data: {
          network: 'optimism',
          requireTxFailure: true,
        },
      }

      await sendRequestAndExpectStatus(data, 0)
    })

    it('should return failure if tx not required even if it would be successful', async () => {
      mockResponseFailureHealth()
      mockResponseFailureBlock()

      const data: AdapterRequest = {
        id,
        data: {
          network: 'optimism',
          requireTxFailure: false,
        },
      }

      await sendRequestAndExpectStatus(data, 1)
    })
  })

  describe('scroll network', () => {
    it('should return success when all methods succeed', async () => {
      mockResponseSuccessBlock()
      mockResponseSuccessHealth()

      const data: AdapterRequest = {
        id,
        data: {
          network: 'scroll',
        },
      }

      await sendRequestAndExpectStatus(data, 0)
    })

    it('should return transaction submission is successful', async () => {
      mockResponseFailureBlock()
      mockResponseSuccessHealth()

      const data: AdapterRequest = {
        id,
        data: {
          network: 'scroll',
          requireTxFailure: true,
        },
      }

      await sendRequestAndExpectStatus(data, 0)
    })

    it('should return failure if tx not required even if it would be successful', async () => {
      mockResponseFailureBlock()
      mockResponseFailureHealth()

      const data: AdapterRequest = {
        id,
        data: {
          network: 'scroll',
          requireTxFailure: false,
        },
      }

      await sendRequestAndExpectStatus(data, 1)
    })
  })

  describe('zksync network', () => {
    it('should return success when all methods succeed', async () => {
      mockResponseSuccessBlock()
      mockResponseSuccessHealth()

      const data: AdapterRequest = {
        id,
        data: {
          network: 'zksync',
        },
      }

      await sendRequestAndExpectStatus(data, 0)
    })

    it('should return transaction submission is successful', async () => {
      mockResponseFailureBlock()
      mockResponseSuccessHealth()

      const data: AdapterRequest = {
        id,
        data: {
          network: 'zksync',
          requireTxFailure: true,
        },
      }

      await sendRequestAndExpectStatus(data, 0)
    })

    it('should return failure if tx not required even if it would be successful', async () => {
      mockResponseFailureBlock()
      mockResponseFailureHealth()

      const data: AdapterRequest = {
        id,
        data: {
          network: 'zksync',
          requireTxFailure: false,
        },
      }

      await sendRequestAndExpectStatus(data, 1)
    })
  })
  describe('base network', () => {
    it('should return success when all methods succeed', async () => {
      mockResponseSuccessHealth()
      mockResponseSuccessBlock()

      const data: AdapterRequest = {
        id,
        data: {
          network: 'base',
        },
      }

      await sendRequestAndExpectStatus(data, 0)
    })

    it('should return transaction submission is successful', async () => {
      mockResponseFailureHealth()
      mockResponseFailureBlock()

      const data: AdapterRequest = {
        id,
        data: {
          network: 'base',
          requireTxFailure: true,
        },
      }

      await sendRequestAndExpectStatus(data, 0)
    })

    it('should return failure if tx not required even if it would be successful', async () => {
      mockResponseFailureHealth()
      mockResponseFailureBlock()

      const data: AdapterRequest = {
        id,
        data: {
          network: 'base',
        },
      }

      await sendRequestAndExpectStatus(data, 1)
    })
  })

  describe('Linea network', () => {
    it('should return success when all methods succeed', async () => {
      mockResponseSuccessBlock()
      mockResponseSuccessHealth()

      const data: AdapterRequest = {
        id,
        data: {
          network: 'linea',
        },
      }

      await sendRequestAndExpectStatus(data, 0)
    })

    it('should return transaction submission is successful', async () => {
      mockResponseFailureBlock()
      mockResponseSuccessHealth()

      const data: AdapterRequest = {
        id,
        data: {
          network: 'linea',
          requireTxFailure: true,
        },
      }

      await sendRequestAndExpectStatus(data, 0)
    })

    it('should return failure if tx not required even if it would be successful', async () => {
      mockResponseFailureBlock()
      mockResponseFailureHealth()

      const data: AdapterRequest = {
        id,
        data: {
          network: 'linea',
          requireTxFailure: false,
        },
      }

      await sendRequestAndExpectStatus(data, 1)
    })
  })

  describe('metis network', () => {
    it('should return success when all methods succeed', async () => {
      mockResponseSuccessHealth()
      mockResponseSuccessBlock()

      const data: AdapterRequest = {
        id,
        data: {
          network: 'metis',
        },
      }

      await sendRequestAndExpectStatus(data, 0)
    })

    it('should return transaction submission is successful', async () => {
      mockResponseFailureHealth()
      mockResponseFailureBlock()

      const data: AdapterRequest = {
        id,
        data: {
          network: 'metis',
          requireTxFailure: true,
        },
      }

      await sendRequestAndExpectStatus(data, 0)
    })

    it('should return failure if tx not required even if it would be successful', async () => {
      mockResponseFailureHealth()
      mockResponseFailureBlock()

      const data: AdapterRequest = {
        id,
        data: {
          network: 'metis',
          requireTxFailure: false,
        },
      }

      await sendRequestAndExpectStatus(data, 1)
    })
  })
})
