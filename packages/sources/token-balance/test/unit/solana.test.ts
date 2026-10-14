import { SolanaTransport } from '../../src/transport/solana'
import { getToken } from '../../src/transport/solana-utils'

jest.mock('@chainlink/external-adapter-framework/transports/abstract/subscription', () => {
  return {
    SubscriptionTransport: class {},
  }
})

const token = 'tbill'
const ownerAddress = 'G7v3P9yPtBj1e3JN7B6dq4zbkrrW3e2ovdwAkSTKuUFG'
const tokenMintContractAddress = '4MmJVdwYN8LwvbGeCowYjSx7KoEi6BJWg8XXnW4fDDp6'
const RESULT_DECIMALS = 18

jest.mock('../../src/transport/solana-utils')

describe('solanaTransport._handleRequest', () => {
  let transport: SolanaTransport

  beforeEach(() => {
    transport = new SolanaTransport()
    transport.connection = {} as any
    jest.clearAllMocks()
  })

  it('fetches balances, calculates correct result', async () => {
    const tokenBalanceValue = 1000
    const tokenBalanceDecimals = 6
    const expectedBalance = tokenBalanceValue
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
      addresses: [{ address: ownerAddress }],
      tokenMint: {
        token: token,
        contractAddress: tokenMintContractAddress,
      },
    })

    expect(getToken).toHaveBeenCalledWith(
      [
        {
          token: 'tbill',
          contractAddress: tokenMintContractAddress,
          wallets: [ownerAddress],
        },
      ],
      'tbill',
      transport.connection,
    )
    expect(resp.statusCode).toBe(200)
    expect(resp.result).toBe(String(BigInt(expectedBalance * 10 ** RESULT_DECIMALS)))
  })

  it('test scaling of calculates correct result', async () => {
    const tokenBalanceValue = 10
    const tokenBalanceDecimals = 6

    const expectedBalance = tokenBalanceValue
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
      addresses: [{ address: ownerAddress }],
      tokenMint: {
        token: token,
        contractAddress: tokenMintContractAddress,
      },
    })

    expect(getToken).toHaveBeenCalledWith(
      [
        {
          token: 'tbill',
          contractAddress: tokenMintContractAddress,
          wallets: [ownerAddress],
        },
      ],
      'tbill',
      transport.connection,
    )

    expect(resp.statusCode).toBe(200)
    expect(resp.result).toBe(String(BigInt(expectedBalance * 10 ** RESULT_DECIMALS)))
  })

  it('propagates getToken errors', async () => {
    jest.mocked(getToken).mockRejectedValue(new Error('balance fail'))

    await expect(
      transport._handleRequest({
        addresses: [{ address: ownerAddress }],
        tokenMint: {
          token: token,
          contractAddress: tokenMintContractAddress,
        },
      }),
    ).rejects.toThrow('balance fail')
  })

  it('test scaling with multiple balances, calculates correct aggregated result', async () => {
    const balances = [
      { value: 10, decimals: 6 },
      { value: 25, decimals: 6 },
      { value: 3, decimals: 6 },
    ]

    // Expected total balance (before scaling)
    const expectedBalance = balances.reduce((acc, b) => acc + b.value, 0)

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
      addresses: [{ address: ownerAddress }, { address: '0xAnother' }, { address: '0xThird' }],
      tokenMint: {
        token: token,
        contractAddress: tokenMintContractAddress,
      },
    })

    expect(getToken).toHaveBeenCalledWith(
      [
        {
          token: 'tbill',
          contractAddress: tokenMintContractAddress,
          wallets: [ownerAddress, '0xAnother', '0xThird'],
        },
      ],
      'tbill',
      transport.connection,
    )

    expect(resp.statusCode).toBe(200)

    // Scale the expected balance
    expect(resp.result).toBe(
      (BigInt(expectedBalance) * BigInt(10) ** BigInt(RESULT_DECIMALS)).toString(),
    )
  })

  it('throws error when multiple balances have different decimals', async () => {
    // Two balances with mismatched decimals
    const balances = [
      { value: 100, decimals: 6 },
      { value: 200, decimals: 8 },
    ]

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

    await expect(
      transport._handleRequest({
        addresses: [{ address: ownerAddress }, { address: '0xDiffDecimals' }],
        tokenMint: {
          token: token,
          contractAddress: tokenMintContractAddress,
        },
      }),
    ).rejects.toThrow('Inconsistent balance decimals: 6 != 8')
  })
})
