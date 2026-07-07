import {
  TestAdapter,
  setEnvVariables,
} from '@chainlink/external-adapter-framework/util/testing-utils'
import * as nock from 'nock'
import {
  mockMinConfirmationsExclusion,
  mockResponseSuccess,
  mockResponseZeusMinerFeeSuccess,
  mockSecondBatch,
} from './fixtures'

const snapshotBody = (response: { json: () => Record<string, unknown> }) => {
  const body = response.json()
  delete body.meta
  return body
}

describe('execute', () => {
  let spy: jest.SpyInstance
  let testAdapter: TestAdapter
  let oldEnv: NodeJS.ProcessEnv

  beforeAll(async () => {
    oldEnv = JSON.parse(JSON.stringify(process.env))
    process.env['BITCOIN_MAINNET_RPC_URL'] =
      process.env['BITCOIN_MAINNET_RPC_URL'] ?? 'http://localhost:8545'
    process.env['ZEUS_ZBTC_API_URL'] = 'http://localhost:8546'
    process.env['BACKGROUND_EXECUTE_MS'] = '0'
    process.env['BATCH_SIZE'] = '2'
    const mockDate = new Date('2001-01-01T11:11:11.111Z')
    spy = jest.spyOn(Date, 'now').mockReturnValue(mockDate.getTime())

    const adapter = (await import('./../../src')).adapter
    testAdapter = await TestAdapter.startWithMockedCache(adapter, {
      testAdapter: {} as TestAdapter<never>,
    })
  })

  afterAll(async () => {
    setEnvVariables(oldEnv)
    await testAdapter.api.close()
    nock.restore()
    nock.cleanAll()
    spy.mockRestore()
  })

  describe('balance endpoint', () => {
    it('should return success', async () => {
      const data = {
        addresses: [
          {
            network: 'bitcoin',
            chainId: 'mainnet',
            address: '39e7mxbeNmRRnjfy1qkphv1TiMcztZ8VuE',
          },
          {
            network: 'bitcoin',
            chainId: 'mainnet',
            address: '35ULMyVnFoYaPaMxwHTRmaGdABpAThM4QR',
          },
        ],
        minConfirmations: 6,
      }
      mockResponseSuccess()
      const response = await testAdapter.request(data)
      expect(response.statusCode).toBe(200)
      expect(snapshotBody(response)).toMatchSnapshot()
    })

    it('should batch addresses', async () => {
      const data = {
        addresses: [
          {
            network: 'bitcoin',
            chainId: 'mainnet',
            address: '39e7mxbeNmRRnjfy1qkphv1TiMcztZ8VuE',
          },
          {
            network: 'bitcoin',
            chainId: 'mainnet',
            address: '35ULMyVnFoYaPaMxwHTRmaGdABpAThM4QR',
          },
          {
            network: 'bitcoin',
            chainId: 'mainnet',
            address: '3KLdeu9maZAfccm3TeRWEmUMuw2e8SLo4v',
          },
        ],
        minConfirmations: 6,
      }
      mockSecondBatch()
      const response = await testAdapter.request(data)
      expect(response.statusCode).toBe(200)
      expect(snapshotBody(response)).toMatchSnapshot()
    })

    it('should exclude UTXOs below minConfirmations', async () => {
      mockMinConfirmationsExclusion()
      const response = await testAdapter.request({
        addresses: [
          {
            network: 'bitcoin',
            chainId: 'mainnet',
            address: '39e7mxbeNmRRnjfy1qkphv1TiMcztZ8VuE',
          },
        ],
        minConfirmations: 6,
      })
      expect(response.statusCode).toBe(200)
      expect(response.json().result).toBe('10000')
    })

    it('should return failure for unsupported network', async () => {
      const data = {
        addresses: [
          {
            network: 'dogecoin',
            chainId: 'mainnet',
            address: '39e7mxbeNmRRnjfy1qkphv1TiMcztZ8VuE',
          },
        ],
        minConfirmations: 6,
      }
      const response = await testAdapter.request(data)
      expect(response.statusCode).toBe(400)
      expect(snapshotBody(response)).toMatchSnapshot()
    })

    it('should return failure for empty addresses', async () => {
      const data = {
        addresses: [],
        minConfirmations: 6,
      }
      const response = await testAdapter.request(data)
      expect(response.statusCode).toBe(400)
      expect(snapshotBody(response)).toMatchSnapshot()
    })
  })

  describe('zeusminerfees endpoint', () => {
    it('should return success', async () => {
      const data = {
        endpoint: 'zeusMinerFee',
      }
      mockResponseZeusMinerFeeSuccess()
      const response = await testAdapter.request(data)
      expect(response.statusCode).toBe(200)
      expect(snapshotBody(response)).toMatchSnapshot()
    })
  })
})
