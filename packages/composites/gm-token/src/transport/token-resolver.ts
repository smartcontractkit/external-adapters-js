import { Requester } from '@chainlink/external-adapter-framework/util/requester'
import { GmTokenTransportTypes } from './price'

export type ChainKey = 'arbitrum' | 'botanix'
export type TokenMeta = { address: string; decimals: number; symbol: string }

type TokensResp = { tokens: Array<{ symbol: string; address: string; decimals: number }> }

/**
 * Fetches and caches token metadata (address/decimals) per chain.
 * Refreshes on TTL expiry
 */
export class TokenResolver {
  private cache: Record<ChainKey, { timestamp: number; symbolToToken: Record<string, TokenMeta> }> =
    {
      arbitrum: { timestamp: 0, symbolToToken: {} },
      botanix: { timestamp: 0, symbolToToken: {} },
    }

  private readonly urls: Record<ChainKey, string>
  private readonly ttlMs: number

  constructor(private readonly requester: Requester, settings: GmTokenTransportTypes['Settings']) {
    this.urls = {
      arbitrum: settings.ARBITRUM_TOKENS_INFO_URL,
      botanix: settings.BOTANIX_TOKENS_INFO_URL,
    }
    this.ttlMs = settings.GMX_TOKENS_CACHE_MS
  }

  async get(chain: ChainKey, symbol: string): Promise<TokenMeta | undefined> {
    const now = Date.now()
    if (now - this.cache[chain].timestamp > this.ttlMs) {
      await this.refresh(chain)
    }
    return this.cache[chain].symbolToToken[symbol.toUpperCase()]
  }

  private async refresh(chain: ChainKey) {
    const req = { url: this.urls[chain], method: 'GET' as const }
    const resp = await this.requester.request<TokensResp>(JSON.stringify(req), req)
    const map: Record<string, TokenMeta> = {}
    for (const t of resp.response.data.tokens) {
      map[t.symbol.toUpperCase()] = { address: t.address, decimals: t.decimals, symbol: t.symbol }
    }
    this.cache[chain] = { timestamp: Date.now(), symbolToToken: map }
  }
}
