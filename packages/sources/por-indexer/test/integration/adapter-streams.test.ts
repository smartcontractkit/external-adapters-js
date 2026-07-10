import {
  TestAdapter,
  setEnvVariables,
} from '@chainlink/external-adapter-framework/util/testing-utils'
import * as nock from 'nock'
import {
  mockMinConfirmationsExclusion,
  mockStreamsResponseSuccess,
  mockStreamsSecondBatch,
} from './fixtures'

describe('execute (streams Bitcoin indexer opt-in)', () => {
  let spy: jest.SpyInstance
  let testAdapter: TestAdapter
  let oldEnv: NodeJS.ProcessEnv

  beforeAll(async () => {
    oldEnv = JSON.parse(JSON.stringify(process.env))
    process.env['BITCOIN_MAINNET_USE_STREAMS_INDEXER'] = 'true'
    process.env['BITCOIN_MAINNET_RPC_URL'] = 'http://localhost:8546'
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

  it('should return success', async () => {
    mockStreamsResponseSuccess()
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
    expect(response.json().result).toBe('24242')
  })

  it('should batch addresses', async () => {
    mockStreamsSecondBatch()
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
    expect(response.json().result).toBe('24254')
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
})
