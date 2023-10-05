import { AdapterRequest } from '@chainlink/ea-bootstrap'
import { server as startServer } from '../../src'
import { mockResponseFailureHealth, mockResponseFailureBlock } from './fixtures'
import { ethers } from 'ethers'
import { setupExternalAdapterTest } from '@chainlink/ea-test-helpers'
import type { SuiteContext } from '@chainlink/ea-test-helpers'
import { SuperTest, Test } from 'supertest'

const mockMessages = {
  'https://arb1.arbitrum.io/rpc': 'gas price too low',
  'https://mainnet.optimism.io': 'cannot accept 0 gas price transaction',
  'https://mainnet.base.org': 'transaction underpriced',
  'https://andromeda.metis.io/?owner=1088': 'cannot accept 0 gas price transaction',
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
            const message = mockMessages[this.provider.connection.url as keyof typeof mockMessages]
            reject({ error: { message } })
          })
        }
      },
    },
  }
})

describe('execute', () => {
  const id = '1'
  const context: SuiteContext = {
    req: null,
    server: startServer,
  }

  const envVariables = {
    CACHE_ENABLED: 'false',
  }

  setupExternalAdapterTest(envVariables, context)

  describe('arbitrum network', () => {
    it('should return success when transaction submission is known', async () => {
      mockResponseFailureHealth()
      mockResponseFailureBlock()

      const data: AdapterRequest = {
        id,
        data: {
          network: 'arbitrum',
        },
      }

      const response = await (context.req as SuperTest<Test>)
        .post('/')
        .send(data)
        .set('Accept', '*/*')
        .set('Content-Type', 'application/json')
        .expect('Content-Type', /json/)
        .expect(200)
      expect(response.body.result).toEqual(0)
      expect(response.body).toMatchSnapshot()
    })

    it('should return failure if tx not required', async () => {
      mockResponseFailureHealth()
      mockResponseFailureBlock()

      const data: AdapterRequest = {
        id,
        data: {
          network: 'arbitrum',
          requireTxFailure: false,
        },
      }

      const response = await (context.req as SuperTest<Test>)
        .post('/')
        .send(data)
        .set('Accept', '*/*')
        .set('Content-Type', 'application/json')
        .expect('Content-Type', /json/)
        .expect(200)
      expect(response.body.result).toEqual(1)
      expect(response.body).toMatchSnapshot()
    })
  })

  describe('optimism network', () => {
    it('should return success when transaction submission is known', async () => {
      mockResponseFailureHealth()
      mockResponseFailureBlock()

      const data: AdapterRequest = {
        id,
        data: {
          network: 'optimism',
          requireTxFailure: true,
        },
      }

      const response = await (context.req as SuperTest<Test>)
        .post('/')
        .send(data)
        .set('Accept', '*/*')
        .set('Content-Type', 'application/json')
        .expect('Content-Type', /json/)
        .expect(200)
      expect(response.body.result).toEqual(0)
      expect(response.body).toMatchSnapshot()
    })

    it('should return failure if tx not required', async () => {
      mockResponseFailureHealth()
      mockResponseFailureBlock()

      const data: AdapterRequest = {
        id,
        data: {
          network: 'optimism',
          requireTxFailure: false,
        },
      }

      const response = await (context.req as SuperTest<Test>)
        .post('/')
        .send(data)
        .set('Accept', '*/*')
        .set('Content-Type', 'application/json')
        .expect('Content-Type', /json/)
        .expect(200)
      expect(response.body.result).toEqual(1)
      expect(response.body).toMatchSnapshot()
    })
  })

  describe('base network', () => {
    it('should return success when transaction submission is known', async () => {
      mockResponseFailureHealth()
      mockResponseFailureBlock()

      const data: AdapterRequest = {
        id,
        data: {
          network: 'base',
          requireTxFailure: true,
        },
      }

      const response = await (context.req as SuperTest<Test>)
        .post('/')
        .send(data)
        .set('Accept', '*/*')
        .set('Content-Type', 'application/json')
        .expect('Content-Type', /json/)
        .expect(200)
      expect(response.body.result).toEqual(0)
      expect(response.body).toMatchSnapshot()
    })

    it('should return failure if tx not required', async () => {
      mockResponseFailureHealth()
      mockResponseFailureBlock()

      const data: AdapterRequest = {
        id,
        data: {
          network: 'base',
        },
      }

      const response = await (context.req as SuperTest<Test>)
        .post('/')
        .send(data)
        .set('Accept', '*/*')
        .set('Content-Type', 'application/json')
        .expect('Content-Type', /json/)
        .expect(200)
      expect(response.body.result).toEqual(1)
      expect(response.body).toMatchSnapshot()
    })
  })

  describe('metis network', () => {
    it('should return success when transaction submission is known', async () => {
      mockResponseFailureHealth()
      mockResponseFailureBlock()

      const data: AdapterRequest = {
        id,
        data: {
          network: 'metis',
        },
      }

      const response = await (context.req as SuperTest<Test>)
        .post('/')
        .send(data)
        .set('Accept', '*/*')
        .set('Content-Type', 'application/json')
        .expect('Content-Type', /json/)
        .expect(200)
      expect(response.body.result).toEqual(0)
      expect(response.body).toMatchSnapshot()
    })

    it('should return failure if tx not required', async () => {
      mockResponseFailureHealth()
      mockResponseFailureBlock()

      const data: AdapterRequest = {
        id,
        data: {
          network: 'metis',
          requireTxFailure: false,
        },
      }

      const response = await (context.req as SuperTest<Test>)
        .post('/')
        .send(data)
        .set('Accept', '*/*')
        .set('Content-Type', 'application/json')
        .expect('Content-Type', /json/)
        .expect(200)
      expect(response.body.result).toEqual(1)
      expect(response.body).toMatchSnapshot()
    })
  })
})
