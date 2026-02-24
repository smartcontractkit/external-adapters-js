import { Decimal } from 'decimal.js'
import {
  convertToUsd,
  getFeedAddress,
  isSupportedAsset,
  PriceData,
} from '../../src/transport/priceFeed'

describe('isSupportedAsset', () => {
  it('returns true for BTC', () => {
    expect(isSupportedAsset('BTC')).toBe(true)
  })

  it('returns true for lowercase btc', () => {
    expect(isSupportedAsset('btc')).toBe(true)
  })

  it('returns true for mixed case Btc', () => {
    expect(isSupportedAsset('Btc')).toBe(true)
  })

  it('returns true for ETH', () => {
    expect(isSupportedAsset('ETH')).toBe(true)
  })

  it('returns true for SOL', () => {
    expect(isSupportedAsset('SOL')).toBe(true)
  })

  it('returns true for USDC', () => {
    expect(isSupportedAsset('USDC')).toBe(true)
  })

  it('returns true for USDT', () => {
    expect(isSupportedAsset('USDT')).toBe(true)
  })

  it('returns true for USTB', () => {
    expect(isSupportedAsset('USTB')).toBe(true)
  })

  it('returns true for USYC', () => {
    expect(isSupportedAsset('USYC')).toBe(true)
  })

  it('returns true for OUSG', () => {
    expect(isSupportedAsset('OUSG')).toBe(true)
  })

  it('returns true for JTRSY', () => {
    expect(isSupportedAsset('JTRSY')).toBe(true)
  })

  it('returns false for unsupported DOGE', () => {
    expect(isSupportedAsset('DOGE')).toBe(false)
  })

  it('returns false for unsupported XRP', () => {
    expect(isSupportedAsset('XRP')).toBe(false)
  })

  it('returns false for empty string', () => {
    expect(isSupportedAsset('')).toBe(false)
  })
})

describe('getFeedAddress', () => {
  const mockSettings = {
    BTC_USD_FEED_ADDRESS: '0xBTC',
    ETH_USD_FEED_ADDRESS: '0xETH',
    SOL_USD_FEED_ADDRESS: '0xSOL',
    USDC_USD_FEED_ADDRESS: '0xUSDC',
    USDT_USD_FEED_ADDRESS: '0xUSDT',
    USYC_USD_FEED_ADDRESS: '0xUSYC',
    OUSG_USD_FEED_ADDRESS: '0xOUSG',
    JTRSY_USD_FEED_ADDRESS: '0xJTRSY',
  } as any

  it('returns BTC feed address for BTC', () => {
    expect(getFeedAddress('BTC', mockSettings)).toBe('0xBTC')
  })

  it('returns BTC feed address for lowercase btc', () => {
    expect(getFeedAddress('btc', mockSettings)).toBe('0xBTC')
  })

  it('returns ETH feed address for ETH', () => {
    expect(getFeedAddress('ETH', mockSettings)).toBe('0xETH')
  })

  it('returns SOL feed address for SOL', () => {
    expect(getFeedAddress('SOL', mockSettings)).toBe('0xSOL')
  })

  it('returns USDC feed address for USDC', () => {
    expect(getFeedAddress('USDC', mockSettings)).toBe('0xUSDC')
  })

  it('returns USDT feed address for USDT', () => {
    expect(getFeedAddress('USDT', mockSettings)).toBe('0xUSDT')
  })

  it('returns USYC feed address for USYC', () => {
    expect(getFeedAddress('USYC', mockSettings)).toBe('0xUSYC')
  })

  it('returns OUSG feed address for OUSG', () => {
    expect(getFeedAddress('OUSG', mockSettings)).toBe('0xOUSG')
  })

  it('returns JTRSY feed address for JTRSY', () => {
    expect(getFeedAddress('JTRSY', mockSettings)).toBe('0xJTRSY')
  })

  it('returns null for USTB (uses Superstate API instead)', () => {
    expect(getFeedAddress('USTB', mockSettings)).toBeNull()
  })

  it('returns null for unsupported currency', () => {
    expect(getFeedAddress('DOGE', mockSettings)).toBeNull()
  })

  it('returns null for empty string', () => {
    expect(getFeedAddress('', mockSettings)).toBeNull()
  })
})

describe('convertToUsd', () => {
  it('converts balance with 8 decimals correctly', () => {
    const balance = new Decimal('10')
    const priceData: PriceData = {
      price: new Decimal('10000000000000'), // $100,000 with 8 decimals
      decimals: 8,
    }
    const result = convertToUsd(balance, priceData)
    expect(result.toNumber()).toBe(1000000) // 10 * $100,000 = $1,000,000
  })

  it('converts balance with 18 decimals correctly', () => {
    const balance = new Decimal('5')
    const priceData: PriceData = {
      price: new Decimal('2000000000000000000000'), // $2000 with 18 decimals
      decimals: 18,
    }
    const result = convertToUsd(balance, priceData)
    expect(result.toNumber()).toBe(10000) // 5 * $2000 = $10,000
  })

  it('handles zero balance', () => {
    const balance = new Decimal('0')
    const priceData: PriceData = {
      price: new Decimal('350000000000'), // $3500 with 8 decimals
      decimals: 8,
    }
    const result = convertToUsd(balance, priceData)
    expect(result.toNumber()).toBe(0)
  })

  it('handles fractional balance', () => {
    const balance = new Decimal('0.5')
    const priceData: PriceData = {
      price: new Decimal('100000000'), // $1 with 8 decimals
      decimals: 8,
    }
    const result = convertToUsd(balance, priceData)
    expect(result.toNumber()).toBe(0.5) // 0.5 * $1 = $0.50
  })

  it('handles large balance values', () => {
    const balance = new Decimal('1000000')
    const priceData: PriceData = {
      price: new Decimal('100000000'), // $1 with 8 decimals
      decimals: 8,
    }
    const result = convertToUsd(balance, priceData)
    expect(result.toNumber()).toBe(1000000) // 1,000,000 * $1 = $1,000,000
  })

  it('preserves precision with decimal.js', () => {
    const balance = new Decimal('123.456789')
    const priceData: PriceData = {
      price: new Decimal('350000000000'), // $3500 with 8 decimals
      decimals: 8,
    }
    const result = convertToUsd(balance, priceData)
    // 123.456789 * 3500 = 432098.7615
    expect(result.toFixed(4)).toBe('432098.7615')
  })
})
