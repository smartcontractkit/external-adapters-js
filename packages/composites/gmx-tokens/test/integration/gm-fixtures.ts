import nock from 'nock'
import { ChainKey } from '../../src/endpoint/gm-price'
import { ChainContextFactory } from '../../src/transport/shared/chain'
import { dataStreamIdKey } from '../../src/transport/shared/gmx-client'
import { SIGNED_PRICE_DECIMALS } from '../../src/transport/shared/utils'

export type TokenMetadata = {
  symbol: string
  address: string
  decimals: number
}

export type MarketMetadata = {
  marketToken: string
  indexToken: string
  longToken: string
  shortToken: string
  isListed: boolean
}

type ChainMockState = {
  feeds: Record<string, string>
  marketPrices: Record<string, { maximized: bigint; minimized: bigint }>
}

type GlvInfoMock = {
  glv: {
    glvToken: string
    longToken: string
    shortToken: string
  }
  markets: string[]
}

type GlvMockState = {
  infos: Record<string, GlvInfoMock>
  prices: Record<string, { maximized: bigint; minimized: bigint }>
}

const chainMocks = new Map<ChainKey, ChainMockState>()
const glvMocks = new Map<ChainKey, GlvMockState>()

const ZERO_HASH = '0x0000000000000000000000000000000000000000000000000000000000000000'
const CRYPTO_V3 = 'crypto-v3'

const WETH_ADDRESS = '0x82aF49447D8a07e3bd95BD0d56f35241523fBab1'
const USDC_ADDRESS = '0xaf88d065e77c8cC2239327C5EDb3A432268e5831'
const LINK_ADDRESS = '0xf97f4df75117a78c1A5a0DBb814Af92458539FB4'
const GM_LINK_MARKET = '0x7f1fa204bb700853D36994DA19F830b6Ad18455C'
const GLV_WETH_MARKET = '0x70d95587d40A2caf56bd97485aB3Eec10Bee6336'
const GLV_WETH_MARKET_AVAX = '0x62Cb8740E6986B29dC671B2EB596676f60590A5B'
const GLV_LONG_TOKEN_AVAX = '0x152b9d0fdc40c096757f570a51e494bd4b943e50'
const GLV_SHORT_TOKEN_AVAX = '0xA7D7079b0FEaD91F3e65f86E8915Cb59c1a4C664'

export const chainEnvMap = {
  arbitrum: {
    tokensEnv: 'ARBITRUM_TOKENS_INFO_URL',
    marketsEnv: 'ARBITRUM_MARKETS_INFO_URL',
  },
  botanix: {
    tokensEnv: 'BOTANIX_TOKENS_INFO_URL',
    marketsEnv: 'BOTANIX_MARKETS_INFO_URL',
  },
  avalanche: {
    tokensEnv: 'AVALANCHE_TOKENS_INFO_URL',
    marketsEnv: 'AVALANCHE_MARKETS_INFO_URL',
  },
} as const

export type ChainKeyName = keyof typeof chainEnvMap

export const DEFAULT_GLV_ADDRESS = '0x528A5bac7E746C9A509A1f4F6dF58A03d44279F9'
export const DEFAULT_GLV_INFO: Record<ChainKeyName, GlvInfoMock> = {
  arbitrum: {
    glv: {
      glvToken: DEFAULT_GLV_ADDRESS,
      longToken: WETH_ADDRESS,
      shortToken: USDC_ADDRESS,
    },
    markets: [GLV_WETH_MARKET],
  },
  botanix: {
    glv: {
      glvToken: DEFAULT_GLV_ADDRESS,
      longToken: WETH_ADDRESS,
      shortToken: USDC_ADDRESS,
    },
    markets: [GLV_WETH_MARKET],
  },
  avalanche: {
    glv: {
      glvToken: DEFAULT_GLV_ADDRESS,
      longToken: GLV_LONG_TOKEN_AVAX,
      shortToken: GLV_SHORT_TOKEN_AVAX,
    },
    markets: [GLV_WETH_MARKET_AVAX],
  },
}
const DEFAULT_GLV_PRICE = {
  maximized: '0x0e7b25fe03f0eda42ead663c4f',
  minimized: '0x0e7a4edfc978cf077056d4bea6',
}

