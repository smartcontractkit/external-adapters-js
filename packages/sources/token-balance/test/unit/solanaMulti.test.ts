import { getTokenPrice } from '../../src/transport/priceFeed'
import { getToken } from '../../src/transport/solana-utils'
import { SolanaMultiTransport } from '../../src/transport/solanaMulti'

jest.mock('@chainlink/external-adapter-framework/transports/abstract/subscription', () => {
  return {
    SubscriptionTransport: class {},
  }
})

const token = 'wbtc'
const ownerAddress = 'G7v3P9yPtBj1e3JN7B6dq4zbkrrW3e2ovdwAkSTKuUFG'
const tokenMintContractAddress = '4MmJVdwYN8LwvbGeCowYjSx7KoEi6BJWg8XXnW4fDDp6'
const priceOracleAddress = '0xCe9a6626Eb99eaeA829D7fA613d5D0A2eaE45F40'
const RESULT_DECIMALS = 18

jest.mock('../../src/transport/priceFeed')
jest.mock('../../src/transport/solana-utils')

describe('solanaTransport._handleRequest', () => {
  let transport: SolanaMultiTransport

  beforeEach(() => {
    transport = new SolanaMultiTransport()
    transport.connection = {} as any
    jest.clearAllMocks()
  })

  it('fetches price and balances, calculates correct USD result', async () => {
    const tokenBalanceValue = 1000
    const tokenPriceValue = 44
    const tokenPriceDecimals = 8
    const tokenBalanceDecimals = 6
    const expectedUsdBalance = tokenBalanceValue * tokenPriceValue
    jest.mocked(getTokenPrice).mockResolvedValue({
      value: BigInt(tokenPriceValue * 10 ** tokenPriceDecimals),
      decimal: tokenPriceDecimals,
    })
    jest.mocked(getToken).mockResolvedValue({
      result: [
        {
          value: BigInt(tokenBalanceValue * 10 ** tokenBalanceDecimals),
          decimals: tokenBalanceDecimals,
        },
      ],
      formattedResponse: [
        {
          token: tokenMintContractAddress,
          wallet: ownerAddress,
          value: (tokenBalanceValue * 10 ** tokenBalanceDecimals).toString(),
          decimals: tokenBalanceDecimals,
        },
      ],
    })

    const resp = await transport._handleRequest({
      addresses: [
        {
          token,
          network: 'solana',
          contractAddress: tokenMintContractAddress,
          wallets: [ownerAddress],
        },
      ],
      token,
      priceOracle: {
        contractAddress: priceOracleAddress,
        network: 'ethereum',
      },
    })

    expect(getTokenPrice).toHaveBeenCalledWith({
      priceOracleAddress: priceOracleAddress,
      priceOracleNetwork: 'ethereum',
    })
    expect(getToken).toHaveBeenCalledWith(
      [
        {
          token,
          network: 'solana',
          contractAddress: tokenMintContractAddress,
          wallets: [ownerAddress],
        },
      ],
      token,
      transport.connection,
    )
    expect(resp.statusCode).toBe(200)
    expect(resp.result).toBe(String(BigInt(expectedUsdBalance * 10 ** RESULT_DECIMALS)))
  })

  it('skips conversion if no price oracle is specified', async () => {
    const tokenBalanceValue = 1000
    const tokenBalanceDecimals = 6
    jest.mocked(getToken).mockResolvedValue({
      result: [
        {
          value: BigInt(tokenBalanceValue * 10 ** tokenBalanceDecimals),
          decimals: tokenBalanceDecimals,
        },
      ],
      formattedResponse: [
        {
          token: tokenMintContractAddress,
          wallet: ownerAddress,
          value: (tokenBalanceValue * 10 ** tokenBalanceDecimals).toString(),
          decimals: tokenBalanceDecimals,
        },
      ],
    })

    const resp = await transport._handleRequest({
      addresses: [
        {
          token,
          network: 'solana',
          contractAddress: tokenMintContractAddress,
          wallets: [ownerAddress],
        },
      ],
      token,
    })

    expect(getTokenPrice).not.toHaveBeenCalled()
    expect(getToken).toHaveBeenCalledWith(
      [
        {
          token,
          network: 'solana',
          contractAddress: tokenMintContractAddress,
          wallets: [ownerAddress],
        },
      ],
      token,
      transport.connection,
    )
    expect(resp.statusCode).toBe(200)
    expect(resp.result).toBe(String(BigInt(tokenBalanceValue * 10 ** RESULT_DECIMALS)))
  })

  it('test scaling of calculates correct USD result', async () => {
    const tokenBalanceValue = 10
    const tokenBalanceDecimals = 6
    const tokenPriceValue = 9
    const tokenPriceDecimals = 8

    const expectedUsdBalance = tokenBalanceValue * tokenPriceValue
    jest.mocked(getTokenPrice).mockResolvedValue({
      value: BigInt(tokenPriceValue * 10 ** tokenPriceDecimals),
      decimal: tokenPriceDecimals,
    })
    jest.mocked(getToken).mockResolvedValue({
      result: [
        {
          value: BigInt(tokenBalanceValue * 10 ** tokenBalanceDecimals),
          decimals: tokenBalanceDecimals,
        },
      ],
      formattedResponse: [
        {
          token: tokenMintContractAddress,
          wallet: ownerAddress,
          value: (tokenBalanceValue * 10 ** tokenBalanceDecimals).toString(),
          decimals: tokenBalanceDecimals,
        },
      ],
    })

    const resp = await transport._handleRequest({
      addresses: [
        {
          token,
          network: 'solana',
          contractAddress: tokenMintContractAddress,
          wallets: [ownerAddress],
        },
      ],
      token,
      priceOracle: {
        contractAddress: priceOracleAddress,
        network: 'ethereum',
      },
    })

    expect(getTokenPrice).toHaveBeenCalledWith({
      priceOracleAddress: priceOracleAddress,
      priceOracleNetwork: 'ethereum',
    })
    expect(getToken).toHaveBeenCalledWith(
      [
        {
          token,
          network: 'solana',
          contractAddress: tokenMintContractAddress,
          wallets: [ownerAddress],
        },
      ],
      token,
      transport.connection,
    )

    expect(resp.statusCode).toBe(200)
    expect(resp.result).toBe(String(BigInt(expectedUsdBalance * 10 ** RESULT_DECIMALS)))
  })

  it('propagates getTokenPrice errors', async () => {
    jest.mocked(getTokenPrice).mockRejectedValue(new Error('oracle fail'))

    await expect(
      transport._handleRequest({
        addresses: [
          {
            token,
            network: 'solana',
            contractAddress: tokenMintContractAddress,
            wallets: [ownerAddress],
          },
        ],
        token,
        priceOracle: {
          contractAddress: priceOracleAddress,
          network: 'ethereum',
        },
      }),
    ).rejects.toThrow('oracle fail')
  })

  it('propagates getToken errors', async () => {
    const tokenPriceValue = 9
    const tokenPriceDecimals = 8

    jest.mocked(getTokenPrice).mockResolvedValue({
      value: BigInt(tokenPriceValue * 10 ** tokenPriceDecimals),
      decimal: tokenPriceDecimals,
    })
    jest.mocked(getToken).mockRejectedValue(new Error('balance fail'))

    await expect(
      transport._handleRequest({
        addresses: [
          {
            token,
            network: 'solana',
            contractAddress: tokenMintContractAddress,
            wallets: [ownerAddress],
          },
        ],
        token,
        priceOracle: {
          contractAddress: priceOracleAddress,
          network: 'ethereum',
        },
      }),
    ).rejects.toThrow('balance fail')
  })

  it('test scaling with multiple balances, calculates correct aggregated USD result', async () => {
    const tokenPriceValue = 9
    const tokenPriceDecimals = 8

    const balances = [
      { value: 10, decimals: 6 },
      { value: 25, decimals: 6 },
      { value: 3, decimals: 6 },
    ]

    // Expected total USD balance (before scaling)
    const expectedUsdBalance = balances.reduce((acc, b) => acc + b.value * tokenPriceValue, 0)

    jest.mocked(getTokenPrice).mockResolvedValue({
      value: BigInt(tokenPriceValue * 10 ** tokenPriceDecimals),
      decimal: tokenPriceDecimals,
    })

    jest.mocked(getToken).mockResolvedValue({
      result: balances.map((b) => ({
        value: BigInt(b.value * 10 ** b.decimals),
        decimals: b.decimals,
      })),
      formattedResponse: balances.map((b) => ({
        token: 'mockToken',
        wallet: 'mockWallet',
        value: b.value,
        decimals: b.decimals,
      })),
    })

    const resp = await transport._handleRequest({
      addresses: [
        {
          token,
          network: 'solana',
          contractAddress: tokenMintContractAddress,
          wallets: [ownerAddress, '0xAnother', '0xThird'],
        },
      ],
      token,
      priceOracle: {
        contractAddress: priceOracleAddress,
        network: 'ethereum',
      },
    })

    expect(getTokenPrice).toHaveBeenCalledWith({
      priceOracleAddress: priceOracleAddress,
      priceOracleNetwork: 'ethereum',
    })

    expect(getToken).toHaveBeenCalledWith(
      [
        {
          token,
          network: 'solana',
          contractAddress: tokenMintContractAddress,
          wallets: [ownerAddress, '0xAnother', '0xThird'],
        },
      ],
      token,
      transport.connection,
    )

    expect(resp.statusCode).toBe(200)

    // Scale the expected USD balance
    expect(resp.result).toBe(
      (BigInt(expectedUsdBalance) * BigInt(10) ** BigInt(RESULT_DECIMALS)).toString(),
    )
  })

  it('works when multiple balances have different decimals', async () => {
    const tokenPriceValue = 5
    const tokenPriceDecimals = 8

    // Two balances with mismatched decimals
    const balances = [
      { value: 100, decimals: 6 },
      { value: 200, decimals: 8 },
    ]

    // Expected total USD balance (before scaling)
    const expectedUsdBalance = balances.reduce((acc, b) => acc + b.value * tokenPriceValue, 0)

    jest.mocked(getTokenPrice).mockResolvedValue({
      value: BigInt(tokenPriceValue * 10 ** tokenPriceDecimals),
      decimal: tokenPriceDecimals,
    })

    // Mock mismatched balances
    jest.mocked(getToken).mockResolvedValue({
      result: balances.map((b) => ({
        value: BigInt(b.value * 10 ** b.decimals),
        decimals: b.decimals,
      })),
      formattedResponse: balances.map((b) => ({
        token: 'mockToken',
        wallet: 'mockWallet',
        value: b.value,
        decimals: b.decimals,
      })),
    })

    const resp = await transport._handleRequest({
      addresses: [
        {
          token,
          network: 'solana',
          contractAddress: tokenMintContractAddress,
          wallets: [ownerAddress, '0xDiffDecimals'],
        },
      ],
      token,
      priceOracle: {
        contractAddress: priceOracleAddress,
        network: 'ethereum',
      },
    })

    expect(getTokenPrice).toHaveBeenCalledWith({
      priceOracleAddress: priceOracleAddress,
      priceOracleNetwork: 'ethereum',
    })
    expect(getToken).toHaveBeenCalledWith(
      [
        {
          token,
          network: 'solana',
          contractAddress: tokenMintContractAddress,
          wallets: [ownerAddress, '0xDiffDecimals'],
        },
      ],
      token,
      transport.connection,
    )
    expect(resp.statusCode).toBe(200)
    expect(resp.result).toBe(String(BigInt(expectedUsdBalance * 10 ** RESULT_DECIMALS)))
  })
})
