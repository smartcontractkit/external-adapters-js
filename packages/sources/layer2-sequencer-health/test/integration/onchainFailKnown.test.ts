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
  'https://rpc.linea.build': 'Gas price below configured minimum gas price',
  'https://andromeda.metis.io/?owner=1088': 'cannot accept 0 gas price transaction',
  'https://rpc.scroll.io':
    'invalid transaction: insufficient funds for l1fee + gas * price + value',
  'https://mainnet.era.zksync.io': 'max fee per gas less than block base fee',
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
            const url = this.provider.connection.url
            const message = mockMessages[url as keyof typeof mockMessages]
            if (url.indexOf('scroll') !== -1) {
              reject({ error: { error: { message } } })
            }
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

  async function sendRequestAndExpectStatus(data: AdapterRequest, status: number) {
    const response = await (context.req as SuperTest<Test>)
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
    it('should return success when transaction submission is known', async () => {
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

    it('should return failure if tx not required', async () => {
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

      await sendRequestAndExpectStatus(data, 0)
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

      await sendRequestAndExpectStatus(data, 1)
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

      await sendRequestAndExpectStatus(data, 0)
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

      await sendRequestAndExpectStatus(data, 1)
    })
  })

  describe('Linea network', () => {
    it('should return success when transaction submission is known', async () => {
      mockResponseFailureBlock()

      const data: AdapterRequest = {
        id,
        data: {
          network: 'linea',
          requireTxFailure: true,
        },
      }

      await sendRequestAndExpectStatus(data, 0)
    })

    it('should return failure if tx not required', async () => {
      mockResponseFailureBlock()

      const data: AdapterRequest = {
        id,
        data: {
          network: 'linea',
        },
      }

      await sendRequestAndExpectStatus(data, 1)
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
          requireTxFailure: true,
        },
      }

      await sendRequestAndExpectStatus(data, 0)
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

      await sendRequestAndExpectStatus(data, 1)
    })
  })

  describe('scroll network', () => {
    it('should return success when transaction submission is known', async () => {
      mockResponseFailureBlock()

      const data: AdapterRequest = {
        id,
        data: {
          network: 'scroll',
          requireTxFailure: true,
        },
      }

      await sendRequestAndExpectStatus(data, 0)
    })

    it('should return failure if tx not required', async () => {
      mockResponseFailureBlock()

      const data: AdapterRequest = {
        id,
        data: {
          network: 'scroll',
        },
      }

      await sendRequestAndExpectStatus(data, 1)
    })
  })

  describe('zksync network', () => {
    it('should return success when transaction submission is known', async () => {
      mockResponseFailureBlock()

      const data: AdapterRequest = {
        id,
        data: {
          network: 'zksync',
          requireTxFailure: true,
        },
      }

      await sendRequestAndExpectStatus(data, 0)
    })

    it('should return failure if tx not required', async () => {
      mockResponseFailureBlock()

      const data: AdapterRequest = {
        id,
        data: {
          network: 'zksync',
        },
      }

      await sendRequestAndExpectStatus(data, 1)
    })
  })
})