const defaultFeedIds: Record<ChainKeyName, Record<string, string>> = {
  arbitrum: {
    [WETH_ADDRESS]: '0xfeedweth',
    [USDC_ADDRESS]: '0xfeedusdc',
  },
  botanix: {
    [WETH_ADDRESS]: '0xfeedweth',
    [USDC_ADDRESS]: '0xfeedusdc',
  },
  avalanche: {
    [GLV_LONG_TOKEN_AVAX]: '0xfeedbtcb',
    [GLV_SHORT_TOKEN_AVAX]: '0xfeedusdce',
  },
}

const matchCryptoV3Request = (body: unknown) =>
  typeof body === 'object' &&
  body !== null &&
  (body as any)?.data?.endpoint?.toLowerCase?.() === CRYPTO_V3

export const metadataUrls = [
  'ARBITRUM_TOKENS_INFO_URL',
  'BOTANIX_TOKENS_INFO_URL',
  'AVALANCHE_TOKENS_INFO_URL',
  'ARBITRUM_MARKETS_INFO_URL',
  'BOTANIX_MARKETS_INFO_URL',
  'AVALANCHE_MARKETS_INFO_URL',
] as const

const decimalToBigInt = (value: string): bigint => {
  const [integer = '0', fraction = ''] = value.split('.')
  const fractionPadded = (fraction + '0'.repeat(SIGNED_PRICE_DECIMALS)).slice(
    0,
    SIGNED_PRICE_DECIMALS,
  )
  const base = BigInt(integer) * BigInt(10) ** BigInt(SIGNED_PRICE_DECIMALS)
  return base + BigInt(fractionPadded || '0')
}

const toBigIntPrice = (value: bigint | number | string): bigint => {
  if (typeof value === 'bigint') return value
  if (typeof value === 'number') {
    return decimalToBigInt(value.toString())
  }
  if (value.startsWith('0x') || value.startsWith('0X')) {
    return BigInt(value)
  }
  if (value.includes('.')) {
    return decimalToBigInt(value)
  }
  return BigInt(value)
}

export const applyChainContextMocks = (): void => {
  if ((ChainContextFactory.prototype as any)._gmMocksApplied) {
    return
  }

  jest
    .spyOn(ChainContextFactory.prototype as any, 'getDataStore')
    .mockImplementation(function (this: ChainContextFactory, chain: ChainKey) {
      return {
        getBytes32: async (key: string) => {
          const state = ensureChainMock(chain)
          return state.feeds[key.toLowerCase()] ?? ZERO_HASH
        },
      }
    })

  jest
    .spyOn(ChainContextFactory.prototype as any, 'getReaderContract')
    .mockImplementation(function (this: ChainContextFactory, chain: ChainKey) {
      return {
        getMarketTokenPrice: async (
          _dataStoreAddress: string,
          markets: string[],
          _indexPrices: Array<[string, string]>,
          _longPrices: [string, string],
          _shortPrices: [string, string],
          _pnlFactor: string,
          maximize: boolean,
        ) => {
          const state = ensureChainMock(chain)
          const marketAddress = markets?.[0]?.toLowerCase()
          const prices = marketAddress ? state.marketPrices[marketAddress] : undefined
          if (!prices) return [0n]
          return [maximize ? prices.maximized : prices.minimized]
        },
      }
    })

  jest
    .spyOn(ChainContextFactory.prototype as any, 'getGlvReaderContract')
    .mockImplementation(function (this: ChainContextFactory, chain: ChainKey) {
      return {
        getGlvInfo: async (_dataStoreAddress: string, glv: string) => {
          const state = ensureGlvMock(chain)
          const info = state.infos[glv.toLowerCase()]
          if (!info) {
            throw new Error(`GLV info not mocked for ${glv}`)
          }
          return info
        },
        getGlvTokenPrice: async (
          _dataStoreAddress: string,
          _markets: string[],
          _indexTokenPrices: Array<[string, string]>,
          _longTokenPrice: [string, string],
          _shortTokenPrice: [string, string],
          glv: string,
          maximize: boolean,
        ) => {
          const state = ensureGlvMock(chain)
          const prices = state.prices[glv.toLowerCase()]
          if (!prices) return [0n]
          return [maximize ? prices.maximized : prices.minimized]
        },
      }
    })
  ;(ChainContextFactory.prototype as any)._gmMocksApplied = true
}

