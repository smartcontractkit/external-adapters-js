import { makeLogger } from '@chainlink/external-adapter-framework/util'
import { Requester } from '@chainlink/external-adapter-framework/util/requester'
import { ChainKey } from '../../endpoint/gm-price'
import { AdapterSettings, getResolvedChainSettings } from './chain'
import { Market, Token } from './utils'

type TokenResponse = { tokens: Token[] }
type MarketResponse = { markets: Market[] }

const logger = makeLogger('GmxClient')

export class GmxClient {
  private readonly tokenCache = new Map<ChainKey, TokenResponse>()
  private readonly marketCache = new Map<ChainKey, MarketResponse>()

  constructor(private readonly requester: Requester, private readonly settings: AdapterSettings) {
    const refreshInterval = this.settings.METADATA_REFRESH_INTERVAL_MS
    if (refreshInterval > 0) {
      setInterval(async () => {
        logger.debug('Refreshing cached GMX metadata')
        await this.refreshCache()
      }, refreshInterval).unref()
    }
  }

  private async refreshCache(): Promise<void> {
    for (const [chain, _] of this.tokenCache) {
      await this.refreshMetadata(chain, 'token', this.tokenCache)
    }
    for (const [chain, _] of this.marketCache) {
      await this.refreshMetadata(chain, 'market', this.marketCache)
    }
  }

  private async refreshMetadata<T>(
    chain: ChainKey,
    type: 'token' | 'market',
    cache: Map<ChainKey, T>,
  ): Promise<void> {
    try {
      const { tokenMetadataUrl, marketMetadataUrl } = getResolvedChainSettings(this.settings, chain)
      const url = type === 'token' ? tokenMetadataUrl : marketMetadataUrl
      const req = { url, method: 'GET', timeout: this.settings.GLV_INFO_API_TIMEOUT_MS }
      const { response } = await this.requester.request<T>(JSON.stringify(req), req)
      cache.set(chain, response.data)
    } catch (error) {
      logger.warn(
        `Failed to refresh ${type} metadata for ${chain}, keeping stale cache: ${
          (error as Error).message
        }`,
      )
    }
  }

  private async fetchMetadata<T>(
    chain: ChainKey,
    type: 'token' | 'market',
    cache: Map<ChainKey, T>,
  ): Promise<T> {
    const cached = cache.get(chain)
    if (cached) {
      return cached
    }

    const { tokenMetadataUrl, marketMetadataUrl } = getResolvedChainSettings(this.settings, chain)
    const url = type === 'token' ? tokenMetadataUrl : marketMetadataUrl

    const req = { url, method: 'GET', timeout: this.settings.GLV_INFO_API_TIMEOUT_MS }
    const { response } = await this.requester.request<T>(JSON.stringify(req), req)
    cache.set(chain, response.data)
    return response.data
  }

  async listTokens(chain: ChainKey): Promise<Token[]> {
    const data = await this.fetchMetadata<TokenResponse>(chain, 'token', this.tokenCache)
    return data.tokens
  }

  async getTokenBySymbol(symbol: string, chain: ChainKey): Promise<Token> {
    const tokens = await this.listTokens(chain)
    const target = symbol.toUpperCase()
    const token = tokens.find((item) => item.symbol.toUpperCase() === target)
    if (!token) {
      throw new Error(`Token with symbol "${symbol}" not found`)
    }
    return token
  }

  async getTokenByAddress(address: string, chain: ChainKey): Promise<Token> {
    const tokens = await this.listTokens(chain)
    const normalizedAddress = address.toLowerCase()
    const token = tokens.find((item) => item.address.toLowerCase() === normalizedAddress)
    if (!token) {
      throw new Error(`Token with address "${address}" not found`)
    }
    return token
  }

  async listMarkets(chain: ChainKey): Promise<Market[]> {
    const data = await this.fetchMetadata<MarketResponse>(chain, 'market', this.marketCache)
    return data.markets
  }

  async getMarketByToken(marketToken: string, chain: ChainKey): Promise<Market> {
    const markets = await this.listMarkets(chain)
    const normalized = marketToken.toLowerCase()
    const market = markets.find((item) => item.marketToken.toLowerCase() === normalized)
    if (!market) {
      throw new Error(`Market with token "${marketToken}" not found`)
    }
    return market
  }
}
