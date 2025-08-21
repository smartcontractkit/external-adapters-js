import { getTokenPrice } from '../../src/transport/priceFeed'
import { getTokenBalance } from '../../src/transport/solana'
import { SolanaTokenBalanceTransport } from '../../src/transport/solanaTokenBalance'

jest.mock('@chainlink/external-adapter-framework/transports/abstract/subscription', () => {
  return {
    SubscriptionTransport: class {},
  }
})

jest.mock('../../src/transport/priceFeed')
jest.mock('../../src/transport/solana')

describe('solanaTokenBalanceTransport._handleRequest', () => {
  let transport: SolanaTokenBalanceTransport

  beforeEach(() => {
    transport = new SolanaTokenBalanceTransport()
    transport.ethProvider = {} as any
    transport.arbProvider = {} as any
    transport.connection = {} as any
    jest.clearAllMocks()
  })

  it('fetches price and balances, calculates correct USD result', async () => {
    ;(getTokenPrice as jest.Mock).mockResolvedValue({ value: 1000n, decimal: 18 })
    ;(getTokenBalance as jest.Mock).mockResolvedValue({
      result: [{ value: 10n, decimals: 6 }],
    })

    const resp = await transport._handleRequest({
      addresses: [{ address: 'wallet1', network: 'SOLANA', chainId: '101' }],
      tokenMint: { token: 'TBILL', contractAddress: 'mint1' },
      priceOracle: { contractAddress: 'oracle1', chainId: '1', network: 'ethereum' },
    })

    expect(getTokenPrice).toHaveBeenCalledWith({
      priceOracleAddress: 'oracle1',
      priceOracleNetwork: 'ethereum',
    })
    expect(getTokenBalance).toHaveBeenCalledWith(
      [{ address: 'wallet1', network: 'SOLANA', chainId: '101' }],
      { token: 'TBILL', contractAddress: 'mint1' },
      transport.connection,
    )
    expect(resp.statusCode).toBe(200)
  })

  it('propagates getTokenPrice errors', async () => {
    ;(getTokenPrice as jest.Mock).mockRejectedValue(new Error('oracle fail'))

    await expect(
      transport._handleRequest({
        addresses: [{ address: 'wallet1', network: 'SOLANA', chainId: '101' }],
        tokenMint: { token: 'TBILL', contractAddress: 'mint1' },
        priceOracle: { contractAddress: 'oracle1', chainId: '1', network: 'ethereum' },
      }),
    ).rejects.toThrow('oracle fail')
  })

  it('propagates getTokenBalance errors', async () => {
    ;(getTokenPrice as jest.Mock).mockResolvedValue({ value: 1000n, decimal: 18 })
    ;(getTokenBalance as jest.Mock).mockRejectedValue(new Error('balance fail'))

    await expect(
      transport._handleRequest({
        addresses: [{ address: 'wallet1', network: 'SOLANA', chainId: '101' }],
        tokenMint: { token: 'TBILL', contractAddress: 'mint1' },
        priceOracle: { contractAddress: 'oracle1', chainId: '1', network: 'ethereum' },
      }),
    ).rejects.toThrow('balance fail')
  })
})