export const resetChainMocks = (): void => {
  chainMocks.clear()
  glvMocks.clear()
}

export const ensureChainMock = (chain: ChainKey) => {
  if (!chainMocks.has(chain)) {
    chainMocks.set(chain, { feeds: {}, marketPrices: {} })
  }
  return chainMocks.get(chain)!
}

const ensureGlvMock = (chain: ChainKey) => {
  if (!glvMocks.has(chain)) {
    glvMocks.set(chain, { infos: {}, prices: {} })
  }
  return glvMocks.get(chain)!
}

export const getChainMock = (chain: ChainKey): ChainMockState | undefined => chainMocks.get(chain)

type MarketPriceConfig = {
  maximized: bigint | number | string
  minimized: bigint | number | string
}

export type ChainRpcMockConfig = {
  feedIds?: Record<string, string>
  marketPrices?: Record<string, MarketPriceConfig>
}

export const mockChainRpc = (
  chain: ChainKey,
  config: ChainRpcMockConfig,
  options: { merge?: boolean } = {},
): void => {
  const feeds = Object.fromEntries(
    Object.entries(config.feedIds ?? {}).map(([address, feedId]) => [
      dataStreamIdKey(address).toLowerCase(),
      feedId.toLowerCase(),
    ]),
  )

  const marketPrices = Object.fromEntries(
    Object.entries(config.marketPrices ?? {}).map(([market, prices]) => [
      market.toLowerCase(),
      {
        maximized: toBigIntPrice(prices.maximized),
        minimized: toBigIntPrice(prices.minimized),
      },
    ]),
  )

  const state = ensureChainMock(chain)
  state.feeds = options.merge ? { ...state.feeds, ...feeds } : feeds
  state.marketPrices = options.merge ? { ...state.marketPrices, ...marketPrices } : marketPrices
}

export const mockGlvContracts = (
  chain: ChainKey,
  glvAddress: string,
  config: {
    info: GlvInfoMock
    price: { maximized: bigint | number | string; minimized: bigint | number | string }
  },
  options: { merge?: boolean } = {},
): void => {
  const state = ensureGlvMock(chain)
  const key = glvAddress.toLowerCase()
  state.infos[key] = options.merge ? { ...(state.infos[key] ?? {}), ...config.info } : config.info
  const nextPrice = {
    maximized: toBigIntPrice(config.price.maximized),
    minimized: toBigIntPrice(config.price.minimized),
  }
  state.prices[key] = options.merge ? { ...(state.prices[key] ?? {}), ...nextPrice } : nextPrice
}

export type DataEnginePriceConfig = {
  bid: string
  ask: string
  decimals: number
}

export const mockDataEnginePriceSuccess = (
  priceMap: Record<string, DataEnginePriceConfig>,
): nock.Scope =>
  nock(process.env.DATA_ENGINE_ADAPTER_URL!)
    .persist()
    .post('/', matchCryptoV3Request)
    .reply(200, (_, body: any) => {
      const feedId = body?.data?.feedId?.toLowerCase?.()
      const payload = feedId ? priceMap[feedId] : undefined
      if (!payload) {
        return [500, { statusCode: 500 }]
      }
      return {
        data: payload,
        statusCode: 200,
      }
    })

export const mockDataEnginePriceFailure = (): nock.Scope =>
  nock(process.env.DATA_ENGINE_ADAPTER_URL!)
    .persist()
    .post('/', matchCryptoV3Request)
    .reply(500, { statusCode: 500 })

export type ChainMetadata = {
  tokens: TokenMetadata[]
  markets: MarketMetadata[]
}

const mockPersistedJson = (url: string, payload: unknown): nock.Scope => {
  const targetUrl = new URL(url)
  return nock(targetUrl.origin).get(targetUrl.pathname).reply(200, payload).persist()
}

