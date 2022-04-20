import { AdapterRequest } from '@chainlink/types'
import request, { SuperTest, Test } from 'supertest'
import * as process from 'process'
import { server as startServer } from '../../src'
import * as nock from 'nock'
import * as http from 'http'
import { mockResponseFailureHealth, mockResponseFailureBlock } from './fixtures'
import { AddressInfo } from 'net'
import { ethers } from 'ethers'

const mockMessages = {
  'https://arb1.arbitrum.io/rpc': 'gas price too low',
  'https://mainnet.optimism.io': 'cannot accept 0 gas price transaction',
}

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
            const message = mockMessages[this.provider.connection.url]
            reject({ error: { message } })
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

    it('should return success when transaction submission is known', async () => {
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

    it('should return success when transaction submission is known', async () => {
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
