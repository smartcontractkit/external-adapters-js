import { superstateApiKeyRequest, TransactionStatus } from '@superstateinc/api-key-request'
import { navTransport } from '../../src/transport/nav'
import { getNavPrice, getTransactions, multiply } from '../../src/transport/transactionUtils'

jest.mock('@superstateinc/api-key-request', () => ({
  superstateApiKeyRequest: jest.fn(),
  TransactionStatus: {
    Pending: 'pending',
  },
}))
jest.mock('../../src/transport/nav', () => ({
  navTransport: {
    execute: jest.fn(),
  },
}))

describe('getTransactions', () => {
  it('should successfully fetch and filter transactions', async () => {
    const mockSuperstateApiKeyRequest = superstateApiKeyRequest as jest.MockedFunction<
      typeof superstateApiKeyRequest
    >
    mockSuperstateApiKeyRequest.mockResolvedValue([
      { ticker: 'Btc', operation_type: 'Buy', created_at: '1' },
      { ticker: 'Btc', operation_type: 'Buy2', created_at: '2' },
      // Filter Logic
      { ticker: 'BTC', operation_type: 'Sell' },
      { ticker: 'Eth', operation_type: 'Buy' },
      // Missing fields
      { ticker: 'Btc' },
      { operation_type: 'Buy' },
      null,
      undefined,
      {},
    ])

    const result = await getTransactions(
      'test-api-key',
      'test-api-secret',
      'btc',
      TransactionStatus.Pending,
      ['buy', 'buy2'],
    )

    expect(mockSuperstateApiKeyRequest).toHaveBeenCalledWith({
      apiKey: 'test-api-key',
      apiSecret: 'test-api-secret',
      endpoint: 'v2/transactions',
      method: 'GET',
      queryParams: {
        transaction_status: TransactionStatus.Pending,
      },
    })

    expect(result).toEqual([
      { ticker: 'Btc', operation_type: 'Buy', created_at: '1' },
      { ticker: 'Btc', operation_type: 'Buy2', created_at: '2' },
    ])
  })

  it('should handle unll', async () => {
    const mockSuperstateApiKeyRequest = superstateApiKeyRequest as jest.MockedFunction<
      typeof superstateApiKeyRequest
    >
    mockSuperstateApiKeyRequest.mockResolvedValue(null)
    const result = await getTransactions(
      'test-api-key',
      'test-api-secret',
      'btc',
      TransactionStatus.Pending,
      ['buy', 'buy2'],
    )
    expect(result).toEqual([])
  })
})

describe('getNavPrice', () => {
  const mockNavExecute = navTransport.execute as jest.MockedFunction<typeof navTransport.execute>

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should successfully return nav price', async () => {
    mockNavExecute.mockResolvedValue({ result: 10.5 } as any)

    const result = await getNavPrice(1)

    expect(mockNavExecute).toHaveBeenCalledWith(1, 'net_asset_value')
    expect(result).toBe(10.5)
  })

  it('should throw error when report is not valid', async () => {
    mockNavExecute.mockResolvedValue(null as any)
    await expect(getNavPrice(1)).rejects.toThrow('Unable to fetch nav for 1, received null')

    mockNavExecute.mockResolvedValue({ result: null } as any)
    await expect(getNavPrice(1)).rejects.toThrow(
      'Unable to fetch nav for 1, received {"result":null}',
    )

    mockNavExecute.mockResolvedValue({ result: 0 } as any)
    await expect(getNavPrice(1)).rejects.toThrow('Unable to fetch nav for 1, received {"result":0}')
  })
})

describe('multiply', () => {
  it('should scale properly', async () => {
    expect(multiply(2, '1.1', '1.1')).toBe(121n)
    expect(multiply(2, '-1.1', '-1.1')).toBe(121n)
    expect(multiply(2, '1.1', '-1.1')).toBe(121n)
    expect(multiply(2, '-1.1', '1.1')).toBe(121n)
    expect(multiply(1, '1.1')).toBe(11n)
    expect(multiply(1, '-1.1')).toBe(11n)
    expect(multiply(18, '1.23456789')).toBe(1234567890000000000n)
    expect(multiply(18, '1.23456789', '1.23456789')).toBe(1524157875019052100n)
    expect(multiply(2, '1.1', '0')).toBe(0n)
  })
})
