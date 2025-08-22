import { getTokenPrice } from '../../src/transport/priceFeed'
import { SolanaTransport } from '../../src/transport/solana'
import { getTokenBalance } from '../../src/transport/solana-utils'

jest.mock('@chainlink/external-adapter-framework/transports/abstract/subscription', () => {
  return {
    SubscriptionTransport: class {},
  }
})

jest.mock('../../src/transport/priceFeed')
jest.mock('../../src/transport/solana-utils')

describe('solanaTransport._handleRequest', () => {
  let transport: SolanaTransport

  beforeEach(() => {
    transport = new SolanaTransport()
    transport.connection = {} as any
    jest.clearAllMocks()
  })

  it('fetches price and balances, calculates correct USD result', async () => {
    jest.mocked(getTokenPrice).mockResolvedValue({ value: 4489670000n, decimal: 8 })
    jest.mocked(getTokenBalance).mockResolvedValue({
      result: [{ value: 1000000000n, decimals: 6 }],
    })

    const resp = await transport._handleRequest({
      addresses: [{ address: 'G7v3P9yPtBj1e3JN7B6dq4zbkrrW3e2ovdwAkSTKuUFG', network: 'SOLANA' }],
      tokenMint: {
        token: 'TBILL',
        contractAddress: '4MmJVdwYN8LwvbGeCowYjSx7KoEi6BJWg8XXnW4fDDp6',
      },
      priceOracle: {
        contractAddress: '0xCe9a6626Eb99eaeA829D7fA613d5D0A2eaE45F40',
        chainId: '1',
        network: 'ethereum',
      },
    })

    expect(getTokenPrice).toHaveBeenCalledWith({
      priceOracleAddress: '0xCe9a6626Eb99eaeA829D7fA613d5D0A2eaE45F40',
      priceOracleNetwork: 'ethereum',
    })
    expect(getTokenBalance).toHaveBeenCalledWith(
      [{ address: 'G7v3P9yPtBj1e3JN7B6dq4zbkrrW3e2ovdwAkSTKuUFG', network: 'SOLANA' }],
      { token: 'TBILL', contractAddress: '4MmJVdwYN8LwvbGeCowYjSx7KoEi6BJWg8XXnW4fDDp6' },
      transport.connection,
    )
    expect(resp.statusCode).toBe(200)
    expect(resp.result).toBe('44896700000000000000000')
    expect(resp.data).toEqual({
      result: '44896700000000000000000',
      decimals: 18,
    })
  })

  it('test scaling of calculates correct USD result', async () => {
    jest.mocked(getTokenPrice).mockResolvedValue({ value: 900000000n, decimal: 8 })
    jest.mocked(getTokenBalance).mockResolvedValue({
      result: [{ value: 10000000n, decimals: 6 }],
    })

    const resp = await transport._handleRequest({
      addresses: [{ address: 'G7v3P9yPtBj1e3JN7B6dq4zbkrrW3e2ovdwAkSTKuUFG', network: 'SOLANA' }],
      tokenMint: {
        token: 'TBILL',
        contractAddress: '4MmJVdwYN8LwvbGeCowYjSx7KoEi6BJWg8XXnW4fDDp6',
      },
      priceOracle: {
        contractAddress: '0xCe9a6626Eb99eaeA829D7fA613d5D0A2eaE45F40',
        chainId: '1',
        network: 'ethereum',
      },
    })

    expect(getTokenPrice).toHaveBeenCalledWith({
      priceOracleAddress: '0xCe9a6626Eb99eaeA829D7fA613d5D0A2eaE45F40',
      priceOracleNetwork: 'ethereum',
    })
    expect(getTokenBalance).toHaveBeenCalledWith(
      [{ address: 'G7v3P9yPtBj1e3JN7B6dq4zbkrrW3e2ovdwAkSTKuUFG', network: 'SOLANA' }],
      { token: 'TBILL', contractAddress: '4MmJVdwYN8LwvbGeCowYjSx7KoEi6BJWg8XXnW4fDDp6' },
      transport.connection,
    )

    expect(resp.statusCode).toBe(200)
    expect(resp.result).toBe('90000000000000000000')

    expect(resp.data).toEqual({
      result: '90000000000000000000',
      decimals: 18,
    })
  })

  it('propagates getTokenPrice errors', async () => {
    jest.mocked(getTokenPrice).mockRejectedValue(new Error('oracle fail'))

    await expect(
      transport._handleRequest({
        addresses: [{ address: 'G7v3P9yPtBj1e3JN7B6dq4zbkrrW3e2ovdwAkSTKuUFG', network: 'SOLANA' }],
        tokenMint: {
          token: 'TBILL',
          contractAddress: '4MmJVdwYN8LwvbGeCowYjSx7KoEi6BJWg8XXnW4fDDp6',
        },
        priceOracle: {
          contractAddress: '0xCe9a6626Eb99eaeA829D7fA613d5D0A2eaE45F40',
          chainId: '1',
          network: 'ethereum',
        },
      }),
    ).rejects.toThrow('oracle fail')
  })

  it('propagates getTokenBalance errors', async () => {
    jest.mocked(getTokenPrice).mockResolvedValue({ value: 1000n, decimal: 18 })
    jest.mocked(getTokenBalance).mockRejectedValue(new Error('balance fail'))

    await expect(
      transport._handleRequest({
        addresses: [{ address: 'G7v3P9yPtBj1e3JN7B6dq4zbkrrW3e2ovdwAkSTKuUFG', network: 'SOLANA' }],
        tokenMint: {
          token: 'TBILL',
          contractAddress: '4MmJVdwYN8LwvbGeCowYjSx7KoEi6BJWg8XXnW4fDDp6',
        },
        priceOracle: {
          contractAddress: '0xCe9a6626Eb99eaeA829D7fA613d5D0A2eaE45F40',
          chainId: '1',
          network: 'ethereum',
        },
      }),
    ).rejects.toThrow('balance fail')
  })
})
