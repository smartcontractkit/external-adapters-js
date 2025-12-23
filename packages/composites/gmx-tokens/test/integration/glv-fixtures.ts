import { ethers } from 'ethers'
import nock from 'nock'
import { ChainContextFactory } from '../../src/transport/shared/chain'
import { dataStreamIdKey } from '../../src/transport/shared/token-prices'
import { SIGNED_PRICE_DECIMALS } from '../../src/transport/shared/utils'

export const WETH_ADDRESS = '0x82aF49447D8a07e3bd95BD0d56f35241523fBab1'
export const USDC_ADDRESS = '0xaf88d065e77c8cC2239327C5EDb3A432268e5831'
export const MARKET_TOKEN = '0x70d95587d40A2caf56bd97485aB3Eec10Bee6336'
export const DEFAULT_GLV_ADDRESS = '0x528A5bac7E746C9A509A1f4F6dF58A03d44279F9'

export const DEFAULT_TOKENS = [
  { symbol: 'WETH', address: WETH_ADDRESS, decimals: 18, synthetic: null },
  { symbol: 'USDC', address: USDC_ADDRESS, decimals: 6, synthetic: null },
]

export const DEFAULT_MARKETS = [
  {
    marketToken: MARKET_TOKEN,
    indexToken: WETH_ADDRESS,
    longToken: WETH_ADDRESS,
    shortToken: USDC_ADDRESS,
    isListed: true,
  },
]

const feedIdLookup: Record<string, string> = {
  [dataStreamIdKey(WETH_ADDRESS).toLowerCase()]: '0xfeedweth',
  [dataStreamIdKey(USDC_ADDRESS).toLowerCase()]: '0xfeedusdc',
}

const DEFAULT_MARKET_PRICES = {
  maximized: ethers.parseUnits('2.001', SIGNED_PRICE_DECIMALS),
  minimized: ethers.parseUnits('1.999', SIGNED_PRICE_DECIMALS),
}

const DEFAULT_GLV_PRICES = {
  maximized: ethers.parseUnits('1.501', SIGNED_PRICE_DECIMALS),
  minimized: ethers.parseUnits('1.499', SIGNED_PRICE_DECIMALS),
}

export const DEFAULT_DATA_ENGINE_RESPONSE = {
  bid: '1999000000000000000',
  ask: '2001000000000000000',
  decimals: 18,
}

let dataStoreSpy: jest.SpyInstance | undefined
let readerSpy: jest.SpyInstance | undefined
let glvReaderSpy: jest.SpyInstance | undefined
let currentGlvMarkets = DEFAULT_MARKETS.map((market) => market.marketToken)

export const applyChainContextMocks = () => {
  if (dataStoreSpy) return

  dataStoreSpy = jest.spyOn(ChainContextFactory.prototype as any, 'getDataStore').mockReturnValue({
    getBytes32: async (key: string) => feedIdLookup[key.toLowerCase()] ?? ethers.ZeroHash,
  })

  readerSpy = jest
    .spyOn(ChainContextFactory.prototype as any, 'getReaderContract')
    .mockReturnValue({
      getMarketTokenPrice: async (
        _dataStoreAddress: string,
        _markets: string[],
        _indexPrices: Array<[string, string]>,
        _longPrices: [string, string],
        _shortPrices: [string, string],
        _pnlFactor: string,
        maximize: boolean,
      ) => [maximize ? DEFAULT_MARKET_PRICES.maximized : DEFAULT_MARKET_PRICES.minimized],
    })

  glvReaderSpy = jest
    .spyOn(ChainContextFactory.prototype as any, 'getGlvReaderContract')
    .mockReturnValue({
      getGlvInfo: async () => ({
        glv: {
          glvToken: DEFAULT_GLV_ADDRESS,
          longToken: WETH_ADDRESS,
          shortToken: USDC_ADDRESS,
        },
        markets: currentGlvMarkets,
      }),
      getGlvTokenPrice: async (
        _dataStoreAddress: string,
        _markets: string[],
        _indexTokenPrices: Array<[string, string]>,
        _longTokenPrice: [string, string],
        _shortTokenPrice: [string, string],
        _glv: string,
        maximize: boolean,
      ) => [maximize ? DEFAULT_GLV_PRICES.maximized : DEFAULT_GLV_PRICES.minimized],
    })
}

export const resetChainContextMocks = () => {
  dataStoreSpy?.mockRestore()
  readerSpy?.mockRestore()
  glvReaderSpy?.mockRestore()
  dataStoreSpy = undefined
  readerSpy = undefined
  glvReaderSpy = undefined
  currentGlvMarkets = DEFAULT_MARKETS.map((market) => market.marketToken)
}

export const setGlvMarkets = (markets: string[]) => {
  currentGlvMarkets = markets
}

const getMetadataScope = (envVar: string) => {
  const rawUrl = process.env[envVar]
  if (!rawUrl) throw new Error(`${envVar} is not set`)
  const url = new URL(rawUrl)
  const scope = nock(`${url.protocol}//${url.host}`, { encodedQueryParams: true }).get(
    url.pathname || '/',
  )
  if (url.searchParams.toString()) {
    scope.query(Object.fromEntries(url.searchParams.entries()))
  }
  return scope
}

export const mockTokenInfoApiSuccess = (
  tokens = DEFAULT_TOKENS,
  envVar = 'ARBITRUM_TOKENS_INFO_URL',
): nock.Scope => getMetadataScope(envVar).reply(200, { tokens }).persist()

export const mockMarketInfoApiSuccess = (
  markets = DEFAULT_MARKETS,
  envVar = 'ARBITRUM_MARKETS_INFO_URL',
): nock.Scope => getMetadataScope(envVar).reply(200, { markets }).persist()

export const mockDataEngineEAResponseSuccess = (
  response = DEFAULT_DATA_ENGINE_RESPONSE,
): nock.Scope =>
  nock(process.env.DATA_ENGINE_ADAPTER_URL!)
    .post('/', (body) => body?.data?.endpoint === 'crypto-v3')
    .times(10)
    .reply(200, {
      data: response,
      statusCode: 200,
    })

export const mockDataEngineEAResponseFailure = (): nock.Scope =>
  nock(process.env.DATA_ENGINE_ADAPTER_URL!)
    .post('/', (body) => body?.data?.endpoint === 'crypto-v3')
    .times(10)
    .reply(500, { statusCode: 500 })
