import { AdapterRequest, FastifyInstance } from '@chainlink/ea-bootstrap'
import request, { SuperTest, Test } from 'supertest'
import * as process from 'process'
import { server as startServer } from '../../src'
import * as nock from 'nock'
import { mockResponseFailureHealth, mockResponseFailureBlock } from './fixtures'
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
          return new Promise((_, reject) => {
            reject({ error: { message: 'hello I am a test' } })
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
    const data: AdapterRequest = {
      id,
      data: {
        network: 'arbitrum',
      },
    }

    it('should return failure when transaction submission is unknown', async () => {
      mockResponseFailureHealth()
      mockResponseFailureBlock()

      await sendRequestAndExpectStatus(data, 1)
    })
  })

  describe('optimism network', () => {
    const data: AdapterRequest = {
      id,
      data: {
        network: 'optimism',
      },
    }

    it('should return failure when transaction submission is unknown', async () => {
      mockResponseFailureHealth()
      mockResponseFailureBlock()

      await sendRequestAndExpectStatus(data, 1)
    })
  })

  describe('base network', () => {
    const data: AdapterRequest = {
      id,
      data: {
        network: 'base',
        requireTxFailure: true,
      },
    }

    it('should return failure when transaction submission is unknown', async () => {
      mockResponseFailureHealth()
      mockResponseFailureBlock()

      await sendRequestAndExpectStatus(data, 1)
    })
  })

  describe('metis network', () => {
    const data: AdapterRequest = {
      id,
      data: {
        network: 'metis',
      },
    }

    it('should return failure when transaction submission is unknown', async () => {
      mockResponseFailureHealth()
      mockResponseFailureBlock()

      await sendRequestAndExpectStatus(data, 1)
    })
  })

  describe('ink network', () => {
    const data: AdapterRequest = {
      id,
      data: {
        network: 'ink',
      },
    }

    it('should return failure when transaction submission is unknown', async () => {
      mockResponseFailureHealth()
      mockResponseFailureBlock()

      await sendRequestAndExpectStatus(data, 1)
    })
  })

  describe('mantle network', () => {
    const data: AdapterRequest = {
      id,
      data: {
        network: 'mantle',
      },
    }

    it('should return failure when transaction submission is unknown', async () => {
      mockResponseFailureHealth()
      mockResponseFailureBlock()

      await sendRequestAndExpectStatus(data, 1)
    })
  })

  describe('unichain network', () => {
    const data: AdapterRequest = {
      id,
      data: {
        network: 'unichain',
      },
    }

    it('should return failure when transaction submission is unknown', async () => {
      mockResponseFailureHealth()
      mockResponseFailureBlock()

      await sendRequestAndExpectStatus(data, 1)
    })
  })

  describe('soneium network', () => {
    const data: AdapterRequest = {
      id,
      data: {
        network: 'soneium',
      },
    }

    it('should return failure when transaction submission is unknown', async () => {
      mockResponseFailureHealth()
      mockResponseFailureBlock()

      await sendRequestAndExpectStatus(data, 1)
    })
  })

  describe('celo network', () => {
    const data: AdapterRequest = {
      id,
      data: {
        network: 'celo',
      },
    }

    it('should return failure when transaction submission is unknown', async () => {
      mockResponseFailureHealth()
      mockResponseFailureBlock()

      await sendRequestAndExpectStatus(data, 1)
    })
  })
})