export const mockTokensInfo = (url: string, tokens: TokenMetadata[]): nock.Scope =>
  mockPersistedJson(url, { tokens })

export const mockMarketsInfo = (url: string, markets: MarketMetadata[]): nock.Scope =>
  mockPersistedJson(url, { markets })

const defaultChainMetadata: Record<ChainKeyName, ChainMetadata> = {
  arbitrum: {
    tokens: [
      { symbol: 'LINK', address: LINK_ADDRESS, decimals: 18 },
      { symbol: 'USDC', address: USDC_ADDRESS, decimals: 6 },
      { symbol: 'WETH', address: WETH_ADDRESS, decimals: 18 },
    ],
    markets: [
      {
        marketToken: GM_LINK_MARKET,
        indexToken: LINK_ADDRESS,
        longToken: LINK_ADDRESS,
        shortToken: USDC_ADDRESS,
        isListed: true,
      },
      {
        marketToken: GLV_WETH_MARKET,
        indexToken: WETH_ADDRESS,
        longToken: WETH_ADDRESS,
        shortToken: USDC_ADDRESS,
        isListed: true,
      },
    ],
  },
  botanix: {
    tokens: [
      { symbol: 'LINK', address: LINK_ADDRESS, decimals: 18 },
      { symbol: 'USDC', address: USDC_ADDRESS, decimals: 6 },
      { symbol: 'WETH', address: WETH_ADDRESS, decimals: 18 },
    ],
    markets: [
      {
        marketToken: GM_LINK_MARKET,
        indexToken: LINK_ADDRESS,
        longToken: LINK_ADDRESS,
        shortToken: USDC_ADDRESS,
        isListed: true,
      },
      {
        marketToken: GLV_WETH_MARKET,
        indexToken: WETH_ADDRESS,
        longToken: WETH_ADDRESS,
        shortToken: USDC_ADDRESS,
        isListed: true,
      },
    ],
  },
  avalanche: {
    tokens: [
      { symbol: 'BTC.b', address: GLV_LONG_TOKEN_AVAX, decimals: 8 },
      { symbol: 'USDC.e', address: GLV_SHORT_TOKEN_AVAX, decimals: 6 },
      { symbol: 'WETH', address: WETH_ADDRESS, decimals: 18 },
    ],
    markets: [
      {
        marketToken: GLV_WETH_MARKET_AVAX,
        indexToken: GLV_LONG_TOKEN_AVAX,
        longToken: GLV_LONG_TOKEN_AVAX,
        shortToken: GLV_SHORT_TOKEN_AVAX,
        isListed: true,
      },
    ],
  },
}

export const mockAllMetadata = (
  overrides: Partial<Record<ChainKeyName, Partial<ChainMetadata>>> = {},
): Array<() => void> => {
  return (Object.keys(chainEnvMap) as ChainKeyName[]).flatMap((chain) => {
    const tokensEnv = chainEnvMap[chain].tokensEnv
    const marketsEnv = chainEnvMap[chain].marketsEnv
    const baseConfig = defaultChainMetadata[chain]
    const tokens = overrides[chain]?.tokens ?? baseConfig.tokens
    const markets = overrides[chain]?.markets ?? baseConfig.markets

    const tokenScope = mockTokensInfo(process.env[tokensEnv]!, tokens)
    const marketScope = mockMarketsInfo(process.env[marketsEnv]!, markets)

    return [() => tokenScope.persist(false), () => marketScope.persist(false)]
  })
}

export const mockMetadataForChain = (
  chain: ChainKeyName,
  overrides?: Partial<ChainMetadata>,
): Array<() => void> => mockAllMetadata({ [chain]: overrides ?? {} })

export const ensureDefaultGlvMocks = (chain: ChainKeyName) => {
  mockGlvContracts(
    chain,
    DEFAULT_GLV_ADDRESS,
    {
      info: DEFAULT_GLV_INFO[chain],
      price: DEFAULT_GLV_PRICE,
    },
    { merge: true },
  )

  mockChainRpc(
    chain,
    {
      feedIds: defaultFeedIds[chain],
    },
    { merge: true },
  )
}
