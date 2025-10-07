import { Requester } from '@chainlink/external-adapter-framework/util/requester'
import { ChainKey } from '../endpoint/price'
import { GmTokenTransportTypes } from './price'

export type TokenMeta = { address: string; decimals: number; symbol: string }
type TokensResp = { tokens: Array<{ symbol: string; address: string; decimals: number }> }

/**
 * Fetches token metadata (address/decimals) per chain from GMX API.
 */
export class TokenResolver {
  private readonly urls: Record<ChainKey, string>

  constructor(private readonly requester: Requester, settings: GmTokenTransportTypes['Settings']) {
    this.urls = {
      arbitrum: settings.ARBITRUM_TOKENS_INFO_URL,
      botanix: settings.BOTANIX_TOKENS_INFO_URL,
    }
  }

  async getToken(chain: ChainKey, symbol: string): Promise<TokenMeta> {
    const req = { url: this.urls[chain], method: 'GET' as const }
    const { response } = await this.requester.request<TokensResp>(JSON.stringify(req), req)
    const target = symbol.toUpperCase()
    const token = response.data.tokens.find((x) => x.symbol.toUpperCase() === target)
    if (!token) {
      throw new Error(`Token with symbol "${symbol}" not found on ${chain}`)
    }
    return { symbol: token.symbol, address: token.address, decimals: token.decimals }
  }
}
