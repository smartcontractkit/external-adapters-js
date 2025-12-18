import { Requester } from '@chainlink/external-adapter-framework/util/requester'
import { ChainKey } from '../endpoint/gm-price'
import { GmTransportTypes } from './gm-price'

export type TokenMeta = { address: string; decimals: number; symbol: string }
type TokensResp = { tokens: Array<{ symbol: string; address: string; decimals: number }> }

const CHAIN_TOKEN_URL_KEY: Record<ChainKey, keyof GmTransportTypes['Settings']> = {
  arbitrum: 'ARBITRUM_TOKENS_INFO_URL',
  botanix: 'BOTANIX_TOKENS_INFO_URL',
  avalanche: 'AVALANCHE_TOKENS_INFO_URL',
}

export class TokenResolver {
  constructor(
    private readonly requester: Requester,
    private readonly settings: GmTransportTypes['Settings'],
  ) {}

  async getToken(chain: ChainKey, symbol: string): Promise<TokenMeta> {
    const url = this.settings[CHAIN_TOKEN_URL_KEY[chain]]
    if (!url || typeof url !== 'string') {
      throw new Error(`Token metadata URL not configured for ${chain}`)
    }
    const req = { url, method: 'GET' as const }
    const { response } = await this.requester.request<TokensResp>(JSON.stringify(req), req)
    const target = symbol.toUpperCase()
    const token = response.data.tokens.find((x) => x.symbol.toUpperCase() === target)
    if (!token) {
      throw new Error(`Token with symbol "${symbol}" not found on ${chain}`)
    }
    return { symbol: token.symbol, address: token.address, decimals: token.decimals }
  }
}
