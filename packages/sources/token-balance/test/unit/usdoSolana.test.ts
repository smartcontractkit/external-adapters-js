import { AdapterInputError } from '@chainlink/external-adapter-framework/validation/error'
import { getRate } from '../../src/transport/priceFeed'
import { USDOSolanaTransport } from '../../src/transport/usdoSolana'
import { getTokenBalance } from '../../src/transport/utils'

jest.mock('@chainlink/external-adapter-framework/transports/abstract/subscription', () => {
  return {
    SubscriptionTransport: class {},
  }
})

jest.mock('../../src/transport/priceFeed')
jest.mock('../../src/transport/utils')

describe('USDOSolanaTransport._handleRequest', () => {
  let transport: USDOSolanaTransport
  const context: any = {
    adapterSettings: {
      ETHEREUM_RPC_CHAIN_ID: '1',
      ARBITRUM_RPC_CHAIN_ID: '42161',
      BACKGROUND_EXECUTE_MS: 10,
    },
  }

  beforeEach(() => {
    transport = new USDOSolanaTransport()
    transport.ethProvider = {} as any
    transport.arbProvider = {} as any
    transport.connection = {} as any
    jest.clearAllMocks()
  })

  it('uses ethProvider when chainId matches Ethereum', async () => {
    ;(getRate as jest.Mock).mockResolvedValue({ value: 1000n, decimal: 18 })
    ;(getTokenBalance as jest.Mock).mockResolvedValue({
      result: [{ value: 10n, decimals: 6 }],
    })

    const resp = await transport._handleRequest(context, {
      addresses: [{ address: 'wallet1', network: 'BASE', chainId: '8453' }],
      tokenMint: { token: 'TBILL', contractAddress: 'mint1' },
      priceOracle: { contractAddress: 'oracle1', chainId: '1' },
    })

    expect(getRate).toHaveBeenCalledWith('oracle1', transport.ethProvider)
    expect(getTokenBalance).toHaveBeenCalledWith(
      [{ address: 'wallet1', network: 'BASE', chainId: '8453' }],
      { token: 'TBILL', contractAddress: 'mint1' },
      transport.connection,
    )
    expect(resp.statusCode).toBe(200)
  })

  it('uses arbProvider when chainId matches Arbitrum', async () => {
    ;(getRate as jest.Mock).mockResolvedValue({ value: 2000n, decimal: 18 })
    ;(getTokenBalance as jest.Mock).mockResolvedValue({
      result: [{ value: 20n, decimals: 6 }],
    })

    const resp = await transport._handleRequest(context, {
      addresses: [{ address: 'wallet2', network: 'BASE', chainId: '8453' }],
      tokenMint: { token: 'TBILL', contractAddress: 'mint2' },
      priceOracle: { contractAddress: 'oracle2', chainId: '42161' },
    })

    expect(getRate).toHaveBeenCalledWith('oracle2', transport.arbProvider)
    expect(resp.statusCode).toBe(200)
  })

  it('throws AdapterInputError on unsupported chainId', async () => {
    await expect(
      transport._handleRequest(context, {
        addresses: [{ address: 'wallet1', network: 'BASE', chainId: '8453' }],
        tokenMint: { token: 'TBILL', contractAddress: 'mintX' },
        priceOracle: { contractAddress: 'oracleX', chainId: '999' },
      }),
    ).rejects.toThrow(AdapterInputError)
  })

  it('propagates getRate errors', async () => {
    ;(getRate as jest.Mock).mockRejectedValue(new Error('oracle fail'))

    await expect(
      transport._handleRequest(context, {
        addresses: [{ address: 'wallet1', network: 'BASE', chainId: '8453' }],
        tokenMint: { token: 'TBILL', contractAddress: 'mint1' },
        priceOracle: { contractAddress: 'oracle1', chainId: '1' },
      }),
    ).rejects.toThrow('oracle fail')
  })

  it('propagates getTokenBalance errors', async () => {
    ;(getRate as jest.Mock).mockResolvedValue({ value: 1000n, decimal: 18 })
    ;(getTokenBalance as jest.Mock).mockRejectedValue(new Error('balance fail'))

    await expect(
      transport._handleRequest(context, {
        addresses: [{ address: 'wallet1', network: 'BASE', chainId: '8453' }],
        tokenMint: { token: 'TBILL', contractAddress: 'mint1' },
        priceOracle: { contractAddress: 'oracle1', chainId: '1' },
      }),
    ).rejects.toThrow('balance fail')
  })
})
