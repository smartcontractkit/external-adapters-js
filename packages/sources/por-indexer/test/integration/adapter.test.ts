import {
  TestAdapter,
  setEnvVariables,
} from '@chainlink/external-adapter-framework/util/testing-utils'
import * as nock from 'nock'
import {
  mockPorIndexerResponseSuccess,
  mockPorIndexerSecondBatch,
  mockResponseZeusMinerFeeSuccess,
} from './fixtures'

const snapshotBody = (response: { json: () => Record<string, unknown> }) => {
  const body = response.json()
  delete body.meta
  return body
}

describe('execute (default bitcoin-por-indexer path)', () => {
  let spy: jest.SpyInstance
  let testAdapter: TestAdapter
  let oldEnv: NodeJS.ProcessEnv

  beforeAll(async () => {
    oldEnv = JSON.parse(JSON.stringify(process.env))
    process.env['BITCOIN_MAINNET_POR_INDEXER_URL'] =
      process.env['BITCOIN_MAINNET_POR_INDEXER_URL'] ?? 'http://localhost:8545'
    process.env['BITCOIN_MAINNET_USE_STREAMS_INDEXER'] = 'false'
    process.env['ZEUS_ZBTC_API_URL'] = 'http://localhost:8547'
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
      mockPorIndexerResponseSuccess()
      const response = await testAdapter.request({
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
      })
      expect(response.statusCode).toBe(200)
      expect(snapshotBody(response)).toMatchSnapshot()
    })

    it('should batch addresses', async () => {
      mockPorIndexerResponseSuccess()
      mockPorIndexerSecondBatch()
      const response = await testAdapter.request({
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
      })
      expect(response.statusCode).toBe(200)
      expect(snapshotBody(response)).toMatchSnapshot()
    })

    it('should return failure for missing env', async () => {
      const response = await testAdapter.request({
        addresses: [
          {
            network: 'dogecoin',
            chainId: 'mainnet',
            address: '39e7mxbeNmRRnjfy1qkphv1TiMcztZ8VuE',
          },
        ],
        minConfirmations: 6,
      })
      expect(response.statusCode).toBe(400)
      expect(snapshotBody(response)).toMatchSnapshot()
    })

    it('should return failure for empty addresses', async () => {
      const response = await testAdapter.request({
        addresses: [],
        minConfirmations: 6,
      })
      expect(response.statusCode).toBe(400)
      expect(snapshotBody(response)).toMatchSnapshot()
    })
  })

  describe('zeusminerfees endpoint', () => {
    it('should return success', async () => {
      mockResponseZeusMinerFeeSuccess()
      const response = await testAdapter.request({
        endpoint: 'zeusMinerFee',
      })
      expect(response.statusCode).toBe(200)
      expect(snapshotBody(response)).toMatchSnapshot()
    })
  })
})
