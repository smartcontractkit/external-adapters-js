import { OraclePriceType, toBigIntBalance } from '../../src/transport/utils'
import { WalletsTransport } from '../../src/transport/wallets'

const RESULT_DECIMALS = 18

describe('WalletsTransport.computeUsdValue', () => {
  let transport: WalletsTransport

  beforeEach(() => {
    transport = new WalletsTransport()
  })

  it('scales 6-decimal price correctly', async () => {
    const balances = {
      USDC: { value: 1000n * 10n ** 18n, decimals: RESULT_DECIMALS }, // 1000 USDC
    }
    const prices: Record<string, OraclePriceType> = {
      USDC: { value: BigInt(1_000_000), decimal: 6 }, // 1.0
    }

    const result = await transport.computeUsdValue(balances, prices)
    expect(result.USDC.value).toBe(1000n * 10n ** 18n)
  })

  it('scales 8-decimal price correctly', async () => {
    const balances = {
      BTC: { value: 2n * 10n ** 18n, decimals: RESULT_DECIMALS }, // 2 BTC
    }
    const prices: Record<string, OraclePriceType> = {
      BTC: { value: BigInt(50_000_000_000_000), decimal: 8 }, // 500,000
    }

    const result = await transport.computeUsdValue(balances, prices)
    expect(result.BTC.value).toBe(1_000_000n * 10n ** 18n) // 2 * 500k
  })

  it('handles 18-decimal price correctly', async () => {
    const balances = {
      ETH: { value: 1n * 10n ** 18n, decimals: RESULT_DECIMALS }, // 1 ETH
    }
    const prices: Record<string, OraclePriceType> = {
      ETH: { value: 2000n * 10n ** 18n, decimal: 18 }, // 2000
    }

    const result = await transport.computeUsdValue(balances, prices)
    expect(result.ETH.value).toBe(2000n * 10n ** 18n)
  })
})

describe('WalletsTransport.getAggregatedWalletBalance', () => {
  let transport: WalletsTransport

  beforeEach(() => {
    transport = new WalletsTransport()
    jest.spyOn(transport, 'getWalletBalance').mockResolvedValue({
      wallets: [
        { currency: 'ETH', totalBalance: '1' },
        { currency: 'ETH', totalBalance: '2' },
        { currency: 'USDC', totalBalance: '100' },
      ],
    } as any)
  })

  it('aggregates balances by currency', async () => {
    const balances = await transport.getAggregatedWalletBalance({} as any, {} as any)

    expect(balances.ETH.value).toBe(toBigIntBalance('3', RESULT_DECIMALS))
    expect(balances.USDC.value).toBe(toBigIntBalance('100', RESULT_DECIMALS))
  })
})
